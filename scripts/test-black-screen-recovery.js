#!/usr/bin/env node
'use strict';
// Regression: no launcher may be automatically started by a rooted TV after
// power/wake, and emergency recovery MUST disable startup even if keymap fails.
var assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
var temp=fs.mkdtempSync(path.join(os.tmpdir(),'infiniti-black-screen-'));
var script=fs.readFileSync('tv/safe-recovery.sh','utf8');
var boot=fs.readFileSync('tv/boot.sh','utf8');
var install=fs.readFileSync('install.sh','utf8');
var home=fs.readFileSync('tv/home-control.sh','utf8');
var ps1=fs.readFileSync('scripts/recover-lg-tv.ps1','utf8');
var root=path.join(temp,'root'), data=path.join(root,'lg-tv-vibehack');
var ini=path.join(temp,'init.d'), snapshots=path.join(root,'infiniti-tv-recovery');
var hook=path.join(root,'.config','lginputhook','keybinds.json');
var log=path.join(temp,'lg-tv-vibehack.log');
function make(file,content) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,content||'original');
}
function only(file) {return fs.readFileSync(file,'utf8');}
try {
  make(path.join(data,'home-enabled'));
  make(path.join(data,'home-event-device'),'/dev/input/event3');
  make(path.join(data,'boot-services-enabled'));
  make(path.join(data,'boot-home-armed'));
  make(path.join(data,'boot-home-trial'));
  make(path.join(data,'boot-home-enabled'));
  make(path.join(ini,'lg-tv-vibehack'),'previous boot script');
  make(path.join(ini,'97-homekey'),'sleep 25; while true; do :; done');
  make(path.join(data,'home-key-backup.json'),'{"present":true,"binding":{"action":"launch"}}');
  make(path.join(data,'keymap.js'),'process.exit(1);'); // emulate conflicting backup
  make(hook,'{"773":{"action":"exec"}}');
  make(log,'before black screen');
  // Replace only fixed application test locations; never change the real
  // machine's init.d or home directories during CI.
  var recovery=script
    .replace('D=/home/root/lg-tv-vibehack','D='+data)
    .replace('I=/var/lib/webosbrew/init.d','I='+ini)
    .replace('ROOT=/home/root/infiniti-tv-recovery','ROOT='+snapshots)
    .replace(/\/home\/root\/\.config\/lginputhook\/keybinds\.json/g,hook)
    .replace('/tmp/lg-tv-vibehack.log',log)
    .replace('/usr/bin/node "$D/keymap.js"',JSON.stringify(process.execPath)+' "$D/keymap.js"');
  var tmpScript=path.join(temp,'safe-recovery.sh');
  make(tmpScript,recovery);
  var a=cp.spawnSync('sh',[tmpScript],{encoding:'utf8',timeout:10000});
  assert.strictEqual(a.status,2,'Conflicted Home mapping must not be reported as complete recovery');
  assert.ok(a.stderr.indexOf('RECOVERY_PARTIAL:')>=0,
    'Explicit partial status when keymap cannot safely restore');
  assert.ok(a.stdout.indexOf('BOOT_AUTOSTART_DISABLED:')>=0,
    'Autostart still disabled when Home mapping needs manual inspection');
  assert.ok((a.stdout+a.stderr).indexOf('WARNING')>=0,'keymap conflict reported');
  ['home-enabled','home-event-device','boot-services-enabled',
    'boot-home-armed','boot-home-trial','boot-home-enabled'].forEach(function(f){
    assert.strictEqual(fs.existsSync(path.join(data,f)),false,'disarmed '+f);
  });
  ['lg-tv-vibehack','97-homekey'].forEach(function(f){
    assert.strictEqual(fs.existsSync(path.join(ini,f)),false,'no startup hook '+f);
  });
  var backupDirs=fs.readdirSync(snapshots);
  assert.strictEqual(backupDirs.length,1);
  var backup=path.join(snapshots,backupDirs[0]);
  assert.strictEqual(only(path.join(backup,'97-homekey')).indexOf('sleep 25'),0,
    'user custom 25-second loop must be backed up without deletion');
  assert.strictEqual(only(path.join(backup,'home-enabled')),'original');
  assert.ok(fs.existsSync(path.join(backup,'boot-home-armed')) &&
    fs.existsSync(path.join(backup,'boot-home-trial')) &&
    fs.existsSync(path.join(backup,'boot-home-enabled')),
    'Recovery should retain evidence of all boot takeover flags');
  assert.ok(fs.existsSync(path.join(backup,'home-key-backup.json')),
    'conflicting Input Hook backup must survive recovery');
  assert.ok(fs.existsSync(path.join(backup,'keybinds.json')),
    'Input Hook keybinds must be preserved before attempted restore');
  assert.ok(fs.existsSync(path.join(backup,'lg-tv-vibehack.log')),
    'evidence should remain available');
  // Second invocation must be idempotent even when files were already moved.
  var again=cp.spawnSync('sh',[tmpScript],{encoding:'utf8',timeout:10000});
  assert.strictEqual(again.status,2,'Repeated failed keymap restore remains partial');
  assert.ok(again.stderr.indexOf('RECOVERY_PARTIAL:')>=0);
  assert.ok(fs.readdirSync(snapshots).length>=2);

  // A clean keymap restore produces the only valid COMPLETE marker.
  make(path.join(data,'keymap.js'),'process.exit(0);');
  var clean=cp.spawnSync('sh',[tmpScript],{encoding:'utf8',timeout:10000});
  assert.strictEqual(clean.status,0,clean.stderr);
  assert.ok(clean.stdout.indexOf('RECOVERY_COMPLETE:')>=0);
  assert.strictEqual(clean.stdout.indexOf('RECOVERY_PARTIAL:'),-1);
  var testBoot=boot.replace('DIR=/home/root/lg-tv-vibehack','DIR='+data)
    .replace('LOG=/tmp/lg-tv-vibehack.log','LOG='+path.join(temp,'boot.log'));
  var bootScript=path.join(temp,'boot.sh');make(bootScript,testBoot);
  // Even old home-enabled flags may be left behind by a crash. No force launch.
  make(path.join(data,'home-enabled'));
  var cold=cp.spawnSync('sh',[bootScript],{encoding:'utf8',timeout:3000});
  assert.strictEqual(cold.status,0,cold.stderr);
  assert.ok(only(path.join(temp,'boot.log')).indexOf('SAFE MODE')>=0);
  assert.ok(boot.indexOf('applicationManager/launch')<0,
    'boot script must never open a UI application');
  assert.ok(boot.indexOf('homewatch.js')<0 &&
    boot.indexOf('"$DIR/homewatch.js" --boot')<0,
    'boot must not start old watcher/foreground hijack');
  assert.ok(boot.indexOf('home-event-monitor.js')<0,
    'boot must not start evdev monitor on power/wake');
  assert.ok(/HOME_BTN=""; UNINSTALL=""/.test(install),
    'installer must default to no Home takeover');
  assert.ok(install.indexOf('if [ -n "$RECOVER_HOME" ]; then') <
    install.indexOf('sh /tmp/infiniti-safe-recovery.sh'),
    'Home recovery must only run when explicitly requested');
  assert.ok(install.indexOf('if [ -e /var/luna/preferences/webosbrew_failsafe ]; then') >= 0,
    'Regular installs must stop in Homebrew Failsafe state');
  assert.ok(install.indexOf('APP_ONLY_COMPLETE')>=0,
    'A user who has lost root services needs an app-only installation option');
  assert.ok(install.indexOf('if [ -n "$WALL_SERVICE" ]; then')>=0 &&
    install.indexOf('cp "$DATA/boot.sh" "$INITD"') >
      install.indexOf('if [ -n "$WALL_SERVICE" ]; then'),
    'Installer may register a background hook only after explicit opt-in');
  assert.ok(install.indexOf('nohup setsid /usr/bin/node "$DATA/homewatch.js"')<0,
    'installer must not start a foreground hijacking watcher');
  assert.ok(install.indexOf('luna-send -n 1 luna://com.webos.applicationManager/launch "{')<0,
    'installer must not automatically open Infiniti');
  assert.ok(home.indexOf('rm -f "$FLAG" "$DATA/home-event-device"') <
    home.indexOf('/usr/bin/node "$DATA/keymap.js" disable'),
    'Home disable must disarm first and attempt keymap restoration second');
  assert.ok(home.indexOf('DISABLED FOR SAFETY: direct evdev Home watcher')>=0,
    'Unsafe physical-key event monitor must not be newly activated');
  var watcher=fs.readFileSync('tv/homewatch.js','utf8');
  assert.ok(watcher.indexOf('applicationManager/launch')<0,
    'Standalone old Home watcher must never force a foreground app');
  assert.ok(watcher.indexOf('getForegroundAppInfo')<0,
    'Legacy --boot must not subscribe to foreground changes');
  assert.ok(ps1.indexOf('ssh.exe')>=0 && ps1.indexOf('sh -s')>=0,
    'PowerShell recovery must pipe shell through SSH rather than parse it locally');
  assert.ok(ps1.indexOf('reboot"')>=0 && ps1.indexOf('root@$TV reboot')>=0,
    'Reboot must be a separate, user-triggered step');
  console.log('Black-screen regression passed: safe boot, partial-vs-complete recovery, archived 25s hook, no foreground hijack or unsafe evdev, installer/PowerShell.');
} finally {
  // Cleanup only our own mkdtemp directory.
  fs.rmSync(temp,{recursive:true,force:true});
}
