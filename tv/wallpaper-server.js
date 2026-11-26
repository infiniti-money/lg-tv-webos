#!/usr/bin/env node
/*
 * Infiniti TV Home - runs ON the rooted TV.
 * A small web page for changing the wallpaper from a phone: the launcher's Wallpaper button shows a
 * QR code, the phone opens this page, picks a photo (from the phone or from a USB stick in the TV),
 * and the photo becomes the wallpaper. The phone crops and shrinks the photo to 1920x1080 first.
 * The same page sets the weather city (looked up on Open-Meteo, no API key).
 *
 * Every page and action needs the key in the QR code (kept in DATA/.wallpaper-key), so other people
 * on the same Wi-Fi cannot change it. The launcher cannot make HTTP calls to the TV itself on webOS 6,
 * so the address goes into a file it loads (wall.js), and after a change the server relaunches it
 * with {reload: true}.
 * Plain ES5: the TV runs Node 8.
 */
'use strict';
var http = require('http');
var fs = require('fs');
var os = require('os');
var path = require('path');
var crypto = require('crypto');
var parseUrl = require('url').parse;
var execFile = require('child_process').execFile;

var PORT = 8090;
var DATA = '/home/root/lg-tv-vibehack';
var APP_DIR = require('./sync.js').findLauncherDir();
var legacyLuna = require('./legacy-luna.js').luna;
var managed = process.argv.indexOf('--legacy-managed')!==-1;
function permitted(){return !fs.existsSync('/var/luna/preferences/webosbrew_failsafe') && (managed ? fs.existsSync(path.join(DATA,'legacy-v8-wallpaper')) : fs.existsSync(path.join(DATA,'boot-services-enabled')));}
if(!permitted())process.exit(1);
var WALLPAPER = path.join(DATA, 'wallpaper.jpg');
var SETTINGS = path.join(DATA, 'settings.json');
var USB_ROOT = '/tmp/usb';
var MAX_UPLOAD = 10 * 1024 * 1024;
var IMAGE_RE = /\.(jpe?g|png|webp)$/i;

function log(msg) { console.log(new Date().toISOString() + ' wallpaper: ' + msg); }

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}

function validKey(k){return typeof k==='string'&&/^[A-Za-z0-9_-]{8,64}$/.test(k);}
function keyMatches(a,b){if(!validKey(a)||!validKey(b))return false;var x=crypto.createHash('sha256').update(a).digest(),y=crypto.createHash('sha256').update(b).digest(),v=0;for(var i=0;i<x.length;i++)v|=x[i]^y[i];return v===0;}
function storeKey(k){var f=path.join(DATA,'.wallpaper-key'),tmp=f+'.new-'+process.pid;fs.writeFileSync(tmp,k,{mode:384});fs.chmodSync(tmp,384);fs.renameSync(tmp,f);}
function loadKey() {
  var f = path.join(DATA, '.wallpaper-key');
  try {
    var k = fs.readFileSync(f, 'utf8').trim();
    if (validKey(k)) return k;
  } catch (e) { /* first run */ }
  k = crypto.randomBytes(24).toString('hex');
  storeKey(k);
  return k;
}
var KEY = loadKey();
function refreshKey(){try{var k=fs.readFileSync(path.join(DATA,'.wallpaper-key'),'utf8').trim();if(!validKey(k))return false;if(k!==KEY){KEY=k;writeWallJs();}return true;}catch(e){return false;}}
var remote = require('./remote-settings.js').create(DATA,function(){return require('./sync.js').findLauncherDir();},permitted,log);
var album = require('./idle-album.js').create(DATA,function(){return require('./sync.js').findLauncherDir();},permitted,log);

function tvAddress() {
  var nets = os.networkInterfaces(), names = ['eth0', 'wlan0'].concat(Object.keys(nets));
  for (var i = 0; i < names.length; i++) {
    var list = nets[names[i]] || [];
    for (var j = 0; j < list.length; j++) {
      if (list[j].family === 'IPv4' && !list[j].internal) return list[j].address;
    }
  }
  return '';
}

