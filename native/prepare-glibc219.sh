#!/bin/sh
# Obtain an archived, public ARM EABI glibc 2.19 runtime for CI only.
# Never install it on the TV or include it in the release.
set -eu
root=$1
mkdir -p "$root"
base=https://archive.debian.org/debian
curl --fail --location --retry 3 --max-time 120 "$base/dists/jessie/main/binary-armel/Packages.gz" -o "$root/Packages.gz"
python3 - "$root" <<'PY'
import gzip, pathlib, sys
root=pathlib.Path(sys.argv[1])
for record in gzip.open(root/'Packages.gz','rt',encoding='utf-8',errors='replace').read().split('\n\n'):
    fields=dict(line.split(': ',1) for line in record.splitlines() if ': ' in line and not line.startswith(' '))
    if fields.get('Package')=='libc6' and fields.get('Architecture')=='armel' and fields.get('Version')=='2.19-18+deb8u10':
        filename=fields['Filename']
        assert filename=='pool/main/g/glibc/libc6_2.19-18+deb8u10_armel.deb',filename
        digest=fields['SHA256']
        assert len(digest)==64
        (root/'package.sha256').write_text(digest+'  libc6.deb\n')
        break
else:
    raise SystemExit('Exact archived armel libc6 package not found')
PY
curl --fail --location --retry 3 --max-time 120 "$base/pool/main/g/glibc/libc6_2.19-18+deb8u10_armel.deb" -o "$root/libc6.deb"
(cd "$root" && sha256sum -c package.sha256)
dpkg-deb -x "$root/libc6.deb" "$root"
lib="$root/lib/arm-linux-gnueabi"
for f in libc-2.19.so libpthread-2.19.so ld-2.19.so; do
  test -f "$lib/$f"
done
