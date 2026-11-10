#!/bin/sh
# Executed by LG Input Hook on remote HOME. Do not alter the LG Home application.
# A bounded trace tells whether Input Hook actually invoked this command.
APP_ID=com.infinitimoney.tvhome
DATA=/home/root/lg-tv-vibehack
LOG=/tmp/infiniti-homekey.log
log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG" 2>/dev/null || true; }
log "HOME Execute invoked (pid $$)"
if [ ! -f "$DATA/home-enabled" ]; then
  log "Inactive: home-enabled flag absent; leaving LG Home untouched"
  exit 1
fi
if [ ! -d "/media/developer/apps/usr/palm/applications/$APP_ID" ] &&
   [ ! -d "/media/cryptofs/apps/usr/palm/applications/$APP_ID" ]; then
  log "Launcher package missing: $APP_ID"
  exit 1
fi
reply=$(/usr/bin/luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.infinitimoney.tvhome"}' 2>&1)
rc=$?
if [ "$rc" -eq 0 ] && printf '%s' "$reply" | grep -q '"returnValue"[[:space:]]*:[[:space:]]*true'; then
  log "Launch accepted: $APP_ID"
  exit 0
fi
log "Launch failed (exit=$rc): $(printf '%s' "$reply" | head -c 280)"
# Do not launch com.webos.app.home as a fallback on legacy webOS 3.x:
# LG's original Home is a compositor ribbon, not an installed app.
exit 1