/** Tells the launcher where this page is (for the QR code). */
var wallHeartbeat=0, wallLastUrl='';
function writeWallJs() {
  APP_DIR = require('./sync.js').findLauncherDir();
  var ip = tvAddress();
  var url = permitted() && ip ? 'http://' + ip + ':' + PORT + '/?k=' + KEY : '';
  var now=Date.now();
  try {
    var file=path.join(APP_DIR,'wall.js');
    if(url===wallLastUrl && now-wallHeartbeat<30000 && fs.existsSync(file))return;
    var value='// Written by wallpaper-server.js\nwindow.WALL_URL = '+JSON.stringify(url)+';\nwindow.WALL_EXPIRES = '+(url?now+90000:0)+';\n';
    fs.writeFileSync(file+'.tmp',value,{mode:420});
    fs.renameSync(file+'.tmp',file);
    wallHeartbeat=now;wallLastUrl=url;
  } catch (e) { log('cannot write wall.js: ' + e.message); }
}

/** Rewrites the launcher's files, then reloads the launcher so the new wallpaper shows. */
function sync(cb) {
  execFile('/usr/bin/node', [path.join(DATA,'sync.js'),'--settings-only'],{timeout:10000},function(err){
    if(err){log('sync failed: '+err.message);return cb(err);}
    writeWallJs();
    if(!permitted())return cb(new Error('service disabled'));
    legacyLuna('luna://com.webos.applicationManager/getForegroundAppInfo',{},function(e,r){
      var foreground=!e && r && r.appId;
      if(foreground === 'com.infinitimoney.tvhome' && permitted()){
        return legacyLuna('luna://com.webos.applicationManager/launch',{id:foreground,params:{reload:true}},function(err){if(err)log('wallpaper saved; foreground refresh not confirmed: '+err.message);cb(null,!err);},null,3000);
      }
      cb(null,false);
    },null,1500);
  });
}

function saveSettings(change, res) {
  var st = readJSON(SETTINGS, {});
  change(st);
  fs.writeFileSync(SETTINGS, JSON.stringify(st, null, 1));
  sync(function (err, refreshed) { json(res, err ? 500 : 200, { ok: !err, reloadRequested: !!refreshed }); });
}

/** City search on Open-Meteo. curl, because Node 8's certificates are too old for some sites. */
function findCity(q, lang, cb) {
  var url = 'https://geocoding-api.open-meteo.com/v1/search?count=6&format=json&language=' + lang +
    '&name=' + encodeURIComponent(q);
  execFile('curl', ['-fsSL', '--max-time', '15', url], { timeout: 20000 }, function (err, out) {
    if (err) return cb(err);
    var list;
    try { list = JSON.parse(out).results || []; } catch (e) { return cb(e); }
    cb(null, list.map(function (r) {
      // Open-Meteo spells some Vietnamese names with the Icelandic Ð.
      var fix = function (t) { return String(t || '').replace(/Ð/g, 'Đ').replace(/ð/g, 'đ'); };
      return { name: fix(r.name), region: fix(r.admin1), country: fix(r.country), latitude: r.latitude, longitude: r.longitude };
    }));
  });
}

