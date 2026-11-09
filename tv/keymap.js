#!/usr/bin/env node
/* Crash-safe, reversible LG Input Hook key mapping, compatible with Node 0.12. */
'use strict';
var fs = require('fs');
function fail(msg) { console.error(msg); process.exit(1); }
function own(x, app, cmd) {
  return !!x && typeof x === 'object' &&
    ((x.action === 'launch' && x.id === app) || (x.action === 'exec' && x.command === cmd));
}
function read(path, emptyAllowed) {
  if (!fs.existsSync(path)) {
    if (emptyAllowed) return {};
    fail('Missing required backup or configuration: ' + path);
  }
  var x;
  try { x = JSON.parse(fs.readFileSync(path, 'utf8')); }
  catch (e) { fail('Invalid JSON; refusing to overwrite ' + path + ': ' + e.message); }
  if (!x || typeof x !== 'object' || Array.isArray(x)) fail('Invalid JSON object in ' + path);
  return x;
}
function write(path, obj) {
  var temp = path + '.infiniti-' + process.pid + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(obj, null, 2) + '\n', {mode: 384});
  try { fs.renameSync(temp, path); }
  catch (e) { try { fs.unlinkSync(temp); } catch (ignored) {} throw e; }
}
function main() {
  var action = process.argv[2], cfg = process.argv[3], backup = process.argv[4],
    key = process.argv[5], app = process.argv[6], cmd = process.argv[7];
  if (!cfg || !backup || !key || !app || !cmd) fail('Usage: keymap.js enable|disable CONFIG BACKUP KEY APP_ID LEGACY_COMMAND');
  if (action !== 'enable' && action !== 'disable') fail('Unknown operation: ' + action);
  var conf = read(cfg, action === 'enable'), saved = fs.existsSync(backup) ? read(backup, false) : null;
  var has = Object.prototype.hasOwnProperty.call(conf, key);
  var current = has ? conf[key] : null;
  if (saved && typeof saved.present !== 'boolean') fail('Invalid Home key backup (present flag)');
  if (action === 'enable') {
    if (saved) {
      if (!own(current, app, cmd)) fail('Home mapping changed externally; refusing to overwrite it');
      console.log('Home mapping already active and safely backed up');
      return;
    }
    if (own(current, app, cmd)) fail('Our mapping already exists but no original backup; manual recovery required');
    if (saved === null) {
      write(backup, {present: has, binding: has ? current : null});
    }
    conf[key] = {action: 'launch', id: app};
    write(cfg, conf);
    console.log('Home mapping installed (previous binding backed up)');
  } else {
    if (!saved) {
      if (own(current, app, cmd)) fail('Our Home mapping exists without backup; refusing unsafe restore');
      console.log('No managed Home mapping to restore');
      return;
    }
    if (!own(current, app, cmd)) fail('Home mapping changed externally; leaving it and backup intact');
    if (saved.present) conf[key] = saved.binding;
    else delete conf[key];
    write(cfg, conf);
    fs.unlinkSync(backup);
    console.log('Previous Home key mapping restored');
  }
}
if (require.main === module) main();
module.exports = {own: own};
