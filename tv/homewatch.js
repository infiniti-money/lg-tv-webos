#!/usr/bin/env node
/* Infiniti TV Home - resilient Home watcher for rooted webOS 3.x (Node 0.12 / ES5).
 * Home redirects are rate-limited and only run when the user's enable flag exists.
 * An Input Hook foreground at initial boot is expected, not proof that Home was pressed.
 */
'use strict';
var fs = require('fs');
var cp = require('child_process');
var LAUNCHER = 'com.infinitimoney.tvhome';
var DATA = '/home/root/lg-tv-vibehack';
var ENABLE_FILE = DATA + '/home-enabled';
var SYNC = DATA + '/sync.js';
var BOOT_IDS = ['com.webos.app.livetv', 'org.webosbrew.hbchannel', 'org.webosbrew.inputhook'];
var HOME_IDS = ['com.webos.app.home'];
var BOOT_GRACE_MS = 90000;
// The initial non-Home foreground is only redirected during a real boot, not a service restart.
var bootMode = process.argv.indexOf('--boot') !== -1;
var readyAt = 0, lastLaunch = 0, shuttingDown = false;
var hits = [], syncing = false, syncAgain = false;
var fgProcess = null, appsProcess = null;

function log(s) { console.log(new Date().toISOString() + ' ' + s); }
function enabled() { return fs.existsSync(ENABLE_FILE); }
function shouldRedirect(id, isFirst, elapsed, duringBoot) {
  if (HOME_IDS.indexOf(id) !== -1) return true;
  return !!duringBoot && !!isFirst && elapsed <= BOOT_GRACE_MS &&
    BOOT_IDS.indexOf(id) !== -1;
}
function parseObject(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}
function launch() {
  if (!enabled() || shuttingDown) return;
  cp.execFile('luna-send',
    ['-n', '1', 'luna://com.webos.applicationManager/launch', JSON.stringify({id: LAUNCHER})],
    {timeout: 10000}, function (err, stdout) {
      if (err) { log('launcher call failed: ' + err.message); return; }
      var reply = parseObject(String(stdout || '').trim());
      if (reply && reply.returnValue === false) log('launcher rejected: ' + String(stdout).slice(0, 300));
    });
}
function handle(id, initial) {
  if (!enabled() || !id || id === LAUNCHER) return;
  var now = Date.now();
  if (!shouldRedirect(id, initial, now - readyAt, bootMode)) return;
  hits = hits.filter(function (t) { return now - t < 10000; });
  if (hits.length >= 5) { log('Home redirect rate limit reached; not fighting TV'); return; }
  if (now - lastLaunch < 1800) return;
  lastLaunch = now;
  hits.push(now);
  log('foreground ' + id + ' -> ' + LAUNCHER + (initial ? ' (boot)' : ''));
  setTimeout(launch, initial ? 700 : 100);
}
function onForeground(id) {
  if (!id) return;
  var initial = !readyAt;
  if (initial) {
    readyAt = Date.now();
    log('webOS ready, foreground: ' + id);
  }
  handle(id, initial);
  // The boot flag must never redirect another later foreground snapshot.
  if (initial) bootMode = false;
}
function consumeLines(proc, callback) {
  var buf = '';
  proc.stdout.on('data', function (chunk) {
    buf += String(chunk);
    if (buf.length > 512 * 1024) buf = buf.slice(-4096);
    var lines = buf.split(/\r?\n/);
    buf = lines.pop();
    lines.forEach(function (line) {
      var msg = parseObject(line.trim());
      if (msg) callback(msg);
    });
  });
  proc.stdout.on('end', function () {
    var msg = parseObject(buf.trim());
    if (msg) callback(msg);
  });
}
function subscribeForeground() {
  if (shuttingDown) return;
  var p;
  try { p = cp.spawn('luna-send', ['-i', 'luna://com.webos.applicationManager/getForegroundAppInfo', '{"subscribe":true}']); }
  catch (e) { log('foreground spawn failed: ' + e.message); setTimeout(subscribeForeground, 5000); return; }
  fgProcess = p;
  var completed = false;
  var firstTimeout = !readyAt ? setTimeout(function () { p.kill(); }, 9000) : null;
  consumeLines(p, function (msg) {
    if (msg.appId) {
      if (firstTimeout) { clearTimeout(firstTimeout); firstTimeout = null; }
      onForeground(msg.appId);
    }
  });
  p.on('error', function (e) { log('foreground subscribe error: ' + e.message); });
  p.on('close', function () {
    if (firstTimeout) clearTimeout(firstTimeout);
    if (fgProcess === p) fgProcess = null;
    if (completed || shuttingDown) return;
    completed = true;
    setTimeout(subscribeForeground, readyAt ? 3000 : 1500);
  });
}
// A polling fallback is needed on older firmware where a Luna subscription
// stays alive but never sends foreground changes after its first response.
var pollBusy = false;
function pollForeground() {
  if (!enabled() || shuttingDown || pollBusy) return;
  pollBusy = true;
  cp.execFile('luna-send',
    ['-n', '1', 'luna://com.webos.applicationManager/getForegroundAppInfo', '{}'],
    {timeout: 7000}, function (err, stdout) {
      pollBusy = false;
      if (err) return;
      var msg = parseObject(String(stdout || '').trim());
      if (msg && msg.appId) onForeground(msg.appId);
    });
}
function runSync() {
  if (syncing) { syncAgain = true; return; }
  syncing = true;
  cp.execFile('/usr/bin/node', [SYNC], {timeout: 180000}, function (err, out, stderr) {
    syncing = false;
    log('apps sync ' + (err ? 'failed: ' + String(stderr || err.message).trim().slice(0, 300) :
      'ok: ' + String(out || '').trim().slice(0, 300)));
    if (syncAgain) { syncAgain = false; runSync(); }
  });
}
function watchApps() {
  if (shuttingDown) return;
  var p;
  try { p = cp.spawn('luna-send', ['-i', 'luna://com.webos.applicationManager/listLaunchPoints', '{"subscribe":true}']); }
  catch (e) { log('app watcher spawn failed: ' + e.message); setTimeout(watchApps, 5000); return; }
  appsProcess = p;
  consumeLines(p, function (msg) {
    if (msg.launchPoints) return;
    if (msg.change === 'added' || msg.change === 'removed' || msg.change === 'updated') {
      log('apps ' + msg.change + ': ' + (msg.id || 'unknown'));
      runSync();
    }
  });
  p.on('error', function (e) { log('app subscription error: ' + e.message); });
  p.on('close', function () {
    if (appsProcess === p) appsProcess = null;
    if (!shuttingDown) setTimeout(watchApps, 5000);
  });
}
function shutdown() {
  shuttingDown = true;
  if (fgProcess) fgProcess.kill();
  if (appsProcess) appsProcess.kill();
  process.exit(0);
}
if (require.main === module) {
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  log('homewatch started');
  subscribeForeground();
  watchApps();
  setTimeout(pollForeground, 5000);
  setInterval(pollForeground, 12000);
  // Some LG firmware never emits app-add/remove events; a bounded periodic
  // discovery also finds packages that Input Hook itself does not list.
  setInterval(function () { if (!shuttingDown) runSync(); }, 10 * 60 * 1000);
}
module.exports = {shouldRedirect: shouldRedirect};
