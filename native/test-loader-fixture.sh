#!/bin/sh
set -eu
out=$1
legacy=$2
lib="$legacy/lib/arm-linux-gnueabi"
mkdir -p "$out"
for role in PROVIDER CONSUMER; do
  name=$(printf '%s' "$role" | tr A-Z a-z)
  arm-linux-gnueabi-gcc -march=armv7-a -mthumb -mfloat-abi=softfp -mfpu=vfpv3 -O0 -fPIC -shared -nostdlib \
    -D"$role" -Wl,-soname,liblab-"$name".so,-rpath-link,"$lib" \
    native/loader-fixture.c "$lib/libc-2.19.so" -o "$out/liblab-$name.so"
done
arm-linux-gnueabi-gcc -march=armv7-a -mthumb -mfloat-abi=softfp -mfpu=vfpv3 -O0 -fno-pie -no-pie -nostdlib \
  -Wl,-e,_start,--dynamic-linker=/lib/ld-linux.so.3,-rpath-link,"$lib",--no-as-needed \
  native/start.S native/loader-fixture.c "$lib/libdl-2.19.so" "$lib/libc-2.19.so" "$lib/ld-2.19.so" -o "$out/loader-fixture"
(cd "$out" && timeout 15 qemu-arm -E LD_BIND_NOW=1 "$lib/ld-2.19.so" --library-path "$lib" ./loader-fixture > fixture.log)
printf 'PROVIDER_INIT\nPROVIDER_READY\nCONSUMER_INIT\nINTERPOSITION_OBSERVED\n' > "$out/expected.log"
diff -u "$out/expected.log" "$out/fixture.log"
cat "$out/fixture.log"

# A separate toy consumer binds its own functions locally. No upstream hook
# binaries changed. This does not isolate data symbols or C++ ABI boundaries.
mkdir -p "$out/isolated"
cp "$out/liblab-provider.so" "$out/isolated/"
arm-linux-gnueabi-gcc -march=armv7-a -mthumb -mfloat-abi=softfp -mfpu=vfpv3 -O0 -fPIC -shared -nostdlib \
  -DCONSUMER -Wl,-Bsymbolic-functions,-soname,liblab-consumer.so,-rpath-link,"$lib" \
  native/loader-fixture.c "$lib/libc-2.19.so" -o "$out/isolated/liblab-consumer.so"
arm-linux-gnueabi-gcc -march=armv7-a -mthumb -mfloat-abi=softfp -mfpu=vfpv3 -O0 -fno-pie -no-pie -nostdlib \
  -DEXPECT_ISOLATED -Wl,-e,_start,--dynamic-linker=/lib/ld-linux.so.3,-rpath-link,"$lib",--no-as-needed \
  native/start.S native/loader-fixture.c "$lib/libdl-2.19.so" "$lib/libc-2.19.so" "$lib/ld-2.19.so" -o "$out/isolated/loader-fixture"
(cd "$out/isolated" && timeout 15 qemu-arm -E LD_BIND_NOW=1 "$lib/ld-2.19.so" --library-path "$lib" ./loader-fixture > fixture.log)
printf 'PROVIDER_INIT\nPROVIDER_READY\nCONSUMER_INIT\nFUNCTION_ISOLATION_OBSERVED\n' > "$out/isolated/expected.log"
diff -u "$out/isolated/expected.log" "$out/isolated/fixture.log"
cat "$out/isolated/fixture.log"
