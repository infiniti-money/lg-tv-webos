#!/bin/sh
# Manual single-target trial. No autostart, firmware modification or LG process kill.
set -eu
D=/home/root/lg-tv-vibehack
CFG=/home/root/.config/lginputhook/keybinds.json
SRC=/home/root/native-lab
STATE=/tmp/infiniti-native-home-trial
BACKUP="$D/native-trial-original.json"
KEY='{"773":{"action":"exec","command":"/bin/sh /home/root/lg-tv-vibehack/native-launch.sh"}}'
EXPECTED=2ba769a6f181f6bd686c6501020908ab7cb744718d3b0ff8e262164c8ba76c96
fail(){ echo "NATIVE_REFUSED: $*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || fail 'root required'
[ "$#" -ge 1 ] || fail 'usage: native-trial.sh preflight|trial --confirm-05.70.45 | recover'
empty_config(){ [ -f "$CFG" ] && [ "$(cat "$CFG")" = '{}' ]; }
restore(){
  [ ! -d "$STATE" ] || touch "$STATE/cancel"
  rm -f "$STATE/active"
  [ -f "$BACKUP" ] || { echo 'No saved trial config'; return 0; }
  if [ "$(cat "$CFG" 2>/dev/null || true)" = "$KEY" ]; then
    tmp="$CFG.infiniti-restore-$$"
    cp -p "$BACKUP" "$tmp" && mv -f "$tmp" "$CFG" || { echo 'RECOVERY_PARTIAL: restore failed'; return 1; }
  elif ! cmp -s "$BACKUP" "$CFG"; then
    echo 'RECOVERY_PARTIAL: config changed externally; backup retained'; return 1
  fi
  # Retain persistent backup until a subsequent explicit review; no automatic re-arm.
  echo "Mapping restored; wait for config reload. Library may remain mapped until reboot."
  echo "Evidence: $STATE"
}
case "$1" in
  recover) restore; exit ;;
  report) exec /usr/bin/node "$D/native-trial-proof.js" report ;;
  preflight|trial) ;;
  *) fail 'unknown operation' ;;
esac
for c in sha256sum timeout readlink pidof awk cmp; do command -v "$c" >/dev/null || fail "$c missing"; done
if timeout -t 2 -s KILL true >/dev/null 2>&1; then
  bounded(){ timeout -t 20 -s KILL "$@"; }
elif timeout -k 1 2 true >/dev/null 2>&1; then
  bounded(){ timeout -k 2 20 "$@"; }
else fail 'unsupported timeout'; fi
[ "$(uname -m)" = armv7l ] || fail 'not ARMv7'
pids=$(pidof lginput2 || true)
case "$pids" in ''|*[!0-9]*) fail 'expected exactly one lginput2 PID';; esac
p=$pids
start=$(awk '{print $22}' "/proc/$p/stat")
identity(){
  [ "$(pidof lginput2 || true)" = "$p" ] &&
  [ "$(readlink "/proc/$p/exe" 2>/dev/null || true)" = /usr/sbin/lginput2 ] &&
  [ "$(awk '{print $22}' "/proc/$p/stat" 2>/dev/null || true)" = "$start" ]
}
identity || fail 'lginput2 identity mismatch'
hash=$(sha256sum "/proc/$p/exe" | awk '{print $1}')
echo "lginput2 PID=$p SHA-256=$hash"
[ "$hash" = "$EXPECTED" ] || fail 'firmware binary fingerprint mismatch'
(cd /lib && printf '%s\n' 'd233b7d6d86582b1814b72740741e951264d9a89631781ac13fe66566c9904bf  libc-2.19.so' | sha256sum -c -) || fail 'libc mismatch'
(cd /usr/lib && printf '%s\n' 'cc4cc774ec21901bcf5fc226eb2eeda722bd9362edf4b509c1b17c38e42122d7  libim.so.1.0.0' | sha256sum -c -) || fail 'libim mismatch'
(cd /lib && printf '%s\n' '33c725259c618f54e2ce3e33fc30109ff12f177d0f500b4775994bd8de748e12  libstdc++.so.6.0.19' | sha256sum -c -) || fail 'libstdc++ mismatch'
for f in home-enabled home-event-device boot-home-armed boot-home-trial boot-home-enabled boot-services-enabled legacy-v8-session legacy-v8-armed legacy-v8-trial legacy-v8-enabled legacy-v8-wake legacy-v8-wallpaper legacy-v8-ribbon legacy-v8-fast; do
  [ ! -e "$D/$f" ] || fail "active flag $f"
