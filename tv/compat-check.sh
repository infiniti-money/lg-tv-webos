#!/bin/sh
# Read-only diagnostics for rooted LG webOS 3.x.
# Run over SSH as root: sh /home/root/lg-tv-vibehack/compat-check.sh
set -u
echo "=== Infiniti TV Home: webOS 3.x diagnostic ==="
echo "Platform:"
if [ -r /etc/os-release ]; then
  grep -E '^(NAME|VERSION|VERSION_ID|WEBOS)=' /etc/os-release || true
fi
if command -v node >/dev/null 2>&1; then
  printf 'Node.js: '; node -v
else
  echo 'Node.js missing'
fi
for cmd in luna-send curl sha256sum; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "$cmd: available"
  else
    echo "$cmd: missing"
  fi
done
echo "Root: $(id -u)"
[ -d /var/lib/webosbrew ] && echo 'Homebrew root directory: present' || echo 'Homebrew root directory: missing'
[ -d /media/developer/apps/usr/palm/applications/com.infinitimoney.tvhome ] && echo 'Infiniti TV Home: installed' || echo 'Infiniti TV Home: not installed'
[ -d /media/developer/apps/usr/palm/applications/org.webosbrew.inputhook ] && echo 'LG Input Hook: installed' || echo 'LG Input Hook: not installed'
[ -f /home/root/lg-tv-vibehack/home-enabled ] && echo 'Home replacement: enabled' || echo 'Home replacement: disabled'
if [ -f /home/root/.config/lginputhook/keybinds.json ]; then
  echo 'Input Hook keybinds: present (not printed to avoid private data)'
fi
echo 'No system settings were modified.'