function send(res, code, type, body, extra) {
  var h = { 'Content-Type': type, 'Cache-Control': 'no-store', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff' };
  for (var k in extra || {}) h[k] = extra[k];
  res.writeHead(code, h);
  res.end(body);
}
function json(res, code, obj, extra) { send(res, code, 'application/json', JSON.stringify(obj), extra); }

/** Images on USB sticks (webOS mounts them under /tmp/usb/sdX/sdX1). */
function usbImages() {
  var found = [];
  function walk(dir, depth) {
    if (depth > 5 || found.length >= 300) return;
    var names;
    try { names = fs.readdirSync(dir); } catch (e) { return; }
    names.sort().forEach(function (n) {
      if (n.charAt(0) === '.' || found.length >= 300) return;
      var p = path.join(dir, n), st;
      try { st = fs.statSync(p); } catch (e) { return; }
      if (st.isDirectory()) walk(p, depth + 1);
      else if (IMAGE_RE.test(n) && st.size > 0) found.push(p);
    });
  }
  walk(USB_ROOT, 0);
  return found;
}

function insideUsb(p) {
  try {
    var real = fs.realpathSync(p);
    return real.indexOf(USB_ROOT + '/') === 0 && IMAGE_RE.test(real) ? real : '';
  } catch (e) { return ''; }
}

function handle(req, res) {
  if(!permitted())return json(res,503,{error:'service disabled'});
  var u = parseUrl(req.url, true), q = u.query, route = req.method + ' ' + u.pathname;
  if(!refreshKey())return json(res,503,{error:'key unavailable'});
  var authenticated=keyMatches(q.k,KEY);
  if(remote.route(req,res,u,json,authenticated))return;
  if(!authenticated){
    if(route==='GET /')return send(res,q.k?403:200,'text/html; charset=utf-8',loginPage(!!q.k));
    return json(res,403,{error:'key'});
  }
  if(route==='POST /api/key'){
    var chunks=[],size=0,done=false;
    req.on('data',function(d){if(done)return;size+=d.length;if(size>512){done=true;chunks=[];json(res,413,{error:'too large'});return;}chunks.push(d);});
    req.on('end',function(){if(done)return;done=true;if(!permitted()||!refreshKey()||!keyMatches(q.k,KEY))return json(res,403,{error:'key'});
      try{var p=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!p||!validKey(p.key)||keyMatches(p.key,KEY))return json(res,400,{error:'invalid new key'});storeKey(p.key);KEY=p.key;writeWallJs();json(res,200,{ok:true});}catch(e){json(res,400,{error:'cannot change key'});}
    });return;
  }

  if(album.route(req,res,u,json,send))return;
  if (route === 'GET /') {
    return fs.readFile(path.join(DATA, 'wallpaper.html'), function (err, buf) {
      if (err) return send(res, 500, 'text/plain', 'wallpaper.html missing, run the installer again');
      send(res, 200, 'text/html; charset=utf-8', buf);
    });
  }

  if (route === 'GET /api/state') {
    var s = readJSON(SETTINGS, {}), w = s.weather || {};
    return json(res, 200, {
      language: s.language === 'vi' ? 'vi' : 'en',
      hasWallpaper: fs.existsSync(WALLPAPER),
      dim: typeof s.wallpaperDim === 'number' ? s.wallpaperDim : 0.35,
      weather: { enabled: !!(w.enabled && typeof w.latitude==='number' && typeof w.longitude==='number'), place: w.place || '' }
    });
  }

  if (route === 'GET /api/city') {
    var name = String(q.q || '').trim().slice(0, 80);
    if (!name) return json(res, 400, { error: 'empty' });
    var lang = readJSON(SETTINGS, {}).language === 'vi' ? 'vi' : 'en';
    return findCity(name, lang, function (err, list) {
      if (err) return json(res, 502, { error: 'lookup failed' });
      json(res, 200, { results: list });
    });
  }

  if (route === 'POST /api/weather') {
    if (q.off) {
      log('weather off');
      return saveSettings(function (st) { if (st.weather) st.weather.enabled = false; }, res);
    }
    var lat = parseFloat(q.lat), lon = parseFloat(q.lon), place = String(q.place || '').slice(0, 80);
    if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return json(res, 400, { error: 'bad place' });
    log('weather city: ' + place);
    return saveSettings(function (st) {
      var unit = st.weather && st.weather.unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
      st.weather = { enabled: true, latitude: lat, longitude: lon, place: place, unit: unit };
    }, res);
  }

  if (route === 'GET /current.jpg') {
    return fs.readFile(WALLPAPER, function (err, buf) {
      if (err) return send(res, 404, 'text/plain', 'none');
      send(res, 200, 'image/jpeg', buf);
    });
  }

  if (route === 'POST /api/upload') {
    var chunks = [], size = 0, tooBig = false;
    req.on('data', function (d) {
      if (tooBig) return;
      size += d.length;
      if (size > MAX_UPLOAD) { tooBig = true; chunks = []; json(res, 413, { error: 'too big' }); return; }
      chunks.push(d);
    });
    req.on('end', function () {
      if (tooBig) return;
      var buf = Buffer.concat(chunks);
      if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[buf.length-2]!==0xff || buf[buf.length-1]!==0xd9) return json(res, 400, { error: 'not a JPEG' });
      var tmp = WALLPAPER + '.part-' + process.pid;
      if(!permitted())return json(res,503,{error:'service disabled'});
      try {fs.writeFileSync(tmp,buf);fs.renameSync(tmp,WALLPAPER);} catch(e){return json(res,500,{error:'cannot save photo'});}
      log('new wallpaper, ' + Math.round(buf.length / 1024) + ' KB');
      sync(function (err, refreshed) { json(res, err ? 500 : 200, { ok: !err, reloadRequested: !!refreshed }); });
    });
    return;
  }

  if (route === 'POST /api/dim') {
    var v = parseFloat(q.v);
    if (!(v >= 0 && v <= 0.8)) return json(res, 400, { error: 'bad value' });
    return saveSettings(function (st) { st.wallpaperDim = Math.round(v * 100) / 100; }, res);
  }

  if (route === 'POST /api/clear') {
    try { fs.unlinkSync(WALLPAPER); } catch (e) { /* already gone */ }
    log('wallpaper removed');
    return sync(function (err, refreshed) { json(res, err ? 500 : 200, { ok: !err, reloadRequested: !!refreshed }); });
  }

  if (route === 'GET /api/usb') {
    return json(res, 200, { images: usbImages().map(function (p) { return p.slice(USB_ROOT.length + 1); }) });
  }

  if (route === 'GET /api/usb/img') {
    var real = insideUsb(path.join(USB_ROOT, String(q.p || '')));
    if (!real) return send(res, 404, 'text/plain', 'not found');
    var ext = path.extname(real).toLowerCase();
    res.writeHead(200, { 'Content-Type': ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg' });
    return fs.createReadStream(real).pipe(res);
  }

  send(res, 404, 'text/plain', 'not found');
}

function loginPage(bad) {
  return '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Designed by Tân Dev</title><style>body{font:17px system-ui,sans-serif;background:#101820;color:#eee;margin:0;padding:28px}main{max-width:420px;margin:8vh auto;padding:24px;border:1px solid #3b4b58;border-radius:16px}input,button{box-sizing:border-box;width:100%;padding:13px;margin:8px 0;border-radius:8px;font:inherit}input{color:#fff;background:#22303c;border:1px solid #546674}button{background:#d1e5f5;border:0;color:#14232f;font-weight:bold}p{line-height:1.5;color:#b8c9d7}</style><main><h1>Designed by Tân Dev</h1><p>Tùy chỉnh TV qua mạng nội bộ.</p>'+(bad?'<p role="alert">Khóa không đúng. Thử lại hoặc xem mã QR trên TV.</p>':'')+'<form method="get" action="/"><label for="k">Khóa riêng</label><input type="password" name="k" id="k" required minlength="8" maxlength="64" autocomplete="current-password" pattern="[A-Za-z0-9_\\-]{8,64}"><button>Đăng nhập</button></form><p>Chỉ dùng trên Wi-Fi riêng. Không mở cổng ra Internet.</p></main></html>';
}


http.createServer(function (req, res) {
  try { handle(req, res); } catch (e) { log('error: ' + e.message); try { json(res, 500, { error: 'server error' }); } catch (x) { /* sent */ } }
}).on('error', function (e) {
  log('cannot start: ' + e.message);
  process.exit(1);
}).listen(PORT, function () {
  writeWallJs();remote.publish();album.publish();
  // An app-only auto-update may replace wall.js. Restore the QR URL without
  // reopening the launcher or interacting with LG's Home on wake.
  setInterval(function () {
    if(!permitted()){try{writeWallJs();}catch(e){}process.exit(0);}
    try {if(refreshKey()){writeWallJs();remote.publish();album.publish();}} catch(e){log('wall.js refresh failed: '+e.message);}
  }, 5000);
  log('listening on port ' + PORT);
});
