#!/bin/sh
# Reversible Home replacement for rooted LG webOS; never alter other key bindings.
set -eu
DATA=/home/root/lg-tv-vibehack
HOOK_CFG=/home/root/.config/lginputhook/keybinds.json
HOOK_APP=/media/developer/apps/usr/palm/applications/org.webosbrew.inputhook
HOOK_APP_ALT=/media/cryptofs/apps/usr/palm/applications/org.webosbrew.inputhook
KEY=773
FLAG="$DATA/home-enabled"
BACKUP="$DATA/home-key-backup.json"
CMD="$DATA/golauncher.sh"
APP_ID=com.infinitimoney.tvhome
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
hook_installed() { [ -d "$HOOK_APP" ] || [ -d "$HOOK_APP_ALT" ]; }
launcher_installed() {
  [ -d "/media/developer/apps/usr/palm/applications/$APP_ID" ] ||
  [ -d "/media/cryptofs/apps/usr/palm/applications/$APP_ID" ]
}
[ "$(id -u)" = 0 ] || { echo "Must be run as root" >&2; exit 1; }
action="status"
if [ "$#" -gt 0 ]; then action="$1"; fi
case "$action" in
  status)
    [ -f "$FLAG" ] && echo "Home replacement ENABLED" || echo "Home replacement DISABLED"
    hook_installed && echo "LG Input Hook installed (must be opened once)" || echo "LG Input Hook absent (watcher fallback only)"
    [ -f "$BACKUP" ] && echo "Previous Home mapping backup exists" || echo "No saved Home mapping backup"
    exit 0 ;;
  enable)
    [ -f "$DATA/homewatch.js" ] && [ -f "$DATA/keymap.js" ] || {
      echo "Infiniti TV Home scripts are incomplete. Reinstall first." >&2; exit 1;
    }
    if ! launcher_installed; then
      echo "Infiniti TV Home .ipk is not installed." >&2; exit 1
    fi
    if hook_installed; then
      mkdir -p "$(dirname "$HOOK_CFG")"
      /usr/bin/node "$DATA/keymap.js" enable "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD"
      echo "Home key set to Execute safe Infiniti launcher. Open Input Hook once, then reboot if needed."
    else
      echo "LG Input Hook absent. Only Home Watcher fallback is active."
    fi
    touch "$FLAG"
    echo "Enabled: boot startup + Home key hook/watcher; LG Home is retained for rollback."
    echo "Restore with: sh $DATA/home-control.sh disable"
    ;;
  disable)
    # Never stop the fallback watcher before the original key mapping is restored.
    if [ -f "$HOOK_CFG" ] || [ -f "$BACKUP" ]; then
      /usr/bin/node "$DATA/keymap.js" disable "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD" || {
        echo "Home mapping could not be safely restored; watcher still enabled." >&2
        exit 1
      }
    fi
    rm -f "$FLAG"
    pkill -f "$DATA/homewatch.js" 2>/dev/null || true
    echo "Home replacement disabled. Restart LG Input Hook if the previous mapping is cached."
    ;;
  *) echo "Usage: sh $0 enable|disable|status" >&2; exit 2 ;;
esac
