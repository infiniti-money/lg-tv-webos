'use strict';
var fs=require('fs'),assert=require('assert');
var html=fs.readFileSync('app/index.html','utf8'),app=fs.readFileSync('app/app.js','utf8'),wall=fs.readFileSync('tv/wallpaper-server.js','utf8'),sync=fs.readFileSync('tv/sync.js','utf8'),sh=fs.readFileSync('tv/legacy-home.sh','utf8');
['btnAI','aiPanel','customizeAITab','customizeDevModeTab','customizeWeatherPresets'].forEach(function(id){assert.ok(html.indexOf('id="'+id+'"')<0,id+' removed');});
assert.ok(html.indexOf('assistant.js')<0);
assert.ok(app.indexOf('tiles.length!==items.length')>=0);
assert.ok(wall.indexOf('--settings-only')>=0 && wall.indexOf('legacyLuna(')>=0);
assert.ok(sync.indexOf('--settings-only')>=0);
assert.ok(sh.indexOf('wallpaper-on)')>=0);
console.log('V8.5 simplified UI, render completeness and wallpaper integration checks passed.');

assert.ok(app.indexOf('window.WALL_EXPIRES > Date.now()')>=0);
assert.ok(wall.indexOf('now+90000')>=0 && wall.indexOf('now-wallHeartbeat<30000')>=0);
assert.ok(wall.indexOf('reloadRequested: !!refreshed')>=0);
assert.ok(app.indexOf('c.width = 1; c.height = 1;')>=0);
console.log('Wallpaper heartbeat and bounded icon sampling regression checks passed (static).');
