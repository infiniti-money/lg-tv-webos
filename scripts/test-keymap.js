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
  assert.strictEqual(load(cfg)['773'].id, app);
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
  console.log('Key mapping rollback tests passed.');
} finally {
  fs.readdirSync(temp).forEach(function (name) { fs.unlinkSync(path.join(temp, name)); });
  fs.rmdirSync(temp);
}
