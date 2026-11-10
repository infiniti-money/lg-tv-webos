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
// A backup may survive a crash before the new Home mapping is written.
// Recover only if the binding is still exactly the original saved state.
function originalUnchanged(conf, key, saved) {
  var present = Object.prototype.hasOwnProperty.call(conf, key);
  return present === saved.present &&
    (!present || JSON.stringify(conf[key]) === JSON.stringify(saved.binding));
}
function main() {
  var action = process.argv[2], cfg = process.argv[3], backup = process.argv[4],
    key = process.argv[5], app = process.argv[6], cmd = process.argv[7];
  if (!cfg || !backup || !key || !app || !cmd)
    fail('Usage: keymap.js status|enable|disable|rebind CONFIG BACKUP KEY APP_ID COMMAND [--confirm-rebind]');
  if (action !== 'status' && action !== 'enable' && action !== 'disable' && action !== 'rebind')
    fail('Unknown operation: ' + action);
  if (action === 'rebind' && process.argv[8] !== '--confirm-rebind')
    fail('Rebind overwrites an external Home mapping; explicit --confirm-rebind is required');
  var saved = fs.existsSync(backup) ? read(backup, false) : null;
  var conf = read(cfg, action === 'status' || action === 'enable' || action === 'rebind' || (action === 'disable' && saved && !saved.present));
  var has = Object.prototype.hasOwnProperty.call(conf, key);
  var current = has ? conf[key] : null;
  if (saved && typeof saved.present !== 'boolean') fail('Invalid Home key backup (present flag)');
  if (saved && saved.present && !Object.prototype.hasOwnProperty.call(saved, 'binding')) fail('Invalid Home key backup (missing binding)');
  if (action === 'status') {
    console.log('Home key ' + key + ': ' +
      (own(current, app, cmd) ? 'INFINITI ACTIVE' :
       saved ? 'EXTERNAL CONFLICT (use explicit rebind to recover)' :
       has ? 'EXTERNAL MAPPING' : 'UNMAPPED'));
    return;
  }
  if (action === 'rebind') {
    // Recovery is an EXPLICIT root command, never run automatically by install.sh.
    // Preserve the current external Home key and any older backup before rebinding.
    if (own(current, app, cmd)) {
      if (!saved) fail('Infiniti mapping has no original backup; refusing to invent a rollback target');
      console.log('Infiniti Home key mapping already active with recovery backup');
      return;
    }
    var archive = backup + '.conflict-' + Date.now() + '-' + process.pid + '.json';
    write(archive, {
      key: key,
      current: {present:has, binding:current},
      previousBackup: saved
    });
    // The most recent working mapping is the new rollback target.
    write(backup, {present:has, binding:current});
    conf[key] = {action:'exec', command:cmd};
    write(cfg,conf);
    console.log('Home key rebound to Infiniti TV Home, prior mapping preserved in ' + archive);
    return;
  }
  if (action === 'enable') {
    if (saved) {
      if (own(current, app, cmd)) {
        if (current.action === 'exec') {
          console.log('Home mapping already active and safely backed up');
          return;
        }
        // Upgrade the old Launch App mapping to Execute, without replacing
        // the original user's backup or touching unrelated keybinds.
        console.log('Upgrading old Home Launch App mapping to compatible Execute');
      } else {
        if (!originalUnchanged(conf, key, saved))
          fail('Home mapping changed externally; refusing to overwrite it');
        console.log('Recovering interrupted Home mapping activation');
      }
    } else {
      if (own(current, app, cmd)) fail('Our mapping already exists but no original backup; manual recovery required');
      write(backup, {present: has, binding: has ? current : null});
    }
    // Input Hook 1.4 supports Execute on rooted LG TVs; Launch App is not
    // available on every version. Keep the old 'launch' mapping recognizable.
    conf[key] = {action: 'exec', command: cmd};
    write(cfg, conf);
    console.log('Home key executes the safe Infiniti TV Home launcher (previous binding backed up)');
  } else {
    if (!saved) {
      if (own(current, app, cmd)) fail('Our Home mapping exists without backup; refusing unsafe restore');
      console.log('No managed Home mapping to restore');
      return;
    }
    if (originalUnchanged(conf, key, saved)) {
      fs.unlinkSync(backup);
      console.log('Home mapping was not changed; interrupted backup cleared');
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
