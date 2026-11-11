#!/usr/bin/env node
'use strict';
// Offline cold-boot regression only: never interact with LG hardware.
var assert = require('assert'), fs=require('fs'), os=require('os'),
  path=require('path'), cp=require('child_process');
var home=fs.readFileSync('tv/home-control.sh','utf8');
var boot=fs.readFileSync('tv/boot.sh','utf8');
var helper=fs.readFileSync('tv/boot-home-once.sh','utf8');
var installer=fs.readFileSync('install.sh','utf8');
var recovery=fs.readFileSync('tv/safe-recovery.sh','utf8');
var temp=fs.mkdtempSync(path.join(os.tmpdir(),'infiniti-boot-773-'));
try {
  var data=path.join(temp,'sidecar'), log=path.join(temp,'boot.log'),
    trace=path.join(temp,'trace.log'), failsafe=path.join(temp,'webosbrew_failsafe');
  fs.mkdirSync(data);
  fs.writeFileSync(path.join(data,'home-enabled'),'');
  fs.writeFileSync(path.join(data,'boot-home-once.sh'),'');
  assert.ok(/KEY=773/.test(home),'Physical Home ID must be decimal 773 (hex 0305)');
  assert.ok(/boot-arm\)/.test(home) && /boot-confirm\)/.test(home) &&
    /boot-disable\)/.test(home),'Explicit one-shot trial, confirmation and rollback required');
  assert.ok(home.indexOf('boot-home-armed')>=0 && home.indexOf('boot-home-trial')>=0 &&
    home.indexOf('boot-home-enabled')>=0,'Three boot control states required');
  assert.ok(installer.indexOf('--start-home-on-boot) START_BOOT=1')>=0 &&
    installer.indexOf('--start-home-on-boot requires --enable-home')>=0,
    'Boot takeover must require explicit Home mapping');
  assert.ok(installer.indexOf('sh "$DATA/home-control.sh" boot-arm')>=0,
    'Installer must only arm one cold-boot trial, never silently persist');
  assert.ok(/sleep 55/.test(helper),'App start must be delayed until LG app manager is ready');
  assert.ok(/getForegroundAppInfo/.test(helper),'Must check app manager before launch');
  var launches=helper.match(/luna:\/\/com\.webos\.applicationManager\/launch/g)||[];
  assert.strictEqual(launches.length,1,'Exactly ONE launch request in helper');
  assert.ok(!/^\s*while\s+/m.test(helper),'No auto relaunch loop at boot');
  assert.strictEqual(helper.indexOf('home-event-monitor'),-1,'Never read evdev at boot');
  assert.ok(helper.indexOf('rm -f "$D/boot-home-enabled" "$D/boot-home-trial"')>=0,
    'Failure must disable subsequent boot launch');
  assert.strictEqual(boot.indexOf('applicationManager/launch'),-1,
    'Init.d dispatcher must not itself launch the app');
  assert.ok(boot.indexOf('mv "$DIR/boot-home-armed" "$DIR/boot-home-trial"')>=0,
    'Trial flag must be consumed BEFORE first launch');
  assert.ok(recovery.indexOf('"$D/boot-home-armed"')>=0 &&
    recovery.indexOf('"$D/boot-home-trial"')>=0 &&
    recovery.indexOf('"$D/boot-home-enabled"')>=0,
    'Emergency rescue must disarm all boot modes');
  var shell=boot.replace('DIR=/home/root/lg-tv-vibehack','DIR='+data)
    .replace('LOG=/tmp/lg-tv-vibehack.log','LOG='+log)
    .replace('/var/luna/preferences/webosbrew_failsafe',failsafe)
    .replace('/var/lib/webosbrew/init.d/97-homekey',path.join(temp,'97-homekey'))
    .replace(/nohup setsid sh "\$DIR\/boot-home-once.sh" trial[^\n]+/g,
      'printf "trial\\n" >> '+trace)
    .replace(/nohup setsid sh "\$DIR\/boot-home-once.sh" confirmed[^\n]+/g,
      'printf "confirmed\\n" >> '+trace);
  var file=path.join(temp,'boot-test.sh');
  fs.writeFileSync(file,shell);
  function start() {
    var result=cp.spawnSync('sh',[file],{encoding:'utf8',timeout:3000});
    assert.strictEqual(result.status,0,result.stderr);
    return fs.existsSync(trace)?fs.readFileSync(trace,'utf8').trim().split('\n').filter(Boolean):[];
  }
  assert.deepStrictEqual(start(),[],'Default LG safe boot must not open Infiniti');
  fs.writeFileSync(path.join(data,'boot-home-armed'),'');
  assert.deepStrictEqual(start(),['trial'],'One armed boot launches exactly once');
  assert.ok(!fs.existsSync(path.join(data,'boot-home-armed')),'Consumed trial flag absent');
  assert.ok(fs.existsSync(path.join(data,'boot-home-trial')),'Consumed trial marker retained');
  assert.deepStrictEqual(start(),['trial'],'Second cold boot defaults to LG until confirmation');
  fs.writeFileSync(path.join(data,'boot-home-enabled'),'');
  fs.unlinkSync(path.join(data,'boot-home-trial'));
  assert.deepStrictEqual(start(),['trial','confirmed'],
    'After manual confirmation, each cold boot starts one invocation');
  fs.writeFileSync(failsafe,'preserve Homebrew Failsafe marker');
  assert.deepStrictEqual(start(),['trial','confirmed'],
    'Failsafe marker must suppress all launch and maintenance hooks');
  assert.strictEqual(fs.readFileSync(failsafe,'utf8'),'preserve Homebrew Failsafe marker',
    'Boot path must not delete the Failsafe marker');
  fs.unlinkSync(failsafe);
  fs.writeFileSync(path.join(temp,'97-homekey'),'legacy script');
  assert.deepStrictEqual(start(),['trial','confirmed'],
    'Legacy 97-homekey must block every boot launch to avoid conflicts');
  console.log('Home 0305/773 cold-boot regression: LG-safe default, one-shot trial, manual confirmation, legacy-hook guard and recovery passed.');
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
