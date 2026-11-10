#!/bin/sh
# Safe startup for rooted LG webOS 3.x.
#
# IMPORTANT: Never auto-launch Infiniti, redirect native Home/Live TV or read
# physical remote devices at boot. Doing so caused repeated wake/black-screen
# reports. Leave LG's own launcher and wake pipeline in full control.
#
# Optional background services can be opted into *separately*, after the TV
# survives at least two normal power/standby cycles. They never launch UI.
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
DIR=/home/root/lg-tv-vibehack
LOG=/tmp/lg-tv-vibehack.log

if [ ! -f "$DIR/boot-services-enabled" ]; then
  echo "$(date) Infiniti boot SAFE MODE: no autostart, no Home watcher" >> "$LOG"
  exit 0
fi

echo "$(date) Infiniti boot services requested (no launcher autostart)" >> "$LOG"
# This is background maintenance ONLY; no Home key hooks or UI launches.
# The service is delayed to avoid competing with the LG compositor on wake.
nohup setsid sh -c '
  sleep 45
  D=/home/root/lg-tv-vibehack
  [ -f "$D/boot-services-enabled" ] || exit 0
  [ -f "$D/sync.js" ] && /usr/bin/node "$D/sync.js" || true
  [ -f "$D/boot-services-enabled" ] || exit 0
  if [ -f "$D/wallpaper-server.js" ] &&
     ! ps | grep "[w]allpaper-server.js" | grep -v grep >/dev/null 2>&1; then
    exec /usr/bin/node "$D/wallpaper-server.js"
  fi
' >> "$LOG" 2>&1 < /dev/null &
exit 0
