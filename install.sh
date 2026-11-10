#!/bin/sh
# Infiniti TV Home - one-command installer for ROOTED LG webOS TVs.
# Run it ON the TV as root (over SSH):
#
#   curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh | sh
#
# Options (add after `sh -s --`), e.g.
#   curl -fsSL .../install.sh | sh -s -- --lang vi --city "Hanoi" --wallpaper https://example.com/photo.jpg
#
#   --lang en|vi            Interface language (default: vi)
#   --clock24 on|off        24-hour clock
#   --columns N             Tiles per row, 3-10 (default: 6; the pencil next to the dock overrides it)
#   --city "Name"           Turn on weather for this city (looked up on Open-Meteo)
#   --fahrenheit            Weather in °F
#   --no-weather            Turn weather off
#   --wallpaper URL|PATH    Background picture (web link, or a file on the TV / USB stick)
#   --no-wallpaper          Back to plain black
#   --dim 0-0.8             Darken the wallpaper so text stays readable (default: 0.35)
#   --glow on|off           Coloured glow behind the focused app
#   --no-home-button        Keep LG Home; disable and restore previous key mapping
#   --rebind-home           Explicitly replace a conflicting Home key mapping, archive old value
#   --uninstall             Remove everything this script installed
set -e

REPO="infiniti-money/lg-tv-webos"
BRANCH="main"
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH"
IPK_URL="https://github.com/$REPO/releases/latest/download/infiniti-tv-home.ipk"

APP_ID="com.infinitimoney.tvhome"
APP_DIR="/media/developer/apps/usr/palm/applications/$APP_ID"
DATA="/home/root/lg-tv-vibehack"
INITD="/var/lib/webosbrew/init.d/lg-tv-vibehack"
HOOK_APP="/media/developer/apps/usr/palm/applications/org.webosbrew.inputhook"
HOOK_CFG="/home/root/.config/lginputhook/keybinds.json"
HOME_KEY="773"
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

# luna_wait URI JSON: subscribes and waits until the app installer reports it is done.
# (`luna-send -n 1` returns after the first reply, before the job has finished.)
luna_wait() {
  node -e '
    var spawn=require("child_process").spawn;
    var p=spawn("luna-send",["-i",process.argv[1],process.argv[2]]);
    var out="",done=false;
    function end(code,msg){if(done)return;done=true;p.kill();if(msg)console.error(msg);process.exit(code);}
    p.stdout.on("data",function(d){out+=d;
      if(/"statusValue":\s*30|"state":\s*"(installed|removed)"/.test(out)) end(0);
      if(/"errorCode"|"state":\s*"(install|remove) failed"|"state":\s*"failed"|"returnValue":\s*false/.test(out)) end(1,out);
    });
    setTimeout(function(){end(1,"Timed out waiting for the app installer:\n"+out)},120000);
  ' "$1" "$2"
}

# ---------------------------------------------------------------- options
LANG_OPT="vi"; CLOCK="on"; COLS=""; CITY=""; FAHR=""; NOWEATHER=""; WALL=""; NOWALL=""; DIM=""; GLOW=""
HOME_BTN=1; UNINSTALL=""; REBIND_HOME=""
while [ $# -gt 0 ]; do
  case "$1" in
    --lang) LANG_OPT="$2"; shift ;;
    --clock24) CLOCK="$2"; shift ;;
    --columns) COLS="$2"; shift ;;
    --city) CITY="$2"; shift ;;
    --fahrenheit) FAHR=1 ;;
    --no-weather) NOWEATHER=1 ;;
    --wallpaper) WALL="$2"; shift ;;
    --no-wallpaper) NOWALL=1 ;;
    --dim) DIM="$2"; shift ;;
    --glow) GLOW="$2"; shift ;;
    --no-home-button) HOME_BTN="" ;;
    --rebind-home) REBIND_HOME=1 ;;
    --uninstall) UNINSTALL=1 ;;
    *) die "Unknown option: $1" ;;
  esac
  shift
done

