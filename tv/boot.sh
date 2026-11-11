#!/bin/sh
# Safe startup for rooted LG webOS 3.x.
#
# IMPORTANT: Never redirect native Home/Live TV or read physical remote
# devices at boot. An optional *manually armed* trial may attempt one Infiniti
# launch per cold boot, but never repeats on standby/wake or loops after failure.
#
# Optional background services can be opted into *separately*, after the TV
# survives at least two normal power/standby cycles. They never launch UI.
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
DIR=/home/root/lg-tv-vibehack
LOG=/tmp/lg-tv-vibehack.log

# Home 0x0305 (773) is captured by LG Input Hook, independently from boot.
# In safe mode, all of these flags are absent. Never arm from a timer.
if [ -f "$DIR/boot-home-armed" ] || [ -f "$DIR/boot-home-enabled" ]; then
  if [ -f "$DIR/home-enabled" ] &&
     [ -f "$DIR/boot-home-once.sh" ] &&
     [ ! -e /var/lib/webosbrew/init.d/97-homekey ]; then
    if [ -f "$DIR/boot-home-armed" ]; then
      # Consume trial flag BEFORE starting the helper. If the TV goes black
      # or power is cycled, the next boot is stock LG unless user confirms.
      if mv "$DIR/boot-home-armed" "$DIR/boot-home-trial"; then
        echo "$(date) Infiniti cold-boot trial armed (one-shot)" >> "$LOG"
        nohup setsid sh "$DIR/boot-home-once.sh" trial >> /tmp/infiniti-boot-home.log 2>&1 < /dev/null &
      fi
    else
      echo "$(date) Infiniti confirmed cold-boot launch requested" >> "$LOG"
      nohup setsid sh "$DIR/boot-home-once.sh" confirmed >> /tmp/infiniti-boot-home.log 2>&1 < /dev/null &
    fi
  else
    echo "$(date) Infiniti boot launch skipped: flags/scripts inconsistent or legacy hook present" >> "$LOG"
  fi
fi

if [ ! -f "$DIR/boot-services-enabled" ]; then
  if [ -f "$DIR/boot-home-enabled" ] || [ -f "$DIR/boot-home-trial" ]; then
    echo "$(date) Infiniti background maintenance off; cold-boot trial handled separately" >> "$LOG"
  else
    echo "$(date) Infiniti boot SAFE MODE: no autostart, no Home watcher" >> "$LOG"
  fi
  exit 0
fi

echo "$(date) Infiniti boot services requested (no launcher autostart)" >> "$LOG"
# The updater only starts when explicitly enabled by the root installer.
# It sleeps 20 minutes before its first check, and never launches any UI.
if [ -f "$DIR/auto-update-enabled" ] && [ -f "$DIR/auto-update.sh" ]; then
  if ! ps | grep '[a]uto-update.sh --watch' | grep -v grep >/dev/null 2>&1; then
    nohup setsid sh "$DIR/auto-update.sh" --watch >> /tmp/infiniti-auto-update.log 2>&1 < /dev/null &
  fi
fi
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
