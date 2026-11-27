#!/bin/sh
# Explicit, local scratch bind-mount test ONLY. Never mount an LG file.
set -eu
[ "$#" = 1 ] && [ "$1" = --scratch-only ] || { echo "Usage: $0 --scratch-only"; exit 2; }
[ "$(id -u)" = 0 ] || { echo "root required"; exit 1; }
for c in mount umount mktemp awk grep; do command -v "$c" >/dev/null || { echo "$c missing"; exit 1; }; done
[ -r /proc/self/mountinfo ] || { echo "mountinfo unavailable"; exit 1; }
umask 077
work=$(mktemp -d /tmp/infiniti-mount-lab.XXXXXX)
case "$work" in /tmp/infiniti-mount-lab.*) ;; *) exit 1;; esac
src="$work/source"
dst="$work/target"
mounted(){
  awk -v target="$dst" '$5==target {n++} END {exit n==1?0:1}' /proc/self/mountinfo
}
any_mount(){
  awk -v target="$dst" '$5==target {n++} END {exit n?0:1}' /proc/self/mountinfo
}
cleanup(){
  rc=$?
  trap - 0
  trap '' INT TERM HUP
  if [ ! -r /proc/self/mountinfo ]; then echo "MOUNT_CLEANUP_UNKNOWN: $work"; exit 1; fi
  if any_mount; then
    # Refuse to remove an unexpected or stacked mount, even in scratch.
    if mounted && [ "$(cat "$dst" 2>/dev/null || true)" = INFINITI_SOURCE ]; then
      umount "$dst" || { echo "MOUNT_CLEANUP_INCOMPLETE: $work"; exit 1; }
    else echo "MOUNT_CLEANUP_CONFLICT: $work"; exit 1
    fi
  fi
  if any_mount; then echo "MOUNT_CLEANUP_INCOMPLETE: $work"; exit 1; fi
  [ "$(cat "$dst" 2>/dev/null || true)" = INFINITI_TARGET ] || { echo "MOUNT_RESTORE_UNVERIFIED: $work"; exit 1; }
  rm -f "$src" "$dst"
  rmdir "$work" || exit 1
  [ "$rc" = 0 ] && echo "SCRATCH_BIND_PASS: reversible file mount only; no LG Home compatibility proof"
  exit "$rc"
}
printf '%s\n' INFINITI_SOURCE > "$src"
printf '%s\n' INFINITI_TARGET > "$dst"
trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM HUP
any_mount && { echo "Unexpected scratch mount"; exit 1; }
mount -o bind "$src" "$dst"
mounted || { echo "Mount not verified"; exit 1; }
[ "$(cat "$dst")" = INFINITI_SOURCE ] || exit 1
echo "SCRATCH_BIND_VISIBLE"
umount "$dst"
if any_mount; then echo "Mount remains"; exit 1; fi
[ "$(cat "$dst")" = INFINITI_TARGET ] || exit 1
