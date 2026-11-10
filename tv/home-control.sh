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
    /usr/bin/node "$DATA/keymap.js" status "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD" 2>/dev/null || true
    echo "NOTE: ACTIVE reflects saved JSON only, not a confirmed remote key event."
    echo "After pressing Home: sh $DATA/home-control.sh diagnose"
    exit 0 ;;
  diagnose)
    [ -f "$DATA/diagnose-home.sh" ] || {
      echo "Diagnostic helper not installed; update the root-side scripts first." >&2; exit 1;
    }
    sh "$DATA/diagnose-home.sh"
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
  rebind)
    # Manual recovery only; never silently take ownership of another app's Home binding.
    # keymap.js archives both the previous backup and the current Home action.
    [ -f "$DATA/keymap.js" ] && [ -f "$DATA/homewatch.js" ] && [ -f "$DATA/boot.sh" ] || {
      echo "Infiniti Home control files incomplete. Re-run the installer first." >&2; exit 1;
    }
    launcher_installed || { echo "Infiniti TV Home IPK not installed." >&2; exit 1; }
    hook_installed || { echo "LG Input Hook is absent. Use watcher fallback instead." >&2; exit 1; }
    mkdir -p "$(dirname "$HOOK_CFG")"
    /usr/bin/node "$DATA/keymap.js" rebind "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD" --confirm-rebind
    # The installer may have exited before registering the boot service.
    if [ -d /var/lib/webosbrew/init.d ]; then
      cp "$DATA/boot.sh" /var/lib/webosbrew/init.d/lg-tv-vibehack
      chmod +x /var/lib/webosbrew/init.d/lg-tv-vibehack
    fi
    touch "$FLAG"
    if ! ps | grep '[h]omewatch.js' | grep -v grep >/dev/null 2>&1; then
      nohup setsid /usr/bin/node "$DATA/homewatch.js" >> /tmp/lg-tv-vibehack.log 2>&1 < /dev/null &
    fi
    echo "Home key recovery applied. Previous mapping backed up. Open LG Input Hook and reboot."
    echo "Rollback: sh $DATA/home-control.sh disable"
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
  *) echo "Usage: sh $0 status|diagnose|enable|rebind|disable" >&2; exit 2 ;;
esac
