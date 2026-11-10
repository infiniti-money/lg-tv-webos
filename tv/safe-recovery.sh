#!/bin/sh
# Emergency recovery from a black screen / repeated launcher activation.
# Run as root on the TV, even if the TV panel is black but SSH still works.
# NEVER removes LG Home, the Infiniti IPK, Homebrew or user settings.
# Idempotent: a second run creates a new, harmless recovery record.
set -u

D=/home/root/lg-tv-vibehack
I=/var/lib/webosbrew/init.d
ROOT=/home/root/infiniti-tv-recovery
STAMP=$(date +%Y%m%d-%H%M%S)-$$
R="$ROOT/$STAMP"
FAIL=0
WARN=0

mkdir -p "$R" || { echo "ERROR: Cannot create recovery backup $R" >&2; exit 1; }
echo "Recovery directory: $R"

# Preserve evidence and the old binding BEFORE attempting to restore it.
for item in /tmp/lg-tv-vibehack.log /tmp/infiniti-homekey.log /tmp/infiniti-homeevent.log             "$D/home-key-backup.json" /home/root/.config/lginputhook/keybinds.json; do
  if [ -f "$item" ]; then
    cp "$item" "$R/" 2>/dev/null || {
      echo "WARNING: Could not back up $item" >&2
      WARN=1
    }
  fi
done

# First disarm *all* known activators, even if Input Hook has an unknown
# binding or the older home-control.sh refuses its keymap rollback.
for item in "$D/home-enabled" "$D/home-event-device" "$D/boot-services-enabled" "$D/auto-update-enabled"; do
  if [ -f "$item" ]; then
    mv "$item" "$R/" || {
      echo "ERROR: Could not disarm $item" >&2
      FAIL=1
    }
  fi
done

# Homebrew executes every executable file in init.d on boot.
# 97-homekey is the user's experimental 25s physical-key loop.
# Moving, rather than deleting, both startup scripts is fully reversible.
for item in "$I/lg-tv-vibehack" "$I/97-homekey"; do
  if [ -e "$item" ]; then
    mv "$item" "$R/" || {
      echo "ERROR: Could not disable startup hook $item" >&2
      FAIL=1
    }
  fi
done

# A failed or unavailable Input Hook restore means the TV may keep an old
# cached binding. This must be reported as PARTIAL, never complete success.
# Disarming autostart is independent and has already happened above.
CFG=/home/root/.config/lginputhook/keybinds.json
BACKUP="$D/home-key-backup.json"
if [ -e "$CFG" ] || [ -e "$BACKUP" ]; then
  if [ ! -f "$D/keymap.js" ]; then
    echo "WARNING: keymap.js missing; cannot verify or restore Home key." >&2
    WARN=1
  elif ! /usr/bin/node "$D/keymap.js" disable "$CFG" "$BACKUP" 773 com.infinitimoney.tvhome "$D/golauncher.sh"; then
    echo "WARNING: Input Hook keymap could not be restored. Backup kept for manual inspection." >&2
    WARN=1
  fi
fi

# Stop live watchers. A pre-existing 97-homekey shell loop may stay running
# until reboot; no attempt is made to kill unrelated shell/dd processes.
if command -v pkill >/dev/null 2>&1; then
  pkill -f "$D/homewatch.js" 2>/dev/null || true
  pkill -f "$D/home-event-monitor.js" 2>/dev/null || true
  pkill -f "$D/auto-update.sh --watch" 2>/dev/null || true
fi

sync
if [ "$FAIL" -ne 0 ]; then
  echo "RECOVERY_INCOMPLETE: $R" >&2
  echo "At least one startup file was not safely disarmed. Do NOT reboot yet." >&2
  exit 1
fi
if [ "$WARN" -ne 0 ]; then
  echo "BOOT_AUTOSTART_DISABLED: $R"
  echo "RECOVERY_PARTIAL: $R" >&2
  echo "Review Input Hook mapping / backups before considering a reboot." >&2
  exit 2
fi
echo "RECOVERY_COMPLETE: $R"
echo "Autostart scripts disarmed. Reboot once only after reviewing the output."
exit 0