# ---------------------------------------------------------------- checks
[ "$(id -u)" = "0" ] || die "Run this as root over SSH (ssh root@<TV IP>). The webOS Terminal app is not root."
[ -d /var/lib/webosbrew ] || die "Homebrew Channel with root not found. Root the TV first (see README)."
for c in node luna-send curl; do command -v "$c" >/dev/null 2>&1 || die "'$c' not found on this TV."; done

# ---------------------------------------------------------------- uninstall
if [ -n "$UNINSTALL" ]; then
  say "Removing Infiniti TV Home"
  if [ -f "$DATA/home-control.sh" ]; then
    sh "$DATA/home-control.sh" disable || die "Could not safely restore the previous Home key binding. Check $DATA/home-key-backup.json"
  else
    warn "No Home rollback controller found; inspect LG Input Hook keybinds before proceeding."
    die "Refusing uninstall without a reversible Home configuration."
  fi
  pkill -f "$DATA/wallpaper-server.js" 2>/dev/null || true
  rm -f "$INITD"
  luna_wait luna://com.webos.appInstallService/remove "{\"id\":\"$APP_ID\",\"subscribe\":true}" || warn "Could not remove the launcher app"
  rm -f /tmp/lg-tv-vibehack.log
  rm -rf "$DATA"
  ok "Removed. Reboot the TV to get LG's Home button back: reboot"
  exit 0
fi

# ---------------------------------------------------------------- files
say "Downloading scripts"
mkdir -p "$DATA/icons"
for f in sync.js homewatch.js keymap.js wallpaper-server.js wallpaper.html golauncher.sh boot.sh home-control.sh diagnose-home.sh compat-check.sh; do
  curl -fsSL "$RAW/tv/$f" -o "$DATA/$f" || die "Could not download $f. Is the TV online?"
done
chmod +x "$DATA"/*.sh "$DATA"/*.js
ok "Scripts in $DATA"

# ---------------------------------------------------------------- settings
[ -f "$DATA/settings.json" ] || echo '{"language":"vi","clock24":true,"columns":6}' > "$DATA/settings.json"

LAT=""; LON=""; PLACE=""
if [ -n "$CITY" ]; then
  say "Looking up \"$CITY\" for the weather"
  Q=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$CITY")
  GEO=$(curl -fsSL "https://geocoding-api.open-meteo.com/v1/search?name=$Q&count=1&format=json") || die "Weather lookup failed (no internet?)"
  # ES5 on purpose: webOS 4 TVs run Node 0.12, where arrow functions are a syntax error.
  GEOLINE=$(echo "$GEO" | node -e '
    var s = "";
    process.stdin.on("data", function (d) { s += d; });
    process.stdin.on("end", function () {
      try {
        var r = JSON.parse(s).results[0];
        process.stdout.write(r.latitude + " " + r.longitude + " " + r.name);
      } catch (e) { /* city not found */ }
    });
  ')
  LAT=$(echo "$GEOLINE" | cut -d' ' -f1)
  LON=$(echo "$GEOLINE" | cut -d' ' -f2)
  PLACE=$(echo "$GEOLINE" | cut -d' ' -f3-)
  [ -n "$LAT" ] || die "City \"$CITY\" not found. Try the English name, e.g. \"Ho Chi Minh City\"."
  ok "$PLACE ($LAT, $LON)"
fi

if [ -n "$WALL" ]; then
  say "Setting wallpaper"
  case "$WALL" in
    http://*|https://*) curl -fsSL "$WALL" -o "$DATA/wallpaper.jpg" || die "Could not download the wallpaper" ;;
    *) [ -f "$WALL" ] || die "File not found: $WALL"; cp "$WALL" "$DATA/wallpaper.jpg" ;;
  esac
  ok "Wallpaper saved"
fi
[ -n "$NOWALL" ] && rm -f "$DATA/wallpaper.jpg"

