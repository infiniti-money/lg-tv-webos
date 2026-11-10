#!/usr/bin/env node
'use strict';
// Offline checks: no real TV install, network access or Home key changes.
var assert=require('assert'),fs=require('fs'),vm=require('vm');
var updater=fs.readFileSync('tv/auto-update.sh','utf8');
var installer=fs.readFileSync('tv/install-ipk-update.js','utf8');
var boot=fs.readFileSync('tv/boot.sh','utf8');
var rootInstaller=fs.readFileSync('install.sh','utf8');
var safe=fs.readFileSync('tv/safe-recovery.sh','utf8');
var wall=fs.readFileSync('tv/wallpaper-server.js','utf8');
var html=fs.readFileSync('app/index.html','utf8');
function check(text,expression,message){ assert.ok(expression.test(text),message); }
check(rootInstaller,/--auto-update\) AUTO_UPDATE=1/, 'auto updater must require opt-in');
check(rootInstaller,/--wallpaper-service\) WALL_SERVICE=1/, 'wallpaper server can be enabled alone');
check(rootInstaller,/--no-auto-update\) STOP_AUTO=1/, 'auto updater can be disabled');
check(rootInstaller,/for f in .*auto-update\.sh install-ipk-update\.js/, 'root installer must fetch updater files');
check(boot,/if \[ -f "\$DIR\/auto-update-enabled" \]/, 'boot updater is flag gated');
check(boot,/auto-update\.sh" --watch/, 'boot starts only background watcher');
check(updater,/sleep 1200/, 'delay first updater check for 20 minutes after boot');
check(updater,/sleep 43200/, 'check approximately twice per day');
check(updater,/getForegroundAppInfo/, 'must guard foreground before update');
check(updater,/ACTIVE=\$\(foreground\)[\s\S]*?ACTIVE=\$\(foreground\)/,
  'must check foreground twice before installation');
check(updater,/\[ ! -f "\$DATA\/home-enabled" \]/,
  'must refuse to auto-update under Home takeover');
check(updater,/\[ -f "\$FLAG" \] && \[ -f "\$ENABLED" \]/,
  'must stop when opt-in is disabled');
check(updater,/sha256sum -c infiniti-tv-home\.ipk\.sha256/,
  'must verify download checksum before installing');
check(updater,/grep -Eq '\^\[0-9a-f\]\{64\}  infiniti-tv-home\\\.ipk\$'/,
  'checksum manifest filename must be pinned');
check(updater,/install-ipk-update\.js" "\$TMP\/infiniti-tv-home\.ipk"/,
  'update installation must use the downloaded verified IPK');
assert.strictEqual(updater.indexOf('applicationManager/launch'),-1,
  'updater must not launch or steal foreground from LG Home');
assert.strictEqual(boot.indexOf('applicationManager/launch'),-1,
  'boot remains no-UI after adding updater');
assert.ok(installer.indexOf('statusValue')>=0 &&
  installer.indexOf('30')>=0,'must wait for final installer success');
assert.strictEqual(installer.indexOf('applicationManager/launch'),-1,
  'update installer helper must never launch UI');
check(safe,/auto-update-enabled/, 'black-screen rescue must disable auto-updater');
check(wall,/foreground === 'com\.infinitimoney\.tvhome'/,
  'phone wallpaper changes may reload only if Infiniti is foreground');
check(html,/id="customizeWallQr"/, 'wallpaper QR should live in Customize');
check(html,/id="customizeUpdateState"/, 'auto-update status should be in Customize');
assert.strictEqual(html.indexOf('id="btnWall"'),-1,
  'wallpaper top pill should not trap remote navigation');
// Execute only the semver decision code inside a sandbox to catch errors
// without downloading or installing real packages.
var expression=updater.match(/MATCH=\$\(\/usr\/bin\/node -e '\n([\s\S]*?)' "\$CURRENT" "\$LATEST"\)/);
assert.ok(expression,'Version comparator should be available for pure testing');
function compare(from,to){
  var output='';
  vm.runInNewContext(expression[1],{
    process:{argv:['node',from,to],stdout:{write:function(x){output+=x;}}},
    Number:Number,isFinite:isFinite
  });
  return output;
}
assert.strictEqual(compare('1.5.3','1.5.4'),'new');
assert.strictEqual(compare('1.5.3','1.6.0'),'new');
assert.strictEqual(compare('1.5.4','1.5.3'),'old');
assert.strictEqual(compare('1.5.4','1.5.4'),'same');
assert.strictEqual(compare('1.5.4','2.0.0'),'major');
console.log('Background auto-update safety passed: opt-in, cooldown, foreground checks, checksum, semver, Home rollback.');
