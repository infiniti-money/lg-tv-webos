#!/usr/bin/env node
'use strict';
// Guardrails for the Infiniti Money derivative. Original MIT credits remain intact.
// The historical on-TV "lg-tv-vibehack" data path must NOT be renamed: existing
// wallpaper, keymap backup, config and init.d installations depend on it.
var assert = require('assert');
var fs = require('fs');
function read(p) { return fs.readFileSync(p, 'utf8'); }
var meta = JSON.parse(read('app/appinfo.json'));
assert.strictEqual(meta.id, 'com.infinitimoney.tvhome');
assert.strictEqual(meta.title, 'Infiniti TV Home');
assert.strictEqual(meta.vendor, 'Infiniti Money');
assert.ok(/^1\.4\.\d+$/.test(meta.version), 'Expected v1.4.x release');
var en = read('README.md'), vi = read('README.vi.md'), notes = read('RELEASE.vi.md');
var watcher = read('home-watch.py');
var mac = read('home-watch-mac.sh');
var diag = read('tv/diag.js');
var license = read('LICENSE');

assert.ok(watcher.indexOf('LAUNCHER = "com.infinitimoney.tvhome"') !== -1,
  'No-root Home watcher must open the correct app');
assert.ok(mac.indexOf('LABEL=com.infinitimoney.tvhome.homewatch') !== -1,
  'Mac LaunchAgent must have the Infiniti identifier');
assert.ok(diag.indexOf('raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/tv/diag.js') !== -1,
  'Diagnostic downloader must belong to the Infiniti repo');

[en, vi, notes, diag].forEach(function (s) {
  assert.ok(s.indexOf('hoangvya19/lg-tv-webos-vibehack') === -1,
    'Stale upstream download, badge or release URL');
  assert.ok(s.indexOf('0x11a0cd4c3e0135d2af5dc0ad0d44bc535fe4645b') === -1,
    'Do not publish the old owner's cryptocurrency donation address');
});
[en, vi].forEach(function (s) {
  assert.ok(s.indexOf('https://github.com/infiniti-money/lg-tv-webos') !== -1,
    'Missing canonical project repository');
});
assert.ok(notes.indexOf('v' + meta.version) !== -1,
  'Release notes must match appinfo version');
assert.ok(!fs.existsSync('.github/FUNDING.yml'), 'Upstream sponsor link still present');
assert.ok(!fs.existsSync('docs/media/donate-usdt-bsc.gif'),
  'Old donation QR code still present');
assert.ok(license.indexOf('Copyright (c) 2026 Infiniti Money') !== -1,
  'Missing Infiniti derivative copyright notice');
['Gathin', 'OmkarK97', 'hoangvya19'].forEach(function (name) {
  assert.ok(license.indexOf(name) !== -1, 'Do not erase original MIT attribution: ' + name);
});
console.log('Infiniti TV Home branding, ownership links and attribution checks passed.');
