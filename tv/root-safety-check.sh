#!/bin/sh
# Read-only Homebrew / root / failsafe state audit for legacy webOS.
# NEVER removes a failsafe flag, changes Developer Mode, starts a hook,
# opens a root shell, enables SSH/Telnet, or reboots the TV.
set -u
ROOT_DIR=/var/lib/webosbrew
FAILSAFE=/var/luna/preferences/webosbrew_failsafe
UID_NOW=$(id -u 2>/dev/null) || UID_NOW=unknown

if [ -e "$FAILSAFE" ]; then
  echo "ROOT_FAILSAFE: Homebrew failsafe marker present; root customizations may be suspended."
  echo "Do not auto-clear the marker or reboot. Diagnose the original boot failure first."
elif [ "$UID_NOW" != "0" ]; then
  echo "ROOT_NOT_ACTIVE: current SSH session is not root (uid=$UID_NOW)."
  echo "This does NOT prove the TV was permanently unrooted."
elif [ ! -d "$ROOT_DIR" ]; then
  echo "ROOT_UNVERIFIED: uid=0 but Homebrew root directory is absent."
  echo "Do not attempt root-side installation; inspect Homebrew Channel Root status."
else
  echo "ROOT_OK: current shell has uid=0 and Homebrew root directory exists."
  echo "This verifies this shell only; it does not guarantee persistence after reboot."
fi

if [ -d "$ROOT_DIR" ]; then
  echo "HOMEBREW_DIR_PRESENT"
else
  echo "HOMEBREW_DIR_MISSING"
fi
if [ -e "$FAILSAFE" ]; then
  echo "FAILSAFE_MARKER_PRESENT"
else
  echo "FAILSAFE_MARKER_ABSENT"
fi
if [ -d "$ROOT_DIR/init.d" ]; then
  echo "INIT_HOOK_DIR_PRESENT"
else
  echo "INIT_HOOK_DIR_ABSENT"
fi
echo "AUDIT_ONLY: no Homebrew, root, SSH, Developer Mode, or Failsafe files changed."
exit 0
