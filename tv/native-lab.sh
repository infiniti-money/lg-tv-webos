#!/bin/sh
# Manual isolated lab only. Never attach to lginput2, tvservice or other LG process.
set -eu
D=/home/root/lg-tv-vibehack
CFG=/home/root/.config/lginputhook/keybinds.json
fail(){ echo "LAB_REFUSED: $*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || fail 'root required for ptrace'
[ "$#" = 2 ] || fail 'usage: native-lab.sh DIRECTORY pass|ignore'
src=$1
mode=$2
case "$mode" in pass|ignore) ;; *) fail 'invalid mode';; esac
for c in sha256sum timeout mktemp readlink; do command -v "$c" >/dev/null || fail "$c missing"; done
for f in home-enabled home-event-device boot-home-armed boot-home-trial boot-home-enabled legacy-v8-session legacy-v8-armed legacy-v8-trial legacy-v8-enabled; do
  [ ! -e "$D/$f" ] || fail "active flag $f"
done
for f in /tmp/inputhook /tmp/infiniti-legacy-v8-lock /var/lib/webosbrew/init.d/inputhook /var/lib/webosbrew/init.d/97-homekey /media/developer/apps/usr/palm/applications/org.webosbrew.inputhook /media/cryptofs/apps/usr/palm/applications/org.webosbrew.inputhook; do
  [ ! -e "$f" ] || fail "existing hook/watcher: $f"
done
for p in $(pidof RELEASE lginput2 micomservice tvservice testapp 2>/dev/null || true); do
  [ -r "/proc/$p/maps" ] || fail "cannot inspect PID $p"
  if grep -Eq 'libphp\.so|libinputhookpp\.so' "/proc/$p/maps"; then fail "existing hook PID $p"; fi
done
for lib in libc.so.6 libdl.so.2 libpthread.so.0 libm.so.6 libgcc_s.so.1 ld-linux.so.3 librt.so.1; do
  [ -r "/lib/$lib" ] || [ -r "/usr/lib/$lib" ] || fail "missing dependency $lib"
done
# Upstream uses a fixed configuration path; never overwrite or fabricate it.
# Refuse other actions (in particular exec). An absent config is acceptable only
# for pass-through; upstream may report missing config, not an ABI failure.
check_config(){
  /usr/bin/node -e 'var fs=require("fs"),p=process.argv[1],m=process.argv[2],o;try{o=JSON.parse(fs.readFileSync(p,"utf8"));}catch(e){if(e.code==="ENOENT"&&m==="pass")process.exit(0);process.exit(1);}if(!o||typeof o!=="object"||Array.isArray(o))process.exit(1);var k=Object.keys(o);if(m==="pass")process.exit(k.length?1:0);var a=o["773"];process.exit(k.length===1&&a&&Object.keys(a).length===1&&a.action==="ignore"?0:1);' "$CFG" "$mode"
}
check_config || fail 'config must be absent/empty for pass, exactly Home ignore for ignore; no config modified'
umask 077
work=$(mktemp -d /tmp/infiniti-native-lab.XXXXXX)
echo "Lab evidence: $work"
child=
cleanup(){
  if [ -n "$child" ] && [ "$(readlink "/proc/$child/exe" 2>/dev/null || true)" = "$work/thumb-probe" ]; then
    kill -KILL "$child" 2>/dev/null || true
    wait "$child" 2>/dev/null || true
  fi
  rm -f "$work/commands" "$work/thumb-probe" "$work/ezinject" "$work/libinputhookpp.so"
}
trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM HUP
for f in thumb-probe ezinject libinputhookpp.so; do
  [ -f "$src/$f" ] || fail "missing $f"
  cp "$src/$f" "$work/$f"
done
(cd "$work" && printf '%s\n' \
'3a03f5ea162651315cdbe710f6da815c8dd2650ea733e401a6cdce06943741b5  ezinject' \
'fc1cd1e207e9d0c1fadb3019e340c56ab68b031a77ed207cb3a55b2d8641c084  libinputhookpp.so' | sha256sum -c -) || fail 'upstream hash mismatch'
[ -f "$src/thumb-probe.sha256" ] || fail 'missing build checksum'
expected=$(awk 'NR==1 {print $1}' "$src/thumb-probe.sha256")
actual=$(sha256sum "$work/thumb-probe" | awk '{print $1}')
[ "$expected" = "$actual" ] || fail 'probe hash mismatch'
chmod 700 "$work/thumb-probe" "$work/ezinject"
mkfifo "$work/commands"
exec 3<>"$work/commands"
"$work/thumb-probe" <&3 >"$work/probe.log" 2>&1 &
child=$!
wait_line(){
  n=0
  while [ "$n" -lt 10 ]; do
    if [ "$(readlink "/proc/$child/exe" 2>/dev/null || true)" != "$work/thumb-probe" ]; then
      [ "$1" = READY ] && kill -0 "$child" 2>/dev/null || fail 'owned probe exited or changed'
      n=$((n+1)); sleep 1; continue
    fi
    count=$(grep -c "^$1$" "$work/probe.log" || true)
    [ "$count" -ge "$2" ] && return 0
    n=$((n+1)); sleep 1
  done
  fail "probe did not produce $1"
}
wait_line READY 1
printf t >&3
wait_line PASS_THROUGH_OK 1
check_config || fail 'config changed'
# Only PID obtained from our own background child; no user PID argument.
[ "$(readlink "/proc/$child/exe")" = "$work/thumb-probe" ] || fail 'owned probe identity changed'
timeout -k 2 20 "$work/ezinject" -l "$work/hook.log" "$child" "$work/libinputhookpp.so" >"$work/inject.log" 2>&1 || fail 'injector failed or timed out'
sleep 2
[ "$(readlink "/proc/$child/exe" 2>/dev/null || true)" = "$work/thumb-probe" ] || fail 'probe died after injection'
grep -F "$work/libinputhookpp.so" "/proc/$child/maps" >/dev/null || fail 'library not mapped'
check_config || fail 'config changed'
printf t >&3
if [ "$mode" = pass ]; then wait_line PASS_THROUGH_OK 2; else wait_line HOME_ONLY_IGNORED 1; fi
grep -Eq 'uinput_code=773([^0-9]|$)' "$work/hook.log" || fail 'no observed Home hook call'
grep -Eq 'uinput_code=115([^0-9]|$)' "$work/hook.log" || fail 'no observed other-key hook call'
if grep -Eiq 'SIGILL|SIGSEGV|Illegal instruction|Segmentation fault' "$work/inject.log" "$work/hook.log"; then fail 'fault reported'; fi
printf q >&3
n=0
while [ "$(readlink "/proc/$child/exe" 2>/dev/null || true)" = "$work/thumb-probe" ]; do
  [ "$n" -lt 5 ] || fail "probe exit timed out"
  n=$((n+1)); sleep 1
done
[ ! -e "/proc/$child/exe" ] || fail "probe identity changed at exit"
wait "$child" || fail 'probe did not exit cleanly'
child=
echo "LAB_PASS: $mode; synthetic target only; not proof of physical LG Home interception"
