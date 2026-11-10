#!/usr/bin/env node
/* Wait for the actual Luna app installer completion (ES5 / Node 0.12).
 * Never launches a foreground app. Only called by the opt-in auto-updater.
 */
'use strict';
var cp = require('child_process');
var file = process.argv[2];
if (!file || !/^\/tmp\/infiniti-update\.[A-Za-z0-9]+\/infiniti-tv-home\.ipk$/.test(file)) {
  console.error('Invalid update IPK path');
  process.exit(2);
}
var done = false, output = '';
var proc = cp.spawn('luna-send', ['-i', 'luna://com.webos.appInstallService/dev/install',
  JSON.stringify({id:'com.ares.defaultName',ipkUrl:file,subscribe:true})]);
function finish(code, msg) {
  if (done) return;
  done = true;
  clearTimeout(timer);
  try { proc.kill(); } catch (ignore) {}
  if (msg) console.error(msg);
  process.exit(code);
}
proc.stdout.on('data', function(x) {
  output += String(x);
  if (output.length > 256 * 1024) output = output.slice(-65536);
  if (/"statusValue"\s*:\s*30\b|"state"\s*:\s*"installed"/.test(output)) finish(0);
  if (/"errorCode"\s*:|"returnValue"\s*:\s*false|"state"\s*:\s*"failed"/.test(output))
    finish(1, 'Installation reported failure: ' + output.slice(-500));
});
proc.stderr.on('data', function(x) {
  output += String(x);
  if (output.length > 256 * 1024) output = output.slice(-65536);
});
proc.on('error', function(err) { finish(1, err.message); });
proc.on('close', function(code) {
  if (!done) finish(1, 'Install service closed before completion (' + code + ')');
});
var timer = setTimeout(function() { finish(1, 'Install timed out'); }, 120000);
