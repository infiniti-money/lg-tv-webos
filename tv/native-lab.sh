#!/bin/sh
# Manual isolated lab only. Never attach to lginput2, tvservice or other LG process.
set -eu
D=/home/root/lg-tv-vibehack
CFG=/home/root/.config/lginputhook/keybinds.json
fail(){ echo "LAB_REFUSED: $*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || fail 'root required for ptrace'
[ "$#" = 2 ] || [ "$#" = 3 ] || fail 'usage: native-lab.sh DIRECTORY pass|ignore|cycle [multi|mixed]'
src=$1
mode=$2
variant=${3:-single}
case "$variant" in single|multi|mixed) ;; *) fail "invalid variant";; esac
case "$mode" in pass|ignore|cycle) ;; *) fail 'invalid mode';; esac
for c in sha256sum timeout mktemp readlink awk; do command -v "$c" >/dev/null || fail "$c missing"; done
if timeout -t 2 -s KILL true >/dev/null 2>&1; then
  bounded(){ timeout -t 20 -s KILL "$@"; }
elif timeout -k 1 2 true >/dev/null 2>&1; then
  bounded(){ timeout -k 2 20 "$@"; }
else fail 'unsupported timeout syntax'; fi
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
[ "$mode" != cycle ] || { [ -f "$CFG" ] && [ "$(cat "$CFG")" = '{}' ]; } || fail 'cycle requires exact existing empty config'
[ "$mode" = cycle ] || check_config || fail 'unexpected initial configuration'
umask 077
lock=/tmp/infiniti-native-lab.lock
mkdir "$lock" || fail 'another lab active or stale lock; inspect before removal'
work=
child=
backup="$D/native-lab-cycle-original.json"
last_config=
cycle_owned=0
completed=0
[ ! -e "$backup" ] || { rmdir "$lock"; fail "unresolved cycle backup: $backup"; }
stage(){ [ -n "$work" ] && printf "%s %s\n" "$(date +%s)" "$*" >> "$work/stages.log" || true; }
restore_cycle(){
  [ "$cycle_owned" = 1 ] || return 0
  if [ "$(cat "$CFG" 2>/dev/null || true)" = "$last_config" ]; then
    cp -p "$backup" "$CFG.lab-restore-$" && mv -f "$CFG.lab-restore-$" "$CFG" && rm -f "$backup" || return 1
  else
    echo "CONFIG CONFLICT: backup retained at $backup" >&2; return 1
  fi
  cycle_owned=0; stage config-restored
}
set_config(){
  [ "$(cat "$CFG")" = "$last_config" ] || fail "config changed externally"
  printf "%s\n" "$1" > "$CFG.lab-$"
  chmod 600 "$CFG.lab-$"
  mv -f "$CFG.lab-$" "$CFG"
  last_config=$1
}
reap_if_exited(){
  [ -n "$child" ] || return 0
  if [ ! -d "/proc/$child" ] || [ "$(awk '/^State:/ {print $2}' "/proc/$child/status" 2>/dev/null || true):$(awk '/^Threads:/ {print $2}' "/proc/$child/status" 2>/dev/null || true)" = Z:1 ]; then
    reap_rc=0; wait "$child" || reap_rc=$?
    printf "%s\n" "$reap_rc" > "$work/probe-exit-code"
    stage "probe-reaped rc=$reap_rc"; child=; return 0
  fi
  return 1
}
owned_child(){
  [ -n "$child" ] && [ "$(awk '/^PPid:/ {print $2}' "/proc/$child/status" 2>/dev/null || true)" = "$$" ]
}
cleanup(){
  rc=$?
  trap - 0
  trap '' INT TERM HUP
  stage "cleanup-start rc=$rc"
  exec 3>&- 3<&-
  if owned_child; then kill -KILL "$child" 2>/dev/null || true; stage cleanup-kill; fi
  n=0
  while ! reap_if_exited; do
    n=$((n+1)); [ "$n" -lt 5 ] || break
    sleep 1
  done
  restore_cycle || rc=1
  if [ -n "$child" ]; then
    stage "cleanup-incomplete pid=$child"; echo "LAB_CLEANUP_INCOMPLETE: inspect $work and $lock" >&2; rc=1
  else
    if [ -n "$work" ]; then rm -f "$work/commands" "$work/thumb-probe" "$work/ezinject" "$work/libinputhookpp.so" "$work/mock-launch.sh"; fi
    rmdir "$lock" 2>/dev/null || rc=1
  fi
  stage "final rc=$rc"
  if [ "$rc" = 0 ] && [ "$completed" = 1 ]; then echo "LAB_PASS: $mode; synthetic target only; not proof of physical LG Home interception"; fi
  exit "$rc"
}
trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM HUP
work=$(mktemp -d /tmp/infiniti-native-lab.XXXXXX)
echo "Lab evidence: $work"
stage setup
if [ "$mode" = cycle ]; then
  [ "$(cat "$CFG")" = "{}" ] || fail "config changed"
  cp -p "$CFG" "$backup"; last_config="{}"; cycle_owned=1
