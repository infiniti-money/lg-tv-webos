#!/usr/bin/env node
/*
 * Infiniti TV Home: app-catalog watcher only (legacy webOS 3.x / Node 0.12).
 *
 * SAFETY: This process NEVER calls Luna to start another app and NEVER
 * redirects native LG Home, Live TV, Homebrew Channel or Input Hook.
 * Even a manual start with the obsolete --boot flag must not hijack the UI.
 * Users who want Home mapping must explicitly configure LG Input Hook.
 */
'use strict';
var cp = require('child_process');
var SYNC = '/home/root/lg-tv-vibehack/sync.js';
var processSub = null, syncing = false, again = false, stopping = false;
var retryTimer = null, intervalTimer = null;

function log(x) { console.log(new Date().toISOString() + ' ' + x); }
function readJSON(text) {
  try { return JSON.parse(text); } catch (ignored) { return null; }
}
// Retained only for compatibility with older tests or clients.
// No foreground app, including com.webos.app.home, triggers a redirect.
function shouldRedirect() { return false; }
function runSync() {
  if (stopping) return;
  if (syncing) { again = true; return; }
  syncing = true;
  cp.execFile('/usr/bin/node', [SYNC], {timeout: 180000}, function(err, out, stderr) {
    syncing = false;
    if (stopping) return;
    log('apps sync ' + (err ? 'failed: ' + String(stderr || err.message).slice(0, 240) :
      'ok: ' + String(out || '').slice(0, 240)));
    if (again) { again = false; runSync(); }
  });
}
function subscribeApps() {
  if (stopping) return;
  var proc;
  try {
    proc = cp.spawn('luna-send',
      ['-i', 'luna://com.webos.applicationManager/listLaunchPoints', '{"subscribe":true}']);
  } catch (err) {
    log('listLaunchPoints subscribe failed: ' + err.message);
    retryTimer = setTimeout(subscribeApps, 5000);
    return;
  }
  processSub = proc;
  var buf = '';
  proc.stdout.on('data', function(chunk) {
    buf += String(chunk);
    if (buf.length > 512 * 1024) buf = buf.slice(-4096);
    var lines = buf.split(/\r?\n/);
    buf = lines.pop();
    lines.forEach(function(line) {
      var m = readJSON(line.trim());
      if (!m || m.launchPoints) return;
      if (m.change === 'added' || m.change === 'removed' || m.change === 'updated') {
        log('apps ' + m.change);
        runSync();
      }
    });
  });
  proc.on('error', function(err) { log('catalog watcher error: ' + err.message); });
  proc.on('close', function() {
    if (processSub === proc) processSub = null;
    if (!stopping) retryTimer = setTimeout(subscribeApps, 5000);
  });
}
function shutdown() {
  stopping = true;
  if (retryTimer) clearTimeout(retryTimer);
  if (intervalTimer) clearInterval(intervalTimer);
  if (processSub) processSub.kill();
}
if (require.main === module) {
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  log('app-catalog watcher started in no-UI mode');
  subscribeApps();
  intervalTimer = setInterval(runSync, 10 * 60 * 1000);
}
module.exports = {shouldRedirect:shouldRedirect};