LANG_OPT="$LANG_OPT" CLOCK="$CLOCK" COLS="$COLS" LAT="$LAT" LON="$LON" PLACE="$PLACE" FAHR="$FAHR" \
NOWEATHER="$NOWEATHER" DIM="$DIM" GLOW="$GLOW" node -e '
  var fs=require("fs"),f=process.argv[1],e=process.env,s={};
  try{s=JSON.parse(fs.readFileSync(f,"utf8"))}catch(x){}
  if(e.LANG_OPT) s.language=e.LANG_OPT==="vi"?"vi":"en";
  if(e.CLOCK) s.clock24=e.CLOCK==="on";
  if(e.COLS){var n=parseInt(e.COLS,10); if(n>=3&&n<=10) s.columns=n;}
  if(e.DIM){var d=parseFloat(e.DIM); if(d>=0&&d<=0.8) s.wallpaperDim=d;}
  if(e.GLOW) s.ambientGlow=e.GLOW!=="off";
  if(e.LAT) s.weather={enabled:true,latitude:+e.LAT,longitude:+e.LON,place:e.PLACE,unit:e.FAHR?"fahrenheit":"celsius"};
  if(e.NOWEATHER&&s.weather) s.weather.enabled=false;
  fs.writeFileSync(f,JSON.stringify(s,null,1));
' "$DATA/settings.json"
ok "Settings saved in $DATA/settings.json"

# ---------------------------------------------------------------- launcher app
say "Installing the launcher (latest release)"
# Stop the Home watcher first: while the old launcher is replaced, LG's home shows and the watcher
# would start the new launcher before its app list and settings are written.
pkill -f "$DATA/homewatch.js" 2>/dev/null || true
pkill -f "$DATA/wallpaper-server.js" 2>/dev/null || true
curl -fsSL "$IPK_URL" -o /tmp/lg-tv-vibehack.ipk || die "Could not download the launcher package."
curl -fsSL "$IPK_URL.sha256" -o /tmp/lg-tv-vibehack.ipk.sha256 || die "Could not download IPK SHA-256 verification file."
command -v sha256sum >/dev/null 2>&1 || die "sha256sum required to verify installation."
(cd /tmp && sed 's/infiniti-tv-home.ipk/lg-tv-vibehack.ipk/g' lg-tv-vibehack.ipk.sha256 | sha256sum -c -) || die "IPK checksum mismatch; installation aborted."
luna_wait luna://com.webos.appInstallService/dev/install \
  '{"id":"com.ares.defaultName","ipkUrl":"/tmp/lg-tv-vibehack.ipk","subscribe":true}' || die "Install failed (see message above)."
rm -f /tmp/lg-tv-vibehack.ipk /tmp/lg-tv-vibehack.ipk.sha256
ok "Launcher installed"

# ---------------------------------------------------------------- app list, settings, wallpaper
say "Reading your apps"
node "$DATA/sync.js" || die "App sync failed."

# ---------------------------------------------------------------- safe boot and Home replacement
# The wallpaper service and app sync run regardless of whether Home replacement is enabled.
cp "$DATA/boot.sh" "$INITD"
chmod +x "$INITD"
nohup setsid /usr/bin/node "$DATA/wallpaper-server.js" >> /tmp/lg-tv-vibehack.log 2>&1 < /dev/null &
if [ -n "$HOME_BTN" ]; then
  if ! sh "$DATA/home-control.sh" enable; then
    if [ -n "$REBIND_HOME" ]; then
      warn "Home binding conflict. Explicit --rebind-home was selected."
      warn "The existing Home binding and older backup will be archived before changing key 773."
      sh "$DATA/home-control.sh" rebind || die "Home repair failed; existing mapping remains protected."
    else
      die "Home key was changed externally. Configuration is preserved. After verifying Home key ID 773 in LG Input Hook, rerun installer with --rebind-home to archive the old mapping and rebind safely."
    fi
  fi
  nohup setsid /usr/bin/node "$DATA/homewatch.js" >> /tmp/lg-tv-vibehack.log 2>&1 < /dev/null &
  ok "Home replacement enabled. Reboot once for LG Input Hook."
else
  sh "$DATA/home-control.sh" disable || die "Could not safely disable Home replacement."
  ok "LG Home preserved (Home replacement disabled)."
fi

luna-send -n 1 luna://com.webos.applicationManager/launch "{\"id\":\"$APP_ID\",\"params\":{\"reload\":true}}" >/dev/null 2>&1 || true
echo
ok "Done! Reboot once to finish:  reboot"
