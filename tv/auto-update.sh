#!/bin/sh
# Opt-in, delayed and foreground-safe app-only GitHub Releases updater.
# No Home remapping, UI launches, or modification of root sidecars.
set -u
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
DATA=/home/root/lg-tv-vibehack
APP=com.infinitimoney.tvhome
FLAG="$DATA/auto-update-enabled"
ENABLED="$DATA/boot-services-enabled"
LOG=/tmp/infiniti-auto-update.log
VERSION_URL=https://api.github.com/repos/infiniti-money/lg-tv-webos/releases/latest
PREFIX=https://github.com/infiniti-money/lg-tv-webos/releases/download
MODE="${1:---check}"
log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG" 2>/dev/null || true; }
status() {
  for appdir in "/media/developer/apps/usr/palm/applications/$APP" "/media/cryptofs/apps/usr/palm/applications/$APP"; do
    [ -d "$appdir" ] || continue
    /usr/bin/node -e '
      var fs=require("fs"),f=process.argv[1],enabled=process.argv[2]==="yes";
      var obj={enabled:enabled,version:process.argv[3],message:process.argv[4],
        checkedAt:(new Date()).toISOString()};
      fs.writeFileSync(f,"window.INFINITI_UPDATE_STATUS = "+JSON.stringify(obj)+";\n");
    ' "$appdir/update-status.js" "$([ -f "$FLAG" ] && echo yes || echo no)" "${2:-}" "$1" 2>/dev/null || true
  done
}
local_version() {
  for appdir in "/media/developer/apps/usr/palm/applications/$APP" "/media/cryptofs/apps/usr/palm/applications/$APP"; do
    [ -f "$appdir/appinfo.json" ] || continue
    /usr/bin/node -e '
      try {var v=require(process.argv[1]).version;
        if(/^[0-9]+\.[0-9]+\.[0-9]+$/.test(v))process.stdout.write(v);
      } catch(e) {}
    ' "$appdir/appinfo.json"
    return
  done
}
if [ "$MODE" = "--watch" ]; then
  # Never start an update during boot, when LG's native UI may be initializing.
  sleep 1200
  while [ -f "$FLAG" ] && [ -f "$ENABLED" ]; do
    sh "$0" --check || true
    sleep 43200
  done
  exit 0
fi
if [ "$MODE" = "--init-status" ]; then
  status 'configured' "$(local_version)"
  exit 0
fi
if [ "$MODE" = "--status" ]; then
  [ -f "$FLAG" ] && echo "Automatic app updates: ENABLED" || echo "Automatic app updates: DISABLED"
  [ -f "$LOG" ] && tail -n 15 "$LOG"
  exit 0
fi
[ "$MODE" = "--check" ] || { echo "Use --check, --watch or --status" >&2; exit 2; }
[ -f "$FLAG" ] && [ -f "$ENABLED" ] || { log 'Skipped: disabled'; exit 0; }
[ ! -f "$DATA/home-enabled" ] || { log 'Deferred: custom Home binding active'; status 'postponed: Home binding active'; exit 0; }
LOCK=/tmp/infiniti-update-lock
mkdir "$LOCK" 2>/dev/null || { log 'Another update is running'; exit 0; }
TMP=
cleanup() { [ -z "$TMP" ] || rm -rf "$TMP"; rmdir "$LOCK" 2>/dev/null || true; }
trap 'cleanup' 0
trap 'exit 1' 1 2 3 15
for cmd in curl sha256sum luna-send /usr/bin/node; do
  command -v "$cmd" >/dev/null 2>&1 || { log "Missing $cmd"; exit 1; }
done
CURRENT=$(local_version)
case "$CURRENT" in ''|*[!0-9.]*) log 'Invalid local version'; exit 1 ;; esac
foreground() {
  luna-send -n 1 luna://com.webos.applicationManager/getForegroundAppInfo '{}' 2>/dev/null |
  /usr/bin/node -e '
    var s="";process.stdin.on("data",function(x){s+=x});
    process.stdin.on("end",function(){try {
      var m=JSON.parse(s);
      if(m.returnValue!==false&&typeof m.appId==="string")process.stdout.write(m.appId);
    }catch(e){}});
  '
}
ACTIVE=$(foreground)
[ -n "$ACTIVE" ] && [ "$ACTIVE" != "$APP" ] || {
  log 'Deferred: TV foreground unknown or launcher in use'; status 'postponed: launcher active/unknown' "$CURRENT"; exit 0;
}
META=$(curl -fsSL --retry 2 --connect-timeout 10 --max-time 30 \
  -H 'User-Agent: Infiniti-TV-Home-updater' \
  -H 'Accept: application/vnd.github+json' "$VERSION_URL") || {
    log 'GitHub release check failed'; status 'release check failed' "$CURRENT"; exit 1;
  }
