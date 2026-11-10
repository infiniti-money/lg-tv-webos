#!/bin/sh
# Read-only HOME-button diagnostics for rooted LG webOS 3.x.
# Run after pressing HOME on the remote. No system partitions or keybinds are changed.
DATA=/home/root/lg-tv-vibehack
CFG=/home/root/.config/lginputhook/keybinds.json
echo "== Infiniti TV Home / LG Input Hook diagnostics =="
echo "Date: $(date)"
[ -f "$DATA/home-enabled" ] && echo "Replacement flag: enabled" || echo "Replacement flag: disabled"
echo "-- Current Home key config (773, 774, 125 only; no other bindings disclosed)"
if [ -f "$CFG" ]; then
  /usr/bin/node -e '
    var fs=require("fs"),x;
    try{x=JSON.parse(fs.readFileSync(process.argv[1],"utf8"))}catch(e){console.log("Configuration unreadable: "+e.message);process.exit(0)}
    ["773","774","125"].forEach(function(k){console.log(k+": "+JSON.stringify(x[k]||null))})
  ' "$CFG"
else
  echo "No keybinds.json at $CFG"
fi
echo "-- Processes"
ps | grep -E 'lginput|homewatch|inputhook' | grep -v grep || echo "No matching process seen"
echo "-- Homebrew startup hooks"
for f in /var/lib/webosbrew/init.d/*inputhook* /var/lib/webosbrew/init.d/*lg-tv*; do
  [ -e "$f" ] && ls -l "$f"
done
echo "-- Recent LG Input Hook key events (press HOME immediately before running diagnostics)"
seen=0
for f in /tmp/lginput-hook*.log /tmp/lginput*.log; do
  [ -f "$f" ] || continue
  seen=1
  echo "Log file: $f"
  tail -n 25 "$f"
done
[ "$seen" -eq 1 ] || echo "No LG Input Hook runtime logs found in /tmp."
echo "-- Did Input Hook execute our Home command?"
if [ -f /tmp/infiniti-homekey.log ]; then
  tail -n 20 /tmp/infiniti-homekey.log
else
  echo "No /tmp/infiniti-homekey.log: no confirmed Execute invocation since boot."
fi
echo "-- Watcher log"
if [ -f /tmp/lg-tv-vibehack.log ]; then
  tail -n 30 /tmp/lg-tv-vibehack.log
else
  echo "No watcher log."
fi
echo "-- webOS foreground app (may NOT show LG Home ribbon on webOS 3.x)"
if command -v luna-send >/dev/null 2>&1; then
  luna-send -n 1 luna://com.webos.applicationManager/getForegroundAppInfo '{}' 2>&1 | head -c 600
  echo
fi
echo "-- Interpretation"
echo "A key event with an ID other than 773 means the Home mapping may target the wrong code."
echo "Events but no HOME Execute trace: Input Hook mapping/action is not being applied."
echo "HOME Execute trace with launch error: check app installation and app manager reply above."
echo "No key events: Input Hook may not have injected into this firmware/remote."
echo "On webOS 3.x, LG Home is a system ribbon and may not become the foreground app."
echo "This tool makes no changes. Restore mapping with: sh $DATA/home-control.sh disable"
