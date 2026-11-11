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
STARTUP=/var/lib/webosbrew/init.d/lg-tv-vibehack
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
    if [ -f "$DATA/boot-home-armed" ]; then
      echo "Cold-boot launcher: TRIAL ARMED (one launch on next cold boot)"
    elif [ -f "$DATA/boot-home-trial" ]; then
      echo "Cold-boot launcher: TRIAL CONSUMED (confirm if TV showed Infiniti)"
    elif [ -f "$DATA/boot-home-enabled" ]; then
      echo "Cold-boot launcher: CONFIRMED, one launch per cold boot"
    else
      echo "Cold-boot launcher: DISABLED (LG Home default)"
    fi
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
  boot-arm)
    # Explicit trial request from a user who understands earlier black-screen
    # reports. Must never implicitly come from install.sh's safe default.
    [ -f "$FLAG" ] || { echo "First map remote Home 0305/773 with: sh $0 enable" >&2; exit 1; }
    launcher_installed || { echo "Infiniti app is not installed" >&2; exit 1; }
    hook_installed || { echo "LG Input Hook is required" >&2; exit 1; }
    [ -f "$DATA/boot.sh" ] && [ -f "$DATA/boot-home-once.sh" ] || {
      echo "Update root tools first: boot-home-once.sh missing" >&2; exit 1;
    }
    [ ! -e /var/lib/webosbrew/init.d/97-homekey ] || {
      echo "Legacy 97-homekey conflicts. Run safe-mode and inspect backups first." >&2; exit 1;
    }
    status=$(/usr/bin/node "$DATA/keymap.js" status "$HOOK_CFG" "$BACKUP" "$KEY" "$APP_ID" "$CMD") || exit 1
    printf '%s\n' "$status" | grep -q "Home key $KEY: INFINITI ACTIVE" || {
      echo "Input Hook Home binding is not owned by Infiniti; refusing boot takeover." >&2
      exit 1
    }
    [ -d /var/lib/webosbrew/init.d ] || {
      echo "Homebrew init.d missing; cannot arm on this TV" >&2; exit 1;
    }
    if [ -e "$STARTUP" ] && ! grep -q 'Infiniti boot' "$STARTUP"; then
      echo "Startup hook already owned by another program. Refusing overwrite: $STARTUP" >&2
      exit 1
    fi
    # Preserve an existing older Infiniti startup script before replacing it.
    if [ -f "$STARTUP" ]; then
      cp "$STARTUP" "$DATA/boot-hook-before-trial-$(date +%Y%m%d%H%M%S)-$.sh" || exit 1
    fi
    cp "$DATA/boot.sh" "$STARTUP" || exit 1
    chmod +x "$STARTUP" || exit 1
    rm -f "$DATA/boot-home-enabled" "$DATA/boot-home-trial"
    touch "$DATA/boot-home-armed" || exit 1
    echo "Home 0305/773: Infiniti Input Hook mapping kept."
    echo "One cold-boot trial ARMED. If the panel goes black, next reboot returns to LG Home."
    echo "Only after a healthy trial, run: sh $0 boot-confirm"
    echo "Emergency: sh $0 safe-mode"
    ;;
  boot-confirm)
    [ -f "$DATA/boot-home-trial" ] || {
      echo "No consumed trial to confirm. Run boot-arm, reboot and verify the screen." >&2
      exit 1
    }
    [ -f "$FLAG" ] && launcher_installed || {
      echo "Home control is disabled or app missing; refusing confirmation." >&2; exit 1;
    }
    fg=$(/usr/bin/luna-send -n 1 luna://com.webos.applicationManager/getForegroundAppInfo '{}' 2>&1) || {
      echo "Cannot verify foreground app; confirmation refused." >&2; exit 1;
    }
    printf '%s' "$fg" | grep -q '"appId"[[:space:]]*:[[:space:]]*"com.infinitimoney.tvhome"' || {
      echo "Infiniti is not confirmed as foreground. Do not confirm until seen on TV." >&2
      exit 1
    }
    touch "$DATA/boot-home-enabled" || exit 1
    rm -f "$DATA/boot-home-trial" "$DATA/boot-home-armed"
    echo "CONFIRMED: one Infiniti launch on each cold boot. No standby/wake watcher."
    echo "If TV becomes unstable: sh $0 safe-mode"
    ;;
  boot-disable)
    rm -f "$DATA/boot-home-enabled" "$DATA/boot-home-armed" "$DATA/boot-home-trial"
    pkill -f "$DATA/boot-home-once.sh" 2>/dev/null || true
    # Keep wallpaper/update services if explicitly enabled; remove only our
    # startup hook in all-other-services-disabled mode.
    if [ ! -f "$DATA/boot-services-enabled" ] && [ -f "$STARTUP" ]; then
      if grep -q 'Infiniti boot' "$STARTUP"; then
        rm -f "$STARTUP"
      else
        echo "Unknown init.d hook retained for manual inspection: $STARTUP" >&2
      fi
    fi
    echo "Cold-boot Infiniti launcher disabled; LG Home startup preserved."
    ;;
  evdev-enable)
    # Disabled deliberately after real reports of LG blank-panel on standby.
    # Monitoring EV_KEY cannot suppress LG's compositor Home ribbon. A former
    # implementation could race with LG Input Hook and legacy 97-homekey.
    echo "DISABLED FOR SAFETY: direct evdev Home watcher may race with LG on power/wake." >&2
    echo "Use LG Home in safe mode; test any replacement on real TV after recovery." >&2
    exit 2
    ;;
  evdev-disable)
    rm -f "$DATA/home-event-device"
    pkill -f "$DATA/home-event-monitor.js" 2>/dev/null || true
    echo "Optional physical Home monitor disabled."
    ;;
  disable)
    # Fail-safe ordering: disarm all runtime flags BEFORE restoring a possibly
    # conflicted keymap. A malformed backup must never keep relaunch loops alive.
    rm -f "$FLAG" "$DATA/home-event-device" "$DATA/boot-services-enabled" \
      "$DATA/boot-home-armed" "$DATA/boot-home-trial" "$DATA/boot-home-enabled"
    pkill -f "$DATA/homewatch.js" 2>/dev/null || true
    pkill -f "$DATA/home-event-monitor.js" 2>/dev/null || true
    pkill -f "$DATA/boot-home-once.sh" 2>/dev/null || true
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
  *) echo "Usage: sh $0 status|diagnose|safe-mode|enable|rebind|boot-arm|boot-confirm|boot-disable|evdev-disable|disable" >&2; exit 2 ;;
esac
