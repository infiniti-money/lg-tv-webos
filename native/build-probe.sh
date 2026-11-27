#!/bin/sh
set -eu
out=$1
mkdir -p "$out"
arm-linux-gnueabi-gcc -std=c11 -O2 -march=armv7-a -mthumb -mfloat-abi=softfp -mfpu=vfpv3 \
  -fno-pie -no-pie -fno-stack-protector -fno-builtin -fno-unwind-tables -fno-asynchronous-unwind-tables \
  -nostartfiles -nodefaultlibs -Wl,-e,_start,--export-dynamic,--hash-style=sysv,--dynamic-linker=/lib/ld-linux.so.3 \
  native/start.S native/thumb-probe.c -pthread -lc -o "$out/thumb-probe"
python3 - "$out/thumb-probe" <<'PY'
import re, subprocess, sys
p=sys.argv[1]
def elf(*args):
    return subprocess.check_output(['arm-linux-gnueabi-readelf',*args,p],text=True)
h=elf('-h')
assert 'ELF32' in h and 'ARM' in h and 'soft-float ABI' in h, h
assert '/lib/ld-linux.so.3' in elf('-l')
symbols=elf('--dyn-syms','--wide')
m=re.search(r'\b([0-9a-fA-F]+)\s+\d+\s+FUNC\s+GLOBAL\s+\w+\s+\d+\s+lginput_uinput_send_button\b',symbols)
assert m and int(m.group(1),16)&1, symbols
versions=re.findall(r'Name: GLIBC_(\d+(?:\.\d+)+)',elf('-V'))
assert versions and all(tuple(map(int,v.split('.'))) <= (2,19) for v in versions),versions
assert 'GLIBC_PRIVATE' not in elf('-V')
needed=set(re.findall(r'Shared library: \[([^]]+)\]',elf('-d')))
assert 'libc.so.6' in needed and needed <= {'libc.so.6','libpthread.so.0'},elf('-d')
print('ARM32 soft-float, exported Thumb target and legacy libc version gate:',versions)
PY
(cd "$out" && sha256sum thumb-probe > thumb-probe.sha256)
