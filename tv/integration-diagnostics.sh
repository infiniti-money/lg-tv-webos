#!/bin/sh
# Read-only interoperability checks for rooted webOS TVs.
# Concepts evaluated against:
#   Simon34545/lginputhook (Home key remapping and log inspection)
#   ecklf/lg-luma (native launcher / takeover support is webOS >=5 only)
#   simbasjungles/free-my-tv (separate webOS app and no-root fallback)
# Never changes system files, injects input hooks, mounts, starts or reboots TV.
set -u
DATA=/home/root/lg-tv-vibehack
INPUT=/home/root/.config/lginputhook/keybinds.json
INIT=/var/lib/webosbrew/init.d
echo "=== Infiniti / input-hook / other launcher compatibility (READ ONLY) ==="
echo "Date: $(date)"
if [ -r /etc/os-release ]; then
  echo "-- System (non-secret version identifiers)"
  grep -E '^(NAME|VERSION|VERSION_ID|WEBOS|WEBOS_VERSION)=' /etc/os-release || true
fi
echo "User UID: $(id -u)"
installed_app() {
  [ -d "/media/developer/apps/usr/palm/applications/$1" ] ||
  [ -d "/media/cryptofs/apps/usr/palm/applications/$1" ]
}
if installed_app org.webosbrew.inputhook; then
  echo "LG Input Hook: installed; verify it has been launched and saved changes"
else
  echo "LG Input Hook: not detected in common app directories"
fi
if installed_app com.ecklf.luma; then
  echo "Luma: installed as separate launcher (check for conflicting takeover)"
else
  echo "Luma: not detected"
fi
if installed_app io.freemytv; then
  echo "Free My TV: installed separately; no assumed Home replacement on webOS 3"
else
  echo "Free My TV: not detected"
fi
if installed_app com.lennylxx.devmodeforever; then
  echo "Dev Mode Forever: installed separately; may reboot on watchdog counter reset"
else
  echo "Dev Mode Forever: not detected"
fi
echo "-- Input Hook mapping 0305 HEX / 773 decimal (no other keybinds or secrets)"
if [ -r "$INPUT" ] && command -v node >/dev/null 2>&1; then
  node -e '
    var fs=require("fs"), v;
    try {
      v=JSON.parse(fs.readFileSync(process.argv[1],"utf8"))["773"];
      if (!v) {console.log("773: unmapped"); process.exit(0);}
      if (v.action==="exec") {
        console.log(v.command==="/home/root/lg-tv-vibehack/golauncher.sh" ?
          "773: Infiniti Execute mapping" : "773: external Execute mapping");
      } else if (v.action==="launch") {
        console.log(v.id==="com.infinitimoney.tvhome" ?
          "773: Infiniti Launch App mapping" : "773: external Launch App mapping");
      } else {
        console.log("773: " + String(v.action || "unknown").slice(0,25) + " mapping");
      }
    } catch(e) {console.log("773: unreadable keybind config; no changes made");}
  ' "$INPUT"
else
  echo "773: no readable keybinds.json or Node runtime"
fi
echo "-- Startup hooks (names only; no script execution)"
for f in "$INIT/lg-tv-vibehack" "$INIT/97-homekey" "$INIT/inputhook" \
  "$INIT/luma" "$INIT/luma-home" "$INIT/luma-autostart"; do
  [ -e "$f" ] && echo "PRESENT: $f"
done
if [ -d /var/lib/luma-home ]; then
  echo "WARNING: Luma native Home takeover state is present (/var/lib/luma-home)."
  echo "Luma takeover is documented for webOS 5+, NOT the affected webOS 3.4 TV."
fi
if [ -e "$INIT/97-homekey" ]; then
  echo "WARNING: legacy 97-homekey boot loop may conflict with LG Input Hook."
fi
echo "-- Infiniti Home and startup flags"
for flag in home-enabled boot-home-armed boot-home-trial boot-home-enabled boot-services-enabled auto-update-enabled home-event-device; do
  if [ -e "$DATA/$flag" ]; then
    echo "ACTIVE: $flag"
  fi
done
if ps 2>/dev/null | grep '[h]omewatch.js' >/dev/null 2>&1; then
  echo "WARNING: legacy foreground homewatch.js is running (not needed on webOS 3.x)."
fi
if ps 2>/dev/null | grep '[h]ome-event-monitor.js' >/dev/null 2>&1; then
  echo "WARNING: experimental evdev Home monitor is running; check potential duplication."
fi
echo "-- Operator guidance"
echo "LG Input Hook supports Execute and Launch App; a saved mapping does not prove LG's Home ribbon was suppressed."
echo "Luma Home takeover must not be copied from webOS 5+ onto webOS 3.x."
echo "Free My TV webOS fallback uses separate user-approved app discovery; it does not replace LG Home."
echo "For black screen, use the existing safe-recovery.sh via SSH, not another Home watcher."
echo "No files, key mappings, mount points, services or session tokens were changed."
