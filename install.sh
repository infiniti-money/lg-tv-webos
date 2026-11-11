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
#   --enable-home           EXPLICITLY map remote Home 0305/773 to Infiniti via LG Input Hook
#   --start-home-on-boot    Arm one cold-boot Infiniti trial (requires --enable-home);
#                           confirm after TV displays correctly to persist
#   --no-home-button        Deprecated alias for the safe default
#   --rebind-home           Explicitly rebind a conflicting mapping (requires --enable-home)
#   --auto-update           Enable delayed, SHA-256-verified app updates + wallpaper server
#   --wallpaper-service     Enable wallpaper QR phone server only (no app update)
#   --no-auto-update        Disable auto updates; safe mode also stops background services by default
#   --uninstall             Remove Infiniti TV Home after safe recovery
#   --app-only              Only install IPK; no root sidecar/boot/keymap changes
#   --diagnose-root         Read-only Homebrew/Failsafe status, even without root
#   --recover-home          Explicitly archive/disarm custom Home hooks and exit
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
HOME_BTN=""; UNINSTALL=""; REBIND_HOME=""; AUTO_UPDATE=""; WALL_SERVICE=""; STOP_AUTO=""; START_BOOT=""
APP_ONLY=""; DIAGNOSE_ROOT=""; RECOVER_HOME=""
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
    --enable-home) HOME_BTN=1 ;;
    --start-home-on-boot) START_BOOT=1 ;;
    --rebind-home) REBIND_HOME=1 ;;
    --auto-update) AUTO_UPDATE=1; WALL_SERVICE=1 ;;
    --wallpaper-service) WALL_SERVICE=1 ;;
    --no-auto-update) STOP_AUTO=1 ;;
    --uninstall) UNINSTALL=1 ;;
    --app-only) APP_ONLY=1 ;;
    --diagnose-root) DIAGNOSE_ROOT=1 ;;
    --recover-home) RECOVER_HOME=1 ;;
    *) die "Unknown option: $1" ;;
  esac
  shift
done

# ---------------------------------------------------------------- checks
if [ -n "$DIAGNOSE_ROOT" ]; then
  [ -z "$UNINSTALL$RECOVER_HOME$HOME_BTN$START_BOOT$AUTO_UPDATE$WALL_SERVICE" ] ||
    die "--diagnose-root cannot be combined with installing or recovery"
  curl -fsSL "$RAW/tv/root-safety-check.sh" -o /tmp/infiniti-root-safety-check.sh ||
    die "Cannot download root diagnostic"
  sh /tmp/infiniti-root-safety-check.sh
  exit $?
fi
[ "$(id -u)" = "0" ] || die "Root not available in this shell. Do not enable Developer Mode or attempt automatic re-root."
[ -d /var/lib/webosbrew ] || die "Homebrew Channel with root not found. Root the TV first (see README)."
for c in node luna-send curl; do command -v "$c" >/dev/null 2>&1 || die "'$c' not found on this TV."; done
if [ -n "$REBIND_HOME" ] && [ -z "$HOME_BTN" ]; then
  die "--rebind-home requires --enable-home; safe mode is the default."
fi
if [ -n "$START_BOOT" ] && [ -z "$HOME_BTN" ]; then
  die "--start-home-on-boot requires --enable-home: Home key 773 must be backed up first."
fi

# Root/Homebrew recovery must never run as a side effect of installing an IPK.
# In particular, moving a 97-homekey hook on every ordinary update could look
# like root loss. Recovery is a separate, explicitly requested operation.
if [ -n "$RECOVER_HOME" ]; then
  say "Explicit Home recovery requested; backups will be preserved"
  curl -fsSL "$RAW/tv/safe-recovery.sh" -o /tmp/infiniti-safe-recovery.sh ||
    die "Cannot download recovery helper"
  sh /tmp/infiniti-safe-recovery.sh
  exit $?
fi
if [ -e /var/luna/preferences/webosbrew_failsafe ]; then
  die "Homebrew FAILSAFE marker detected. Refusing installation; diagnose the original boot crash first."
fi
if [ -n "$APP_ONLY" ]; then
  [ -z "$HOME_BTN$START_BOOT$AUTO_UPDATE$WALL_SERVICE$REBIND_HOME$UNINSTALL$STOP_AUTO" ] ||
    die "--app-only cannot be combined with Home, boot, services, or uninstall options"
  say "APP ONLY: verifying and installing IPK without changing root configuration"
  command -v sha256sum >/dev/null 2>&1 || die "sha256sum is required"
  curl -fsSL "$IPK_URL" -o /tmp/lg-tv-vibehack.ipk || die "IPK download failed"
  curl -fsSL "$IPK_URL.sha256" -o /tmp/lg-tv-vibehack.ipk.sha256 || die "Checksum download failed"
  (cd /tmp && sed 's/infiniti-tv-home.ipk/lg-tv-vibehack.ipk/g' lg-tv-vibehack.ipk.sha256 | sha256sum -c -) ||
    die "IPK checksum mismatch"
  luna_wait luna://com.webos.appInstallService/dev/install \
    '{"id":"com.ares.defaultName","ipkUrl":"/tmp/lg-tv-vibehack.ipk","subscribe":true}' ||
    die "App-only installation failed; root scripts remain unchanged"
  rm -f /tmp/lg-tv-vibehack.ipk /tmp/lg-tv-vibehack.ipk.sha256
  ok "APP_ONLY_COMPLETE: Homebrew hooks, keymap and root settings unchanged"
  exit 0
