#!/bin/sh
# webOS Homebrew startup script; all helpers are rooted sidecars, not part of the IPK.
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
DIR=/home/root/lg-tv-vibehack
LOG=/tmp/lg-tv-vibehack.log
echo "$(date) boot" >> "$LOG"
if [ -f "$DIR/home-enabled" ] && [ -f "$DIR/homewatch.js" ]; then
  if ! ps | grep '[h]omewatch.js' | grep -v grep >/dev/null 2>&1; then
    nohup setsid /usr/bin/node "$DIR/homewatch.js" --boot >> "$LOG" 2>&1 < /dev/null &
  fi
fi
# Start Infiniti as the preferred home at cold boot, after webOS app manager is ready.
# Do not remove LG Home: the original launcher remains the rollback fallback.
# Do not launch after disable, or when the package is missing.
if [ -f "$DIR/home-enabled" ]; then
  nohup setsid sh -c '
    sleep 12
    DATA=/home/root/lg-tv-vibehack
    APP=com.infinitimoney.tvhome
    [ -f "$DATA/home-enabled" ] || exit 0
    if [ ! -d "/media/developer/apps/usr/palm/applications/$APP" ] &&
       [ ! -d "/media/cryptofs/apps/usr/palm/applications/$APP" ]; then
      echo "Infiniti launcher missing; keeping LG Home"
      exit 0
    fi
    count=0
    while [ "$count" -lt 5 ]; do
      [ -f "$DATA/home-enabled" ] || exit 0
      if /usr/bin/luna-send -n 1 luna://com.webos.applicationManager/launch '"'"'{"id":"com.infinitimoney.tvhome"}'"'"' >/dev/null 2>&1; then
        echo "Infiniti TV Home started at boot"
        exit 0
      fi
      count=$((count + 1))
      sleep 3
    done
    echo "Launcher startup failed; leaving LG Home available"
  ' >> "$LOG" 2>&1 < /dev/null &
fi
# Never block wallpaper startup when launch point sync fails. Avoid duplicate services.
nohup setsid sh -c '
  sleep 30
  /usr/bin/node /home/root/lg-tv-vibehack/sync.js || true
  if ! ps | grep "[w]allpaper-server.js" | grep -v grep >/dev/null 2>&1; then
    exec /usr/bin/node /home/root/lg-tv-vibehack/wallpaper-server.js
  fi
' >> "$LOG" 2>&1 < /dev/null &
