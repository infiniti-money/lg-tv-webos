#!/bin/sh
# webOS 3.x: READ-ONLY EIM autostart diagnostics.
# The former --disable flow was suspended after an actual rooted LG TV hit
# "Underlying EIM mount unavailable, STOP" immediately after umount.
# Do NOT perform umount, copy-over, deleteDevice, or reboot from this tool.
set -eu
MODE="--inspect"
if [ "$#" -gt 0 ]; then MODE="$1"; fi
case "$MODE" in
  --inspect|--disable) ;;
  *) echo "Usage: sh $0 [--inspect|--disable]" >&2; exit 2 ;;
esac
if [ "$MODE" = "--disable" ]; then
  echo "BLOCKED: Automatic EIM rollback is disabled after an unsafe mount transition on webOS 3.4.x." >&2
  echo "No mount, input registration, or filesystem change was made." >&2
  echo "Run: sh $0 --inspect" >&2
  exit 3
fi

EIM="/var/lib/eim"
OVERLAY="/var/lib/webosbrew/eim"
BACKUP="/home/root/autostart-backup"
echo "=== EIM mount stack (read-only) ==="
if [ -r /proc/self/mountinfo ]; then
  awk '$5=="/var/lib/eim" { print "mount_id=" $1, "parent=" $2, "root=" $4, "target=" $5, "source=" $9 }' /proc/self/mountinfo
fi
echo "=== EIM inode comparison ==="
stat -c '%d:%i %n' "$EIM" "$OVERLAY" 2>&1 || true
echo "=== Saved EIM backup/snapshot directories ==="
ls -ld "$BACKUP/eim-before" "$BACKUP"/disable-* 2>/dev/null || true
echo "=== Autostart package ==="
ls -l /media/developer/apps/usr/palm/applications/org.webosbrew.autostart/appinfo.json 2>/dev/null ||
  echo "App not found at the usual developer path"
echo "=== Homebrew failsafe ==="
if [ -e /var/luna/preferences/webosbrew_failsafe ]; then echo "PRESENT"; else echo "absent"; fi
echo "READ-ONLY inspection complete. Do not uninstall Autostart or reboot based only on this output."
