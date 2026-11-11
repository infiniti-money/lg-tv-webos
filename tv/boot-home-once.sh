#!/bin/sh
# Deliberately opt-in: one bounded cold-boot activation for Infiniti TV Home.
# Never watches remote devices, never relaunches on standby/wake, never modifies
# the native LG Home. A trial requires manual confirmation before it persists.
set -u
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
D=/home/root/lg-tv-vibehack
APP=com.infinitimoney.tvhome
LOG=/tmp/infiniti-boot-home.log
MODE="${1:-trial}"
log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG" 2>/dev/null || true; }
case "$MODE" in trial|confirmed) ;; *) log "Rejected unknown boot mode: $MODE"; exit 2 ;; esac
sleep 55
# Fail closed if recovery disabled the binding while the launch was waiting.
[ -f "$D/home-enabled" ] || { log "Skipped: Home key is disabled"; exit 0; }
[ ! -e /var/lib/webosbrew/init.d/97-homekey ] || {
  log "Skipped: legacy 97-homekey still installed"; exit 0;
}
if [ "$MODE" = "trial" ]; then
  [ -f "$D/boot-home-trial" ] && [ ! -f "$D/boot-home-enabled" ] || {
    log "Trial disarmed before launch"; exit 0;
  }
else
  [ -f "$D/boot-home-enabled" ] || { log "Confirmed boot mode disabled"; exit 0; }
fi
if [ ! -d "/media/developer/apps/usr/palm/applications/$APP" ] &&
   [ ! -d "/media/cryptofs/apps/usr/palm/applications/$APP" ]; then
  log "Launcher package not found; disabling boot launch"
  rm -f "$D/boot-home-enabled" "$D/boot-home-trial"
  exit 1
fi
# Check whether applicationManager is responsive. Unknown reply must NEVER
# result in repeated launch attempts or a forced reboot.
ready=$(/usr/bin/luna-send -n 1 luna://com.webos.applicationManager/getForegroundAppInfo '{}' 2>&1)
if [ "$?" -ne 0 ] || ! printf '%s' "$ready" | grep -q '"returnValue"[[:space:]]*:[[:space:]]*true'; then
  log "App manager not ready; boot launch disabled: $(printf '%s' "$ready" | head -c 120)"
  rm -f "$D/boot-home-enabled" "$D/boot-home-trial"
  exit 1
fi
# ONE attempt per cold boot, no retries, process monitors or forced wake.
log "Cold boot $MODE: one launch requested for $APP"
reply=$(/usr/bin/luna-send -n 1 luna://com.webos.applicationManager/launch '{"id":"com.infinitimoney.tvhome"}' 2>&1)
if [ "$?" -ne 0 ] || ! printf '%s' "$reply" | grep -q '"returnValue"[[:space:]]*:[[:space:]]*true'; then
  log "Launch rejected; disabling boot launch: $(printf '%s' "$reply" | head -c 180)"
  rm -f "$D/boot-home-enabled" "$D/boot-home-trial"
  exit 1
fi
log "Launch accepted. Trial requires: sh $D/home-control.sh boot-confirm"
exit 0