fi
printf "%s\n" "$variant" > "$work/variant"
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
      if reap_if_exited; then fail "probe exited before $1 (exit=$reap_rc); inspect probe.log"; fi
      [ "$1" = READY ] && owned_child || fail 'owned probe identity changed; injection not attempted'
      n=$((n+1)); sleep 1; continue
    fi
    count=$(grep -c "^$1$" "$work/probe.log" || true)
    [ "$count" -ge "$2" ] && return 0
    n=$((n+1)); sleep 1
  done
  fail "probe did not produce $1"
}
wait_line READY 1
stage ready
if [ "$variant" != single ]; then
  if [ "$variant" = mixed ]; then printf r >&3; else printf m >&3; fi
  wait_line MULTI_READY 1
  count=$(awk '/^Threads:/ {print $2}' "/proc/$child/status")
  [ "$count" -ge 7 ] || fail "expected seven preexisting threads, observed $count"
  echo "Pre-injection threads: $count"
fi
printf t >&3
wait_line PASS_THROUGH_OK 1
stage baseline-pass
if [ "$mode" = cycle ]; then [ "$(cat "$CFG")" = "$last_config" ] || fail "config changed"; else check_config || fail "config changed"; fi
# Only PID obtained from our own background child; no user PID argument.
[ "$(readlink "/proc/$child/exe")" = "$work/thumb-probe" ] || fail 'owned probe identity changed'
printf '%s\n' 'injector-starting' > "$work/stage"
if /usr/bin/node "$D/native-inject-observe.js" "$work" "$child" "$$" >"$work/inject.log" 2>&1; then rc=0; else rc=$?; fi
/usr/bin/node "$D/native-diagnostics.js" "$child" "$work" >"$work/diagnostics.json" 2>&1 || true
stage "injector-observer rc=$rc"
[ "$rc" = 0 ] || fail "injector failed; inspect inject-result.json and diagnostics.json"
sleep 2
[ "$(readlink "/proc/$child/exe" 2>/dev/null || true)" = "$work/thumb-probe" ] || fail 'probe died after injection'
grep -F "$work/libinputhookpp.so" "/proc/$child/maps" >/dev/null || fail 'library not mapped'
check_config || fail 'config changed'
printf t >&3
if [ "$mode" = ignore ]; then wait_line HOME_ONLY_IGNORED 1; else wait_line PASS_THROUGH_OK 2; fi
stage initial-hook-verified
reload_config(){
  before=$(grep -c 'Keybinds reloaded' "$work/hook.log" || true)
  # Older upstream polls mtime at seconds granularity.
  sleep 2
  set_config "$1"
  n=0
  while [ "$n" -lt 15 ]; do
    [ "$(cat "$CFG")" = "$last_config" ] || fail "config changed"
    after=$(grep -c 'Keybinds reloaded' "$work/hook.log" || true)
    [ "$after" -gt "$before" ] && return 0
    n=$((n+1)); sleep 1
  done
  fail 'config reload not observed'
}
if [ "$mode" = cycle ]; then
  reload_config '{"773":{"action":"ignore"}}'
  printf t >&3; wait_line HOME_ONLY_IGNORED 1; stage cycle-ignore
  reload_config '{}'
  printf t >&3; wait_line PASS_THROUGH_OK 3; stage cycle-pass-restored
  # Fixed mock writes evidence only, no Luna calls or system commands.
  printf '%s\n' '#!/bin/sh' "printf 'MOCK_LAUNCH\\n' >> '$work/mock-launch.log'" > "$work/mock-launch.sh"
  chmod 700 "$work/mock-launch.sh"
  reload_config "{\"773\":{\"action\":\"exec\",\"command\":\"/bin/sh $work/mock-launch.sh\"}}"
  printf t >&3; wait_line HOME_ONLY_IGNORED 2
  n=0
  while [ ! -s "$work/mock-launch.log" ] && [ "$n" -lt 10 ]; do n=$((n+1)); sleep 1; done
  sleep 2
  [ "$(cat "$work/mock-launch.log" 2>/dev/null || true)" = MOCK_LAUNCH ] || fail 'mock launch not exactly once'
  stage mock-exec-once
  reload_config '{}'
  printf t >&3; wait_line PASS_THROUGH_OK 4; stage cycle-final-pass
fi
grep -Eq 'uinput_code=773([^0-9]|$)' "$work/hook.log" || fail 'no observed Home hook call'
grep -Eq 'uinput_code=115([^0-9]|$)' "$work/hook.log" || fail 'no observed other-key hook call'
/usr/bin/node "$D/native-diagnostics.js" "$child" "$work" >"$work/diagnostics.json" || fail "post-hook diagnostics failed"
if grep -Eiq 'SIGILL|SIGSEGV|Illegal instruction|Segmentation fault' "$work/inject.log" "$work/hook.log"; then fail 'fault reported'; fi
stage quit-request
printf q >&3
exec 3>&- 3<&-
n=0
while ! reap_if_exited; do
  stage "exit-poll $(awk '/^State:|^Threads:/ {printf "%s ",$0}' "/proc/$child/status" 2>/dev/null || true)"
  [ "$n" -lt 8 ] || fail 'probe exit timed out; cleanup will attempt owned-child kill'
  n=$((n+1)); sleep 1
done
[ "$reap_rc" = 0 ] || fail "probe did not exit cleanly: $reap_rc"
restore_cycle || fail 'config restoration incomplete'
grep -qx QUIT_ACK "$work/probe.log" || fail "quit acknowledgement missing; use v1.7.8 probe"
stage lab-pass
completed=1