fi
if [ -e /var/lib/webosbrew/init.d/97-homekey ]; then
  warn "Existing 97-homekey boot hook detected; no changes made to it."
  [ -z "$HOME_BTN$START_BOOT" ] ||
    die "Refusing Home remap/startup while a legacy Home hook exists. Recover explicitly."
fi

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
  # Preserve other root services, startup hooks and recovery evidence.
  if [ -f "$INITD" ] && grep -q 'Infiniti boot' "$INITD"; then
    mkdir -p "$DATA/uninstall-backups" || exit 1
    mv "$INITD" "$DATA/uninstall-backups/$(date +%Y%m%d-%H%M%S)-lg-tv-vibehack" || exit 1
  fi
  luna_wait luna://com.webos.appInstallService/remove "{\"id\":\"$APP_ID\",\"subscribe\":true}" || warn "Could not remove the launcher app"
  ok "IPK uninstalled. Root scripts, logs, Homebrew, and recovery backups preserved."
  warn "Inspect remaining Home hooks before choosing to reboot."
  exit 0
fi

# ---------------------------------------------------------------- files
say "Downloading scripts"
mkdir -p "$DATA/icons"
for f in sync.js homewatch.js home-event-monitor.js keymap.js wallpaper-server.js wallpaper.html golauncher.sh boot.sh boot-home-once.sh home-control.sh safe-recovery.sh root-safety-check.sh auto-update.sh install-ipk-update.js diagnose-home.sh integration-diagnostics.sh compat-check.sh; do
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

# ---------------------------------------------------------------- opt-in maintenance (never launches the TV home)
# All old boot hooks were previously archived by safe-recovery.sh. Only the
# explicit flags below restore background (non-UI) services, never the old
# Home watcher or evdev key monitor. This is reversible with safe-recovery.sh.
if [ -n "$STOP_AUTO" ]; then
  rm -f "$DATA/auto-update-enabled"
fi
if [ -n "$AUTO_UPDATE" ]; then
  touch "$DATA/auto-update-enabled"
  WALL_SERVICE=1
fi
if [ -n "$WALL_SERVICE" ]; then
  touch "$DATA/boot-services-enabled"
  mkdir -p "$(dirname "$INITD")"
  cp "$DATA/boot.sh" "$INITD"
  chmod +x "$INITD"
  # Start only the local wallpaper phone service, without any foreground UI.
  if ! ps | grep '[w]allpaper-server.js' | grep -v grep >/dev/null 2>&1; then
    nohup setsid /usr/bin/node "$DATA/wallpaper-server.js" >> /tmp/lg-tv-vibehack.log 2>&1 < /dev/null &
  fi
  ok "Wallpaper service enabled. QR can be opened from Customize > Wallpaper."
  if [ -n "$AUTO_UPDATE" ]; then
    # No immediate GitHub update during installation or startup. The opt-in
    # watcher waits 20 minutes and then checks twice per day.
    if ! ps | grep '[a]uto-update.sh --watch' | grep -v grep >/dev/null 2>&1; then
      nohup setsid sh "$DATA/auto-update.sh" --watch >> /tmp/infiniti-auto-update.log 2>&1 < /dev/null &
    fi
    ok "SHA-256 verified automatic app updates enabled (delayed background mode)."
  fi
else
  ok "Safe mode: no background service registered. Use --wallpaper-service or --auto-update when ready."
fi

# Persist the status for Customize > Giao diện even before the first scheduled
# network check. This only writes update-status.js, never installs or opens UI.
sh "$DATA/auto-update.sh" --init-status || warn "Could not initialize auto-update status."

# ---------------------------------------------------------------- optional manual Home button interception
# Safe default: NO auto-boot hook, NO watcher, NO evdev reader, NO UI launch.
# We keep only the app and read-only synched metadata until the user tests
# normal LG power/standby cycles.
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
  ok "Manual Home 0305 (773) mapped to Infiniti through LG Input Hook."
  warn "Open LG Input Hook once and Save changes. Test Home while TV is running."
  if [ -n "$START_BOOT" ]; then
    sh "$DATA/home-control.sh" boot-arm ||
      die "Cold-boot trial not armed. Mapping remains backed up; inspect status."
    warn "Boot trial ONE SHOT only. Reboot to test. If successful, run: sh $DATA/home-control.sh boot-confirm"
  fi
else
  # The first recovery already removed all startup launchers. Do NOT
  # reactivate them or force the launcher into the foreground here.
  ok "SAFE MODE: LG Home remains primary; Infiniti is installed but not auto-opened."
fi

echo
ok "Installation complete. LG native Home is preserved as rollback."
[ -z "$START_BOOT" ] || warn "Boot trial is not permanent until boot-confirm after seeing Infiniti on the TV."
ok "To start Infiniti manually, select it from the TV app list."
ok "Emergency rollback: sh $DATA/safe-recovery.sh"
[ -z "$AUTO_UPDATE" ] || ok "Auto update status: sh $DATA/auto-update.sh --status"
