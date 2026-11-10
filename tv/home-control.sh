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
    hook_installed && echo "LG Input Hook installed (must be opened once)" || echo "LG Input Hook absent (Home interception unavailable)"
    [ -f "$BACKUP" ] && echo "Previous Home mapping backup exists" || echo "No saved Home mapping backup"
    /usr/bin/node "$DATA/keymap.js" status "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD" 2>/dev/null || true
    echo "NOTE: ACTIVE reflects saved JSON only, not a confirmed remote key event."
    echo "After pressing Home: sh $DATA/home-control.sh diagnose"
    if [ -f "$DATA/home-event-device" ]; then
      echo "Fallback input monitor configured: $(cat "$DATA/home-event-device") (LG ribbon may still appear briefly)"
    else
      echo "Fallback input monitor: disabled"
    fi
    exit 0 ;;
  diagnose)
    [ -f "$DATA/diagnose-home.sh" ] || {
      echo "Diagnostic helper not installed; update the root-side scripts first." >&2; exit 1;
    }
    sh "$DATA/diagnose-home.sh"
    exit 0 ;;
  safe-mode)
    [ -f "$DATA/safe-recovery.sh" ] || { echo "Recovery helper missing" >&2; exit 1; }
    exec sh "$DATA/safe-recovery.sh"
    ;;
  enable)
    [ -f "$DATA/keymap.js" ] || {
      echo "Infiniti TV Home scripts are incomplete. Reinstall first." >&2; exit 1;
    }
    if ! launcher_installed; then
      echo "Infiniti TV Home .ipk is not installed." >&2; exit 1
    fi
    hook_installed || {
      echo "LG Input Hook missing: cannot safely replace Home on webOS 3.x." >&2
      exit 1
    }
    if [ -e /var/lib/webosbrew/init.d/97-homekey ]; then
      echo "Old 97-homekey startup script detected; enter safe-mode first." >&2
      exit 1
    fi
    mkdir -p "$(dirname "$HOOK_CFG")"
    /usr/bin/node "$DATA/keymap.js" enable "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD"
    touch "$FLAG"
    echo "Enabled manual Home key hook only; no app startup on boot or wake."
    echo "Restore with: sh $DATA/home-control.sh safe-mode"
    ;;
  rebind)
    # Manual recovery only; never silently take ownership of another app's Home binding.
    # keymap.js archives both the previous backup and the current Home action.
    [ -f "$DATA/keymap.js" ] || {
      echo "Infiniti Home control files incomplete. Re-run the installer first." >&2; exit 1;
    }
    launcher_installed || { echo "Infiniti TV Home IPK not installed." >&2; exit 1; }
    hook_installed || { echo "LG Input Hook is absent; safe manual Home capture unavailable." >&2; exit 1; }
    [ ! -e /var/lib/webosbrew/init.d/97-homekey ] || {
      echo "Old 97-homekey startup script detected; enter safe-mode first." >&2; exit 1;
    }
    mkdir -p "$(dirname "$HOOK_CFG")"
    /usr/bin/node "$DATA/keymap.js" rebind "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD" --confirm-rebind
    touch "$FLAG"
    echo "Home key mapping repaired without starting any watcher or boot launcher."
    echo "Open LG Input Hook and Save changes; test manually before power cycling."
    echo "Rollback: sh $DATA/home-control.sh disable"
    ;;
  evdev-enable)
    # Device should be verified from actual key codes first. This fallback
    # observes the key; it does not consume/suppress LG's Home ribbon.
    device="${2:-}"
    case "$device" in
      /dev/input/event[0-9]|/dev/input/event[0-9][0-9]) ;;
      *) echo "Specify verified event device, e.g. /dev/input/event3" >&2; exit 2 ;;
    esac
    [ -c "$device" ] || { echo "Not a character input device: $device" >&2; exit 1; }
    [ -f "$DATA/home-enabled" ] || { echo "Home replacement flag is disabled." >&2; exit 1; }
    [ -f "$DATA/home-event-monitor.js" ] || {
      echo "Missing event monitor; run the root installer to update helpers." >&2; exit 1;
    }
    if [ -e /var/lib/webosbrew/init.d/97-homekey ]; then
      echo "Existing custom 97-homekey watcher detected. Back it up and disable it first to avoid duplicate launches." >&2
      exit 1
    fi
    printf '%s\n' "$device" > "$DATA/home-event-device"
    pkill -f "$DATA/home-event-monitor.js" 2>/dev/null || true
    nohup setsid /usr/bin/node "$DATA/home-event-monitor.js" "$device" >> /tmp/infiniti-homeevent.log 2>&1 < /dev/null &
    echo "Optional physical Home monitor active for $device."
    echo "This overlays Infiniti after Home, but does not prevent LG Home from appearing."
    ;;
  evdev-disable)
    rm -f "$DATA/home-event-device"
    pkill -f "$DATA/home-event-monitor.js" 2>/dev/null || true
    echo "Optional physical Home monitor disabled."
    ;;
  disable)
    # Fail-safe ordering: disarm all runtime flags BEFORE restoring a possibly
    # conflicted keymap. A malformed backup must never keep relaunch loops alive.
    rm -f "$FLAG" "$DATA/home-event-device" "$DATA/boot-services-enabled"
    pkill -f "$DATA/homewatch.js" 2>/dev/null || true
    pkill -f "$DATA/home-event-monitor.js" 2>/dev/null || true
    result=0
    if [ -f "$HOOK_CFG" ] || [ -f "$BACKUP" ]; then
      /usr/bin/node "$DATA/keymap.js" disable "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD" || result=1
    fi
    if [ "$result" -ne 0 ]; then
      echo "WARNING: Home key binding conflict; launcher flags disabled, keymap/backup untouched." >&2
      echo "Run safe-recovery.sh and check LG Input Hook mapping manually." >&2
      exit 1
    fi
    echo "Home replacement disabled. Restart LG Input Hook if its old binding is cached."
    ;;
  *) echo "Usage: sh $0 status|diagnose|safe-mode|enable|rebind|evdev-enable /dev/input/eventN|evdev-disable|disable" >&2; exit 2 ;;
esac