LATEST=$(printf '%s' "$META" | /usr/bin/node -e '
  var s="";process.stdin.on("data",function(x){s+=x});
  process.stdin.on("end",function(){try {
    var o=JSON.parse(s);
    if(!o.draft&&!o.prerelease&&/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(o.tag_name))
      process.stdout.write(o.tag_name.slice(1));
  }catch(e){}});
')
[ -n "$LATEST" ] || { log 'Invalid release metadata'; status 'invalid release metadata' "$CURRENT"; exit 1; }
MATCH=$(/usr/bin/node -e '
  var a=process.argv[1].split(".").map(Number),b=process.argv[2].split(".").map(Number);
  var answer="same";
  if(a.length!==3||b.length!==3||a.some(function(x){return !isFinite(x)})||
    b.some(function(x){return !isFinite(x)})) answer="invalid";
  else if(b[0]!==a[0])answer="major";
  else for(var i=0;i<3;i++){if(b[i]>a[i]){answer="new";break;}
    if(b[i]<a[i]){answer="old";break;}}
  process.stdout.write(answer);
' "$CURRENT" "$LATEST")
case "$MATCH" in
  same|old) status 'up to date' "$CURRENT"; exit 0 ;;
  major) log "Major upgrade $CURRENT -> $LATEST deferred for manual review"; status 'major version requires review' "$CURRENT"; exit 0 ;;
  new) ;;
  *) log 'Invalid version comparison'; exit 1 ;;
esac
TMP=$(mktemp -d /tmp/infiniti-update.XXXXXXXX) || exit 1
BASE="$PREFIX/v$LATEST"
curl -fsSL --retry 2 --connect-timeout 10 --max-time 120 "$BASE/infiniti-tv-home.ipk" -o "$TMP/infiniti-tv-home.ipk" || {
  log "Failed downloading v$LATEST IPK"; exit 1;
}
curl -fsSL --retry 2 --connect-timeout 10 --max-time 30 "$BASE/infiniti-tv-home.ipk.sha256" -o "$TMP/infiniti-tv-home.ipk.sha256" || {
  log "Failed downloading v$LATEST checksum"; exit 1;
}
[ "$(wc -l < "$TMP/infiniti-tv-home.ipk.sha256")" -eq 1 ] || {
  log 'Checksum manifest must have exactly one line'; exit 1;
}
grep -Eq '^[0-9a-f]{64}  infiniti-tv-home\.ipk
  log 'Invalid checksum manifest'; exit 1;
}
(cd "$TMP" && sha256sum -c infiniti-tv-home.ipk.sha256 >/dev/null) || {
  log "SHA-256 FAILED v$LATEST; no install"; exit 1;
}
[ -f "$FLAG" ] && [ -f "$ENABLED" ] && [ ! -f "$DATA/home-enabled" ] || {
  log 'Update disabled during download'; exit 0;
}
ACTIVE=$(foreground)
[ -n "$ACTIVE" ] && [ "$ACTIVE" != "$APP" ] || {
  log 'Deferred: launcher became active'; exit 0;
}
log "Installing verified v$LATEST (was $CURRENT), without foreground launch"
/usr/bin/node "$DATA/install-ipk-update.js" "$TMP/infiniti-tv-home.ipk" || {
  log "Installation FAILED for v$LATEST; no uninstall attempted";
  status 'installation failed' "$CURRENT"; exit 1;
}
if [ -f "$DATA/sync.js" ]; then
  /usr/bin/node "$DATA/sync.js" >> "$LOG" 2>&1 || log 'Post-install app sync failed'
fi
status 'updated successfully' "$LATEST"
log "Updated to v$LATEST; LG Home preserved"
exit 0
 "$TMP/infiniti-tv-home.ipk.sha256" || {
  log 'Invalid checksum manifest'; exit 1;
}
(cd "$TMP" && sha256sum -c infiniti-tv-home.ipk.sha256 >/dev/null) || {
  log "SHA-256 FAILED v$LATEST; no install"; exit 1;
}
[ -f "$FLAG" ] && [ -f "$ENABLED" ] && [ ! -f "$DATA/home-enabled" ] || {
  log 'Update disabled during download'; exit 0;
}
ACTIVE=$(foreground)
[ -n "$ACTIVE" ] && [ "$ACTIVE" != "$APP" ] || {
  log 'Deferred: launcher became active'; exit 0;
}
log "Installing verified v$LATEST (was $CURRENT), without foreground launch"
/usr/bin/node "$DATA/install-ipk-update.js" "$TMP/infiniti-tv-home.ipk" || {
  log "Installation FAILED for v$LATEST; no uninstall attempted";
  status 'installation failed' "$CURRENT"; exit 1;
}
if [ -f "$DATA/sync.js" ]; then
  /usr/bin/node "$DATA/sync.js" >> "$LOG" 2>&1 || log 'Post-install app sync failed'
fi
status 'updated successfully' "$LATEST"
log "Updated to v$LATEST; LG Home preserved"
exit 0
