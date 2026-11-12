#!/usr/bin/env node
// Conservative static compatibility gate for webOS TV 3.x:
// Chromium 38 in web apps, and Node.js 0.12.2 in TV-side scripts.
// This does not replace emulator or hardware tests.
'use strict';
var fs = require('fs');
var paths = [
  'app/app.js', 'app/extras.js', 'app/lifecycle.js', 'app/config.js', 'app/assistant.js', 'app/customize.js', 'app/lunar.js', 'app/forecast.js', 'app/qrcode.js',
  'tv/sync.js', 'tv/homewatch.js', 'tv/wallpaper-server.js',
  'tv/diag.js'
];
var issues = [];
paths.forEach(function (p) {
  var content = fs.readFileSync(p, 'utf8');
  var lines = content.split(/\r?\n/);
  lines.forEach(function (line, i) {
    var s = line.trim();
    if (/^(\/\/|\*|\/\*|#)/.test(s)) return;
    if (/\b(?:const|let|class|async|await)\s+\w|=>|\?\.|\bObject\.assign\s*\(|\bArray\.from\s*\(|\.includes\s*\(|\.startsWith\s*\(|\.endsWith\s*\(|\.padStart\s*\(|\.flat\s*\(/.test(s)) {
      issues.push(p + ':' + (i + 1) + ': modern syntax/API: ' + s.slice(0, 100));
    }
  });
});
var css = fs.readFileSync('app/style.css', 'utf8');
if (/\bvar\s*\(--/.test(css)) issues.push('app/style.css: unsupported CSS variables');
var metadata = JSON.parse(fs.readFileSync('app/appinfo.json', 'utf8'));
if (metadata.id !== 'com.infinitimoney.tvhome') issues.push('Unexpected app ID');
if (metadata.main !== 'index.html') issues.push('Unexpected entrypoint');
if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}
console.log('Static legacy compatibility checks passed (Chromium 38 / Node 0.12 target).');
