#!/usr/bin/env node
'use strict';
// Offline policy checks: linking to a reboot-capable companion must never
// silently enable a Developer Mode service on a known black-screen LG TV.
var assert=require('assert'),fs=require('fs');
var html=fs.readFileSync('app/index.html','utf8');
var settings=fs.readFileSync('app/customize.js','utf8');
var app=fs.readFileSync('app/app.js','utf8');
var en=fs.readFileSync('README.md','utf8');
var vi=fs.readFileSync('README.vi.md','utf8');
var meta=JSON.parse(fs.readFileSync('app/appinfo.json','utf8'));
[
  'customizeDevModeTab','customizeDevModeView','customizeDevModeState',
  'customizeDevModeOpen','customizeDevModeWarning'
].forEach(function(id) {
  assert.ok(html.indexOf('id="'+id+'"')>=0,'Dev Mode settings missing '+id);
});
assert.ok(html.indexOf('com.lennylxx.devmodeforever')>=0,'Exact companion app ID must be visible');
assert.ok(settings.indexOf("var DEVMODE_APP = 'com.lennylxx.devmodeforever'")>=0,
  'Companion detection must use verified upstream app ID');
assert.ok(settings.indexOf('var devmodeConfirmUntil = 0')>=0 &&
  settings.indexOf('devmodeConfirmKeyReleased')>=0 &&
  settings.indexOf('if (e.repeat) return')>=0,
  'Companion open needs two distinct physical OK presses, not a held button');
assert.ok(settings.indexOf('root.INFINITI_DEVMODE_OPEN()')>=0,
  'Opening companion should be an intentional user-triggered event');
assert.ok(app.indexOf("launch('com.lennylxx.devmodeforever', 'Dev Mode Forever')")>=0,
  'Launcher must use normal app manager to open the installed companion');
['watchdogArm','watchdogToggle','extendDevSession','setDevMode',
  'luna://com.lennylxx.devmodeforever.service/'].forEach(function(api) {
    assert.strictEqual(app.indexOf(api),-1,
      'Infiniti app must not independently trigger a privileged reboot-capable API: '+api);
    assert.strictEqual(settings.indexOf(api),-1,
      'Customization must not call the companion service on startup: '+api);
});
assert.ok(html.indexOf('không tự')>=0 &&
  html.indexOf('REBOOT')>=0,'Explicit safety warning before opening companion');
assert.ok(vi.indexOf('## Xử lý sự cố')>=0 &&
  vi.indexOf('RECOVERY_PARTIAL')>=0 &&
  vi.indexOf('303')===-1 &&
  vi.indexOf('0305')>=0 && vi.indexOf('773')>=0,
  'Vietnamese troubleshooting must keep confirmed Home 0305/773 and safe recovery');
assert.strictEqual(vi.indexOf('ps -ef | grep homewatch phải'),-1,
  'Do not suggest obsolete foreground watcher as required process');
assert.ok(vi.indexOf('"action":"exec"')>=0,
  'Home key troubleshooting must use safe Execute action');
assert.ok(vi.indexOf('github.com/infiniti-money/lg-devmode-forever')>=0 &&
  en.indexOf('github.com/infiniti-money/lg-devmode-forever')>=0,
  'Integration should link to independent source instead of inventing an IPK download');
assert.ok(meta.version==='1.5.6','Version must match Dev Mode integration release');
console.log('Dev Mode companion safe integration verified: no silent service calls, guarded remote launch, explicit power-off caveats and updated troubleshooting.');
