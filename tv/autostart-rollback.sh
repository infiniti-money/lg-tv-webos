#!/bin/sh
# webOS 3.x: conservatively disable the EIM input-app autostart.
# Default mode only inspects and does not mutate EIM.
set -eu
MODE="--inspect"
if [ "$#" -gt 0 ]; then MODE="$1"; fi
BACKUP="/home/root/autostart-backup"
EIM="/var/lib/eim"
OVERLAY="/var/lib/webosbrew/eim"

[ "$MODE" = "--inspect" ] || [ "$MODE" = "--disable" ] || {
  echo "Usage: sh $0 [--inspect|--disable]" >&2; exit 2;
}
[ "$(id -u)" = "0" ] || { echo "Root required" >&2; exit 1; }
[ -d "$EIM" ] || { echo "EIM unavailable" >&2; exit 1; }
mount_root() {
  awk '$5=="/var/lib/eim" {r=$4; n++} END {if(n==0) print "NOT_MOUNTED"; else print r}' /proc/self/mountinfo
}
ROOT=$(mount_root)
echo "EIM mount root: $ROOT"
stat -c '%d:%i %n' "$EIM" "$OVERLAY" 2>/dev/null || true
ls -ld "$BACKUP/eim-before" 2>/dev/null || echo "No saved eim-before backup"
if [ -e /var/luna/preferences/webosbrew_failsafe ]; then echo "Homebrew FAILSAFE active"; fi
if [ "$MODE" = "--inspect" ]; then
  echo "READ-ONLY inspection complete; no changes made"
  exit 0
fi

[ ! -e /var/luna/preferences/webosbrew_failsafe ] ||
  { echo "Failsafe active; refusing" >&2; exit 1; }
[ -d "$BACKUP/eim-before" ] ||
  { echo "Original backup absent; refusing" >&2; exit 1; }
[ "$ROOT" = "/" ] || [ "$ROOT" = "$OVERLAY" ] ||
  { echo "Unexpected mount root; refusing" >&2; exit 1; }
command -v luna-send >/dev/null || exit 1
command -v umount >/dev/null || exit 1
STAMP=$(date +%Y%m%d-%H%M%S)-$$
SNAPSHOT="$BACKUP/disable-$STAMP"
mkdir -p "$SNAPSHOT"
cp -a "$EIM" "$SNAPSHOT/eim-visible" ||
  { echo "Visible EIM backup failed" >&2; exit 1; }
if [ -d "$OVERLAY" ]; then
  cp -a "$OVERLAY" "$SNAPSHOT/eim-overlay" ||
    { echo "Overlay EIM backup failed" >&2; exit 1; }
fi
cat /proc/self/mountinfo > "$SNAPSHOT/mountinfo-before"
echo "Backups created: $SNAPSHOT"

if [ "$ROOT" = "$OVERLAY" ]; then
  echo "Detaching confirmed bind overlay (not the raw EIM filesystem)"
  umount "$EIM" || {
    echo "Bind overlay busy: do not reboot or uninstall" >&2; exit 1;
  }
  AFTER=$(mount_root)
  [ "$AFTER" != "$OVERLAY" ] && [ "$AFTER" != "NOT_MOUNTED" ] ||
    { echo "Underlying EIM mount unavailable, STOP" >&2; exit 1; }
  echo "Underlying EIM root: $AFTER"
fi
[ -d "$EIM" ] || { echo "Underlying EIM missing, STOP" >&2; exit 1; }
cp -a "$EIM" "$SNAPSHOT/eim-real" ||
  { echo "Real EIM backup failed, no unregister attempted" >&2; exit 1; }
echo "Calling EIM API on underlying real data..."
RESULT=$(luna-send -n 1 -f 'luna://com.webos.service.eim/deleteDevice' \
  '{"appId":"org.webosbrew.autostart"}' 2>&1) || {
    echo "EIM API failed: $RESULT" >&2
    echo "Do not uninstall or reboot until inspected" >&2
    exit 1
  }
echo "$RESULT"
echo "$RESULT" | grep -Eq '"returnValue"[[:space:]]*:[[:space:]]*true' || {
  echo "Unregister was not confirmed; do not uninstall/reboot" >&2; exit 1;
}
echo "Autostart EIM entry unregistered; backup: $SNAPSHOT"
echo "Only now uninstall org.webosbrew.autostart with webOS Dev Manager."
echo "Do not uninstall Homebrew Channel or Glasshouse."
