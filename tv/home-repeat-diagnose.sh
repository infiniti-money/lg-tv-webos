#!/bin/sh
# Read-only 75-second Home reproduction on rooted webOS 3.x.
# Only writes a private diagnostic report in /tmp; never grabs or injects keys.
set -eu
D=/home/root/lg-tv-vibehack
[ "$(id -u)" = 0 ] || { echo 'Root required to observe evdev'; exit 1; }
[ -r "$D/legacy-luna.js" ] || { echo 'Install legacy root tools first'; exit 1; }
command -v python >/dev/null
umask 077
OUT=$(mktemp -d /tmp/infiniti-home-diag.XXXXXX)
EVENT_PID= FG_PID=
cleanup(){ [ -z "$EVENT_PID" ] || kill "$EVENT_PID" 2>/dev/null || :; [ -z "$FG_PID" ] || kill "$FG_PID" 2>/dev/null || :; }
trap cleanup EXIT
trap 'exit 130' INT TERM
snapshot(){
  echo "=== $1 $(date) ==="
  for f in session armed trial enabled wake wallpaper; do
    if [ -f "$D/legacy-v8-$f" ]; then echo "$f: ON"; else echo "$f: OFF"; fi
  done
  for f in "$D/home-enabled" /var/lib/webosbrew/init.d/97-homekey /var/lib/webosbrew/init.d/infiniti-legacy-v8 /var/luna/preferences/webosbrew_failsafe; do
    [ ! -e "$f" ] || echo "PRESENT: $f"
  done
  if [ -r /tmp/infiniti-legacy-v8-lock/pid ]; then
    pid=$(cat /tmp/infiniti-legacy-v8-lock/pid)
    case "$pid" in ''|*[!0-9]*) echo 'Invalid watcher PID';; *)
      if kill -0 "$pid" 2>/dev/null; then echo "Watcher PID $pid exists"; else echo "Watcher PID $pid absent"; fi;;
    esac
  else echo 'No watcher lock'; fi
  [ ! -r /tmp/infiniti-legacy-v8.log ] || tail -n 80 /tmp/infiniti-legacy-v8.log
}
snapshot BEFORE > "$OUT/state-before.txt"
python -u - > "$OUT/home-events.txt" 2>&1 <<'PY' &
from __future__ import print_function
import os, select, struct, time, errno
event = struct.Struct('<IIHHi')
fds = {}
deadline = time.time() + 75
refresh = 0
try:
    while time.time() < deadline:
        now = time.time()
        if now >= refresh:
            refresh = now + 2
            for name in sorted(os.listdir('/dev/input')):
                if not name.startswith('event') or not name[5:].isdigit():
                    continue
                path = '/dev/input/' + name
                if path in fds.values():
                    continue
                try:
                    fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK)
                    fds[fd] = path
                    print('%.3f OPEN %s' % (now, path))
                except OSError:
                    pass
        ready, _, _ = select.select(list(fds), [], [], 0.25)
        for fd in ready:
            try:
                data = os.read(fd, event.size * 32)
                if not data:
                    os.close(fd); del fds[fd]; continue
                for i in range(0, len(data) - event.size + 1, event.size):
                    sec, usec, kind, code, value = event.unpack(data[i:i+event.size])
                    if kind == 1 and code == 773:
                        print('%.3f %s HOME %s event=%.6f' % (time.time(), fds[fd], {0:'UP',1:'DOWN',2:'REPEAT'}.get(value,'OTHER'), sec + usec/1000000.0))
            except OSError as e:
                if e.errno not in (errno.EINTR, errno.EAGAIN):
                    os.close(fd); del fds[fd]
finally:
    for fd in fds:
        os.close(fd)
PY
EVENT_PID=$!
/usr/bin/node - "$D/legacy-luna.js" > "$OUT/foreground.txt" 2>&1 <<'JS' &
var helper=require(process.argv[2]),start=Date.now();
function poll(){
 if(Date.now()-start>=75000)return;
 helper.luna('luna://com.webos.applicationManager/getForegroundAppInfo',{},function(e,r){
  console.log((Date.now()/1000).toFixed(3)+' foreground '+(e?'QUERY_ERROR':String(r.appId||'UNKNOWN').replace(/[^a-zA-Z0-9._-]/g,'?')));
  setTimeout(poll,750);
 },null,1200);
}
poll();
JS
FG_PID=$!
mark(){ echo "$(date +%s) $*" | tee -a "$OUT/operator.txt"; }
mark '0s: Observe current screen, do not press Home.'
sleep 5
mark '5s: Press Home once. Observe whether Tân Dev opens.'
sleep 10
mark '15s: Press Home twice, approximately 0.5s apart. Observe final screen.'
sleep 15
mark '30s: If safe, open an app normally, then press Home once.'
sleep 15
mark '45s: Press Home, wait 5 seconds, press Home again.'
sleep 15
mark '60s: Press Home three times, about 1 second apart.'
sleep 15
wait "$EVENT_PID" || :
EVENT_PID=
wait "$FG_PID" || :
FG_PID=
snapshot AFTER > "$OUT/state-after.txt"
REPORT="$OUT/report.txt"
{
 echo '=== Home repeat diagnosis ==='
 echo 'LG ribbon may be visible even when foreground appId remains unchanged.'
 echo 'Record visible screen for each stage separately.'
 for f in operator.txt state-before.txt home-events.txt foreground.txt state-after.txt; do
   echo "=== $f ==="; cat "$OUT/$f"
 done
} > "$REPORT"
echo "Report: $REPORT"
echo 'Copy report via SSH. No key mappings, services or firmware modified.'
