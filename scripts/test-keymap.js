#!/usr/bin/env node
'use strict';
var fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process'), assert = require('assert');
var temp = fs.mkdtempSync(path.join(os.tmpdir(), 'infiniti-home-'));
var cfg = path.join(temp, 'keybinds.json'), bak = path.join(temp, 'home-backup.json');
var app = 'com.infinitimoney.tvhome', cmd = '/home/root/lg-tv-vibehack/golauncher.sh';
var js = path.join(__dirname, '..', 'tv', 'keymap.js');
function call(action) {
  return cp.spawnSync(process.execPath, [js, action, cfg, bak, '773', app, cmd], {encoding: 'utf8'});
}
function load(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
try {
  fs.writeFileSync(cfg, JSON.stringify({'773': {action:'replace', keycode:1}, '42':{action:'ignore'}}));
  assert.strictEqual(call('enable').status, 0);
  assert.strictEqual(load(cfg)['773'].action, 'exec');
  assert.strictEqual(load(cfg)['773'].command, cmd);
  assert.strictEqual(load(cfg)['42'].action, 'ignore');
  assert.strictEqual(call('enable').status, 0, 'enable idempotence');
  assert.strictEqual(call('disable').status, 0);
  assert.strictEqual(load(cfg)['773'].keycode, 1);
  assert.strictEqual(load(cfg)['42'].action, 'ignore');
  assert.strictEqual(fs.existsSync(bak), false);
  assert.strictEqual(call('disable').status, 0, 'disable idempotence');
  fs.writeFileSync(cfg, '{bad');
  assert.notStrictEqual(call('enable').status, 0, 'reject corrupt JSON');
  fs.writeFileSync(cfg, JSON.stringify({'773':{action:'launch',id:app}}));
  assert.notStrictEqual(call('enable').status, 0, 'reject existing mapping without backup');
  fs.writeFileSync(cfg, '{}');
  assert.strictEqual(call('enable').status, 0);
  fs.writeFileSync(cfg, JSON.stringify({'773':{action:'launch',id:'another.app'}}));
  assert.notStrictEqual(call('disable').status, 0, 'no overwrite on external edit');
  assert.strictEqual(fs.existsSync(bak), true, 'backup must survive conflict');
  // Existing 1.5.0 installations mapped launch App ID; migrate to Execute
  // while keeping the saved original binding intact.
  var oldHome = {action:'replace', keycode:7};
  fs.writeFileSync(cfg, JSON.stringify({'773':{action:'launch',id:app}, '42':{action:'ignore'}}));
  fs.writeFileSync(bak, JSON.stringify({present:true,binding:oldHome}));
  assert.strictEqual(call('enable').status, 0, 'upgrade backed-up Launch App mapping to Execute');
  assert.strictEqual(load(cfg)['773'].action, 'exec');
  assert.strictEqual(load(cfg)['773'].command, cmd);
  assert.strictEqual(call('disable').status, 0, 'restore original key after upgrade');
  assert.strictEqual(load(cfg)['773'].keycode, 7);
  assert.strictEqual(load(cfg)['42'].action, 'ignore');

  // A crash after writing the backup but before changing keybinds must be recoverable.
  var original = {action:'replace', keycode:7};
  fs.writeFileSync(cfg, JSON.stringify({'773':original, '42':{action:'ignore'}}));
  fs.writeFileSync(bak, JSON.stringify({present:true, binding:original}));
  assert.strictEqual(call('enable').status, 0, 'recover interrupted enable with prior Home key');
  assert.strictEqual(load(cfg)['773'].action, 'exec');
  assert.strictEqual(load(cfg)['773'].command, cmd);
  assert.strictEqual(call('disable').status, 0, 'restores original after recovered enable');
  assert.strictEqual(load(cfg)['773'].keycode, 7);
  assert.strictEqual(fs.existsSync(bak), false);

  // If disabling while a backup is pending, do not change the original binding.
  fs.writeFileSync(bak, JSON.stringify({present:true, binding:original}));
  assert.strictEqual(call('disable').status, 0, 'discard incomplete backup');
  assert.strictEqual(load(cfg)['773'].keycode, 7);
  assert.strictEqual(fs.existsSync(bak), false);

  // The original Home key may have been absent; an interrupted transaction is safe to resume.
  fs.writeFileSync(cfg, JSON.stringify({'42':{action:'ignore'}}));
  fs.writeFileSync(bak, JSON.stringify({present:false, binding:null}));
  assert.strictEqual(call('enable').status, 0, 'recover when original Home key did not exist');
  assert.strictEqual(load(cfg)['773'].action, 'exec');
  assert.strictEqual(load(cfg)['773'].command, cmd);
  assert.strictEqual(call('disable').status, 0);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(load(cfg), '773'), false);
  assert.strictEqual(fs.existsSync(bak), false);

  // Disable must be able to clear a pending backup even when there was no config file.
  fs.unlinkSync(cfg);
  fs.writeFileSync(bak, JSON.stringify({present:false, binding:null}));
  assert.strictEqual(call('disable').status, 0, 'recover missing config with empty previous mapping');
  assert.strictEqual(fs.existsSync(bak), false);
  assert.strictEqual(fs.existsSync(cfg), false);

  // A third-party edit is never overwritten, even with a valid pending backup.
  fs.writeFileSync(cfg, JSON.stringify({'773':{action:'launch', id:'other.tv.app'}}));
  fs.writeFileSync(bak, JSON.stringify({present:true, binding:original}));
  assert.notStrictEqual(call('enable').status, 0, 'reject external Home edit during recovery');
  assert.strictEqual(load(cfg)['773'].id, 'other.tv.app');
  assert.strictEqual(fs.existsSync(bak), true);
  assert.notStrictEqual(call('disable').status, 0, 'reject external Home edit during rollback');
  assert.strictEqual(load(cfg)['773'].id, 'other.tv.app');
  assert.strictEqual(fs.existsSync(bak), true);

  // Malformed backup must not be used to overwrite the binding.
  fs.writeFileSync(bak, JSON.stringify({present:true}));
  assert.notStrictEqual(call('enable').status, 0, 'reject malformed backup');
  assert.strictEqual(load(cfg)['773'].id, 'other.tv.app');

  console.log('Key mapping rollback tests passed.');
} finally {
  fs.readdirSync(temp).forEach(function (name) { fs.unlinkSync(path.join(temp, name)); });
  fs.rmdirSync(temp);
}