done
for f in "$STATE" "$BACKUP" /tmp/inputhook /tmp/infiniti-native-lab.lock /tmp/infiniti-legacy-v8-lock /var/lib/webosbrew/init.d/inputhook /var/lib/webosbrew/init.d/97-homekey /var/lib/webosbrew/init.d/infiniti-legacy-v8 /media/developer/apps/usr/palm/applications/org.webosbrew.inputhook /media/cryptofs/apps/usr/palm/applications/org.webosbrew.inputhook /var/luna/preferences/webosbrew_failsafe; do
  [ ! -e "$f" ] || fail "existing state or conflicting hook: $f"
done
for q in $(pidof RELEASE lginput2 micomservice tvservice testapp 2>/dev/null || true); do
  [ -r "/proc/$q/maps" ] || fail "cannot inspect $q"
  if grep -Eq 'libphp\.so|libinputhookpp\.so' "/proc/$q/maps"; then fail "hook already mapped in $q"; fi
done
empty_config || fail 'expected existing empty config; no overwrite'
[ -d /media/developer/apps/usr/palm/applications/com.infinitimoney.tvhome ] || [ -d /media/cryptofs/apps/usr/palm/applications/com.infinitimoney.tvhome ] || fail 'launcher not installed'
verify_bins(){
 (cd "$1" && printf '%s\n' \
'3a03f5ea162651315cdbe710f6da815c8dd2650ea733e401a6cdce06943741b5  ezinject' \
'fc1cd1e207e9d0c1fadb3019e340c56ab68b031a77ed207cb3a55b2d8641c084  libinputhookpp.so' | sha256sum -c -)
}
verify_bins "$SRC" || fail 'upstream checksum mismatch'
echo 'PREFLIGHT_PASS: exact binary fingerprint; firmware display still requires owner confirmation'
[ "$1" = trial ] || exit 0
[ "$#" = 2 ] && [ "$2" = --confirm-05.70.45 ] || fail 'confirm TV Settings shows firmware 05.70.45; keep second SSH open'
umask 077
mkdir "$STATE" || fail 'trial state exists'
trap 'rc=$?; trap - 0; restore || rc=1; exit "$rc"' 0
trap 'exit 130' INT
trap 'exit 143' TERM HUP
cp -p "$CFG" "$BACKUP"
cp -p "$BACKUP" "$STATE/original"
printf '%s\n' "$p" > "$STATE/pid"
printf '%s\n' "$start" > "$STATE/start"
cp "$SRC/ezinject" "$SRC/libinputhookpp.so" "$STATE/"
verify_bins "$STATE" || fail 'copied binaries mismatch'
chmod 700 "$STATE/ezinject"
identity && empty_config || fail 'target/config changed'
bounded "$STATE/ezinject" -l "$STATE/hook.log" "$p" "$STATE/libinputhookpp.so" >"$STATE/inject.log" 2>&1 || fail 'inject failed or timed out; recover and inspect'
sleep 2
identity || fail 'target changed after injection'
grep -F "$STATE/libinputhookpp.so" "/proc/$p/maps" >/dev/null || fail 'library not mapped'
grep -F 'Replacing lginput_uinput_send_button' "$STATE/hook.log" >/dev/null || fail 'expected Thumb hook missing'
if grep -Eiq 'SIGILL|SIGSEGV|Illegal instruction|Segmentation fault' "$STATE/inject.log" "$STATE/hook.log"; then fail 'fault observed'; fi
echo 'PASS-THROUGH PHASE: test Volume, Back and cursor for 10 seconds; stop immediately if abnormal'
sleep 10
identity && empty_config && [ ! -e "$STATE/cancel" ] || fail 'target/config changed or canceled'
echo 'After confirming Volume, Back and cursor work, type YES to arm; anything else cancels.'
read answer || fail 'confirmation canceled'
[ "$answer" = YES ] && [ ! -e "$STATE/cancel" ] && identity && empty_config || fail 'trial canceled'
/usr/bin/node "$D/native-trial-proof.js" begin || fail 'cannot baseline ribbon logs'
echo 'ARMING 60-second trial; press Home from another app, then again while Tân Dev foreground'
printf '%s\n' "$(( $(date +%s) + 60 ))" > "$STATE/active"
tmp="$CFG.infiniti-trial-$$"
printf '%s\n' "$KEY" > "$tmp"
chmod 600 "$tmp"
[ ! -e "$STATE/cancel" ] || { rm -f "$tmp"; fail "trial canceled"; }
mv -f "$tmp" "$CFG"
[ ! -e "$STATE/cancel" ] || fail "trial canceled during mapping"
n=0
while [ "$n" -lt 60 ] && [ -f "$STATE/active" ]; do
  identity || fail 'lginput2 exited/restarted'
  [ ! -e "$STATE/cancel" ] || break
  [ "$(cat "$CFG")" = "$KEY" ] || fail 'config changed'
  sleep 1
  n=$((n+1))
done
echo 'TRIAL ENDED: restoring config; no automatic reboot'
