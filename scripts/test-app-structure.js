#!/usr/bin/env node
'use strict';
var fs = require('fs'), path = require('path'), assert = require('assert');
var html = fs.readFileSync('app/index.html', 'utf8');
var appInfo = JSON.parse(fs.readFileSync('app/appinfo.json','utf8'));
assert.strictEqual(appInfo.id, 'com.infinitimoney.tvhome');
assert.strictEqual(appInfo.main, 'index.html');
assert.ok(/^1\.4\./.test(appInfo.version), 'new feature version must be 1.4.x');
var ids = {}, matches = html.match(/id="[^"]+"/g) || [];
matches.forEach(function (entry) {
  var id = entry.slice(4, -1);
  assert.ok(!ids[id], 'duplicate HTML id: ' + id);
  ids[id] = true;
});
['customizePanel','customizeAppList','customizeThemes','customizeFonts',
 'customizeWeatherCity','weekWeather','lunarDate','btnCustomize','aiPanel'].forEach(function (id) {
  assert.ok(ids[id], 'missing widget: ' + id);
});
var scripts = [], re = /<script src="([^"]+)"/g, m;
while ((m = re.exec(html))) scripts.push(m[1]);
['config.js','customize.js','app.js','forecast.js','extras.js','lunar.js','assistant.js'].forEach(function (file) {
  assert.ok(scripts.indexOf(file) !== -1, 'missing script include: ' + file);
});
scripts.forEach(function (file) {
  assert.ok(/^[a-zA-Z0-9._-]+\.js$/.test(file), 'unsafe script filename: ' + file);
  assert.ok(fs.existsSync(path.join('app',file)), 'missing packaged script: ' + file);
});
assert.ok(scripts.indexOf('customize.js') < scripts.indexOf('app.js'));
assert.ok(scripts.indexOf('forecast.js') < scripts.indexOf('extras.js'));
assert.ok(fs.existsSync('app/fonts/lexend.ttf'), 'Vietnamese Lexend font missing');
console.log('webOS launcher asset and DOM structure tests passed (' + scripts.length + ' scripts).');
