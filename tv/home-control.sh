#!/bin/sh
# Safe reversible Home replacement for rooted webOS. Run as root.
set -eu
DATA=/home/root/lg-tv-vibehack
HOOK_CFG=/home/root/.config/lginputhook/keybinds.json
HOOK_APP=/media/developer/apps/usr/palm/applications/org.webosbrew.inputhook
KEY=773
FLAG="$DATA/home-enabled"
BACKUP="$DATA/home-key-backup.json"
CMD="$DATA/golauncher.sh"
export PATH=/usr/sbin:/usr/bin:/sbin:/bin:$PATH
[ "$(id -u)" = 0 ] || { echo "Must be run as root" >&2; exit 1; }
action="${1:-status}"
case "$action" in
  status)
    [ -f "$FLAG" ] && echo "Home replacement ENABLED" || echo "Home replacement DISABLED"
    [ -d "$HOOK_APP" ] && echo "LG Input Hook installed" || echo "LG Input Hook absent (watcher fallback only)"
    exit 0 ;;
  enable)
    [ -f "$DATA/homewatch.js" ] || { echo "Install Infiniti TV Home first." >&2; exit 1; }
    [ -d /media/developer/apps/usr/palm/applications/com.infinitimoney.tvhome ] || {
      echo "Infiniti TV Home app is not installed." >&2; exit 1;
    }
    if [ -d "$HOOK_APP" ]; then
      mkdir -p "$(dirname "$HOOK_CFG")"
      # Preserve any previous binding exactly once. Never overwrite the backup.
      node -e '
        var fs=require("fs"),f=process.argv[1],b=process.argv[2],key=process.argv[3],cmd=process.argv[4];
        var j={}; try { j=JSON.parse(fs.readFileSync(f,"utf8")); } catch(e) {}
        if (!fs.existsSync(b)) {
          var old=Object.prototype.hasOwnProperty.call(j,key);
          fs.writeFileSync(b,JSON.stringify({present:old,binding:old?j[key]:null}),{mode:384});
        }
        j[key]={action:"exec",command:cmd};
        fs.writeFileSync(f,JSON.stringify(j,null,2));
      ' "$HOOK_CFG" "$BACKUP" "$KEY" "$CMD"
      echo "Home key mapped; reboot required for LG Input Hook."
    else
      echo "LG Input Hook not installed: only Home Watcher fallback will work."
    fi
    touch "$FLAG"
    echo "Enabled. To restore: sh $DATA/home-control.sh disable"
    ;;
  disable)
    rm -f "$FLAG"
    # Restore only our binding, leave unrelated LG Input Hook settings unchanged.
    if [ -f "$BACKUP" ] && [ -f "$HOOK_CFG" ]; then
      node -e '
        var fs=require("fs"),f=process.argv[1],b=process.argv[2],key=process.argv[3],cmd=process.argv[4];
        var j,old;
        try { j=JSON.parse(fs.readFileSync(f,"utf8")); old=JSON.parse(fs.readFileSync(b,"utf8")); }
        catch(e) { console.error("Unable to read binding backup: "+e.message); process.exit(1); }
        if (!j[key] || j[key].command!==cmd) {
          console.error("Home binding changed externally; leaving it untouched.");
          process.exit(2);
        }
        if(old.present) j[key]=old.binding; else delete j[key];
        fs.writeFileSync(f,JSON.stringify(j,null,2));
      ' "$HOOK_CFG" "$BACKUP" "$KEY" "$CMD" || {
        echo "Home Watcher disabled, but the Home key needs manual inspection." >&2
        exit 1
      }
      rm -f "$BACKUP"
    elif [ -f "$BACKUP" ]; then
      echo "LG Input Hook config missing; keeping backup for manual recovery." >&2
    fi
    # Stop watcher now; the boot script will not restart it while disabled.
    pkill -f "$DATA/homewatch.js" 2>/dev/null || true
    echo "Home replacement disabled. Reboot to restore LG Home fully."
    ;;
  *) echo "Usage: sh $0 enable|disable|status" >&2; exit 2 ;;
esac
