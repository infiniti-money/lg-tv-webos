#!/usr/bin/env node
'use strict';
// Root/Failsafe regression: Dev Mode is informational even when the external
// companion is present. Launching a reboot-capable watchdog is not safe here.
var assert=require('assert'),fs=require('fs');
var html=fs.readFileSync('app/index.html','utf8');
var settings=fs.readFileSync('app/customize.js','utf8');
var app=fs.readFileSync('app/app.js','utf8');
var vi=fs.readFileSync('README.vi.md','utf8');
[
  'customizeDevModeTab','customizeDevModeView','customizeDevModeState',
  'customizeRootModeState','customizeDevModeWarning'
].forEach(function(id){
  assert.ok(html.indexOf('id="'+id+'"')>=0, 'Dev Mode status missing '+id);
});
assert.strictEqual(html.indexOf('id="customizeDevModeOpen"'),-1,
  'Rooted/unknown TV cannot open reboot-capable companion from settings');
assert.ok(html.indexOf('TV đã root: KHÔNG cài, bật hoặc gia hạn Developer Mode')>=0,
  'Do not suggest official Developer Mode on rooted Homebrew');
assert.ok(html.indexOf('Không thể xác nhận quyền root')>=0,
  'Root is unknown to the web UI until independently verified');
assert.ok(html.indexOf('REBOOT')>=0 && html.indexOf('Failsafe')>=0,
  'Dangerous reboot and failsafe warnings must be visible');
assert.ok(settings.indexOf("var DEVMODE_APP = 'com.lennylxx.devmodeforever'")>=0,
  'Existing companion may be displayed as a read-only installed-app status');
assert.strictEqual(settings.indexOf('root.INFINITI_DEVMODE_OPEN'),-1);
assert.strictEqual(app.indexOf('INFINITI_DEVMODE_OPEN'),-1);
assert.strictEqual(settings.indexOf("$('customizeDevModeOpen')"),-1);
['watchdogArm','watchdogToggle','extendDevSession','setDevMode',
  'machineReboot','luna://com.lennylxx.devmodeforever.service/'].forEach(function(api) {
  assert.strictEqual(settings.indexOf(api),-1,
    'No rebooter or privileged Developer Mode API in Customize: '+api);
  assert.strictEqual(app.indexOf(api),-1,
    'No rebooter or privileged Developer Mode API in launcher: '+api);
});
assert.ok(vi.indexOf('RECOVERY_PARTIAL')>=0 && vi.indexOf('0305')>=0,
  'Keep Home rollback and remote mapping guidance');
assert.ok(vi.indexOf('Developer Mode chính thức')>=0,
  'Troubleshooting must distinguish rooted vs no-root');
console.log('Dev Mode safe: no reboot-capable app launcher, rooted/unknown warnings and non-mutating status.');
