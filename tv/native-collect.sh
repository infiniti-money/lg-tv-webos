#!/bin/sh
# Local offline evidence only. Never attach, execute a target, or upload LG binaries.
set -eu
umask 077
p=$(pidof lginput2 || true)
case "$p" in ''|*[!0-9]*) echo "Expected one lginput2" >&2; exit 1;; esac
[ "$(readlink "/proc/$p/exe")" = /usr/sbin/lginput2 ] || exit 1
start=$(awk '{print $22}' "/proc/$p/stat")
out=$(mktemp -d /home/root/lg-native-audit.XXXXXX)
echo "Local evidence: $out"
mkdir "$out/elf"
cp "/proc/$p/maps" "$out/maps.txt"
cp "/proc/$p/status" "$out/status.txt"
cp -L "/proc/$p/exe" "$out/elf/lginput2"
for t in /proc/"$p"/task/*; do
  echo "--- $t ---"
  grep -E '^(Name|State|TracerPid|Threads):' "$t/status" || true
  cat "$t/wchan" 2>/dev/null || true
done > "$out/threads.txt"
awk '$2 ~ /x/ && $6 ~ /^\/(lib|usr\/lib)\// {print $6}' "$out/maps.txt" | sort -u > "$out/paths.txt"
for n in libc.so.6 libpthread.so.0 libdl.so.2 libm.so.6 librt.so.1 libgcc_s.so.1 ld-linux.so.3 libstdc++.so.6 libim.so.1 libunwind.so.8 libunwind-arm.so.8; do
  for d in /lib /usr/lib; do
    if [ -f "$d/$n" ]; then printf '%s\n' "$d/$n" >> "$out/paths.txt"; break; fi
  done
done
sort -u "$out/paths.txt" > "$out/paths-sorted.txt"
while IFS= read -r f; do
  [ -f "$f" ] || { echo "MISSING $f" >> "$out/warnings.txt"; continue; }
  n=$(basename "$f")
  if [ -e "$out/elf/$n" ]; then
    cmp -s "$f" "$out/elf/$n" || { echo "COLLISION $f" >> "$out/warnings.txt"; exit 1; }
  else cp -L "$f" "$out/elf/$n"; fi
done < "$out/paths-sorted.txt"
for n in ezinject libinputhookpp.so; do
  cp "/home/root/native-lab/$n" "$out/elf/$n"
done
[ "$(pidof lginput2)" = "$p" ] && [ "$(awk '{print $22}' "/proc/$p/stat")" = "$start" ] || { echo "Process changed during snapshot; incomplete" >&2; exit 1; }
(cd "$out/elf" && sha256sum * > ../SHA256SUMS)
echo "COLLECTED: $out"
echo "Copy to your own computer for readelf; do not publish LG proprietary binaries."
