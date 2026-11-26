#!/bin/sh
# Explicit opt-in controller for V8. No remount, no exclusive key grab.
set -eu
D=/home/root/lg-tv-vibehack
I=/var/lib/webosbrew/init.d/infiniti-legacy-v8
PROOF=/tmp/infiniti-legacy-v8-trial-ok
[ "$(id -u)" = 0 ] || { echo "Root required" >&2; exit 1; }
check() {
  [ -f "$D/legacy-home-v8.py" ] || { echo "Install root tools first"; exit 1; }
  [ ! -e "$D/home-enabled" ] && [ ! -e /var/lib/webosbrew/init.d/97-homekey ] ||
    { echo "Existing Home hook: use existing recovery before V8"; exit 1; }
  [ ! -e /var/luna/preferences/webosbrew_failsafe ] ||
    { echo "Homebrew FAILSAFE: do not activate"; exit 1; }
  [ -f "$D/legacy-luna.js" ] || { echo "Missing legacy-luna.js"; exit 1; }
  command -v python >/dev/null
  command -v /usr/bin/node >/dev/null
}
case "${1:-status}" in
  status)
    for f in session armed trial enabled wake; do
      if [ -f "$D/legacy-v8-$f" ]; then echo "$f: ON"; else echo "$f: OFF"; fi
    done
    [ ! -f /tmp/infiniti-legacy-v8.log ] || tail -n 15 /tmp/infiniti-legacy-v8.log
    ;;
  watch)
    check
    /usr/bin/node "$D/legacy-luna.js" probe || exit 1
    [ ! -e "$D/legacy-v8-enabled" ] && [ ! -e "$D/legacy-v8-armed" ] ||
      { echo "Disable boot mode before interactive testing"; exit 1; }
    [ ! -e "$D/legacy-v8-session" ] || { echo "Session already armed; use disable first"; exit 1; }
    touch "$D/legacy-v8-session"
    trap 'rm -f "$D/legacy-v8-session"' EXIT
    trap 'exit 130' INT TERM
    python -u "$D/legacy-home-v8.py" watch
    ;;
  arm)
    check
    /usr/bin/node "$D/legacy-luna.js" probe || exit 1
    [ ! -e "$D/legacy-v8-session" ] && [ ! -e "$D/legacy-v8-enabled" ] ||
      { echo "Disable existing mode first"; exit 1; }
    rm -f "$D/legacy-v8-trial" "$PROOF" "$D/legacy-v8-wake"
    [ ! -e "$I" ] || grep -q '^# Infiniti Legacy V8 hook$' "$I" ||
      { echo "Unknown hook at $I; refusing overwrite"; exit 1; }
    umask 077
    cat > "$I" <<'HOOK'
#!/bin/sh
# Infiniti Legacy V8 hook
D=/home/root/lg-tv-vibehack
[ ! -e "$D/home-enabled" ] || exit 0
if [ -f "$D/legacy-v8-armed" ]; then
  mv "$D/legacy-v8-armed" "$D/legacy-v8-trial" || exit 1
  mode=trial
elif [ -f "$D/legacy-v8-enabled" ]; then
  mode=enabled
else
  exit 0
fi
nohup /usr/bin/python -u "$D/legacy-home-v8.py" "$mode" >> /tmp/infiniti-legacy-v8.log 2>&1 </dev/null &
HOOK
    chmod 700 "$I"
    touch "$D/legacy-v8-armed"
    echo "One-shot cold boot trial armed; reboot manually. Confirm only after seeing launcher."
    ;;
  confirm)
    check
    [ -f "$D/legacy-v8-trial" ] && [ -f "$PROOF" ] && [ -f "$I" ] ||
      { echo "No successful trial recorded on this boot"; exit 1; }
    grep -qx 'foreground and render confirmed' "$PROOF" || { echo 'Render proof missing; re-arm and test V8.4'; exit 1; }
    touch "$D/legacy-v8-enabled"
    rm -f "$D/legacy-v8-trial" "$PROOF"
    echo "Confirmed. Persistent boot + Home observer starts on next cold boot."
    ;;
  wake-on)
    check
    [ -f "$D/legacy-v8-enabled" ] || { echo "Confirm boot trial first"; exit 1; }
    touch "$D/legacy-v8-wake"
    echo "Experimental wake trigger enabled. Some standby states may not be observable."
    ;;
  wake-off)
    rm -f "$D/legacy-v8-wake"
    ;;
  disable)
    rm -f "$D/legacy-v8-session" "$D/legacy-v8-armed" "$D/legacy-v8-trial" \
      "$D/legacy-v8-enabled" "$D/legacy-v8-wake" "$PROOF"
    if [ -f "$I" ] && grep -q '^# Infiniti Legacy V8 hook$' "$I"; then
      rm -f "$I"
    fi
    echo "V8 disarmed; observer exits after current bounded operation. Native Home untouched."
    ;;
  *) echo "Usage: $0 status|watch|arm|confirm|wake-on|wake-off|disable"; exit 2 ;;
esac
