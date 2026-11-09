#!/bin/sh
# webOS Homebrew startup script; all helpers are rooted sidecars, not part of the IPK.
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
DIR=/home/root/lg-tv-vibehack
LOG=/tmp/lg-tv-vibehack.log
echo "$(date) boot" >> "$LOG"
if [ -f "$DIR/home-enabled" ] && [ -f "$DIR/homewatch.js" ]; then
  if ! ps | grep '[h]omewatch.js' | grep -v grep >/dev/null 2>&1; then
    nohup setsid /usr/bin/node "$DIR/homewatch.js" >> "$LOG" 2>&1 < /dev/null &
  fi
fi
# Never block wallpaper startup when launch point sync fails. Avoid duplicate services.
nohup setsid sh -c '
  sleep 30
  /usr/bin/node /home/root/lg-tv-vibehack/sync.js || true
  if ! ps | grep "[w]allpaper-server.js" | grep -v grep >/dev/null 2>&1; then
    exec /usr/bin/node /home/root/lg-tv-vibehack/wallpaper-server.js
  fi
' >> "$LOG" 2>&1 < /dev/null &
