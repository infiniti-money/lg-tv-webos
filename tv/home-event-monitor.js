#!/usr/bin/env node
/*
 * Optional, non-exclusive physical HOME-button fallback for rooted webOS 3.x.
 *
 * Reads EV_KEY from a user-verified Linux event device (for example event3).
 * Launches Infiniti after Home keydown (0x0305 = 773). This DOES NOT intercept
 * or suppress the original LG Home ribbon. LG Input Hook is still required
 * to replace Home without a possible LG Home flash.
 *
 * Compatible with old Node.js (ES5, Node 0.12). No uinput, EVIOCGRAB, or writes
 * to Linux input devices. Never logs other keys.
 */
'use strict';
var fs = require('fs');
var cp = require('child_process');
var DATA = '/home/root/lg-tv-vibehack';
var ENABLE_FILE = DATA + '/home-enabled';
var CMD = DATA + '/golauncher.sh';
var LOG = '/tmp/infiniti-homeevent.log';
var DEFAULT_DEVICE = '/dev/input/event3';
var EV_KEY = 1, HOME = 773, KEY_DOWN = 1;
var DEBOUNCE_MS = 1800;
var lastHome = 0, busy = false;
var EVENT_BYTES = (process.arch === 'x64' || process.arch === 'arm64') ? 24 : 16;

function log(message) {
  try { fs.appendFileSync(LOG, new Date().toISOString() + ' ' + message + '\n'); } catch (e) {}
}
function validDevice(path) { return /^\/dev\/input\/event[0-9]+$/.test(path || ''); }
function decode(buffer) {
  if (!buffer || (buffer.length !== 16 && buffer.length !== 24)) return null;
  var offset = buffer.length - 8;
  return {
    type: buffer.readUInt16LE(offset),
    code: buffer.readUInt16LE(offset + 2),
    value: buffer.readInt32LE(offset + 4)
  };
}
function isHomeDown(event) {
  return !!event && event.type === EV_KEY && event.code === HOME &&
    event.value === KEY_DOWN;
}
function onEvent(ev, now, callback) {
  if (!isHomeDown(ev) || now - lastHome < DEBOUNCE_MS || busy) return false;
  if (!fs.existsSync(ENABLE_FILE)) return false;
  lastHome = now;
  busy = true;
  log('physical Home keydown 773; requesting Infiniti TV Home');
  cp.execFile('/bin/sh', [CMD], {timeout: 10000}, function(err) {
    busy = false;
    log(err ? 'launcher command failed: ' + err.message : 'launcher command finished');
    if (callback) callback(err);
  });
  return true;
}
function run(device) {
  if (!validDevice(device)) {
    console.error('Invalid input device; expected /dev/input/eventN');
    process.exit(2);
  }
  if (!fs.existsSync(ENABLE_FILE)) {
    console.error('Home replacement disabled; monitor will not start.');
    process.exit(2);
  }
  var fd;
  try { fd = fs.openSync(device, 'r'); }
  catch (e) { console.error('Cannot open ' + device + ': ' + e.message); process.exit(1); }
  log('Started non-exclusive HOME monitor on ' + device + ', event size ' + EVENT_BYTES);
  var buffer = new Buffer(EVENT_BYTES);
  var got = 0;
  // Async read is essential. A synchronous infinite read loop would starve
  // execFile callbacks and permanently block further HOME launches.
  // No dd/od processes are created for other key events.
  function readNext() {
    fs.read(fd, buffer, got, EVENT_BYTES - got, null, function(err, n) {
      if (err || n <= 0) {
        log('Input device stream ended: ' + (err ? err.message : 'EOF'));
        try { fs.closeSync(fd); } catch (ignored) {}
        process.exit(1);
      }
      got += n;
      if (got === EVENT_BYTES) {
        got = 0;
        onEvent(decode(buffer), Date.now());
      }
      readNext();
    });
  }
  readNext();
}
if (require.main === module) {
  var device = process.argv[2] || DEFAULT_DEVICE;
  run(device);
}
module.exports = {decode:decode,isHomeDown:isHomeDown,validDevice:validDevice,
  onEvent:onEvent,EVENT_BYTES:EVENT_BYTES};
