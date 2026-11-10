#!/usr/bin/env node
/*
 * Infiniti TV Home - runs ON the rooted TV.
 * Reads the installed apps and HDMI inputs straight from webOS (no computer needed), copies their
 * icons into the launcher, and applies your personal settings and wallpaper.
 * Runs at every boot and after every install, so new or removed apps show up automatically.
 *
 *   node /home/root/lg-tv-vibehack/sync.js          # sync now
 *   node /home/root/lg-tv-vibehack/sync.js --list   # print app ids and titles
 */
'use strict';
var fs = require('fs');
var path = require('path');
var execFileSync = require('child_process').execFileSync;

var APP_ID = 'com.infinitimoney.tvhome';
var APP_DIR = '/media/developer/apps/usr/palm/applications/' + APP_ID;
var DATA = '/home/root/lg-tv-vibehack';

function luna(uri, payload) {
  var out = execFileSync('luna-send', ['-n', '1', uri, JSON.stringify(payload || {})],
    { encoding: 'utf8', timeout: 15000, maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(out.trim().split('\n').pop());
}

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}

function safeName(id) { return id.replace(/[^A-Za-z0-9._-]/g, '_') + '.png'; }

function isFile(p) { try { return !!p && fs.statSync(p).isFile(); } catch (e) { return false; } }

// fs.copyFileSync only exists from Node 8.5. webOS 4 TVs run Node 0.12, where calling it threw and
// every app was skipped, so the launcher ended up empty. Keep every TV script ES5 and Node 0.12 safe.
function copyFile(src, dest) { fs.writeFileSync(dest, fs.readFileSync(src)); }
function atomicWrite(file, content) {
  var temp = file + '.infiniti-' + process.pid + '.tmp';
  fs.writeFileSync(temp, content);
  fs.renameSync(temp, file);
}

// Sources for installed packages. System directories contain invisible LG
// services: only include system apps when they have a visible Luna launchpoint.
var APP_DIRS = [
  // Prefer user-installed overrides before any built-in package of the same ID.
  '/media/developer/apps/usr/palm/applications',
  '/media/cryptofs/apps/usr/palm/applications',
  '/usr/palm/applications',
  '/mnt/otycabi/usr/palm/applications',
  '/mnt/otncabi/usr/palm/applications'
];

function sleep(sec) { try { execFileSync('sleep', [String(sec)]); } catch (e) { /* no sleep binary */ } }

// For a minute or two after boot, webOS answers with an empty app list (seen on webOS 4.4), so ask
// again until it has one. Without this, every boot overwrote apps.js with nothing.
function fromLuna(diskAvailable) {
  var tries = parseInt(process.env.SYNC_TRIES || '', 10) || (diskAvailable ? 3 : 12);
  for (var i = 0; i < tries; i++) {
    var res = null;
    try {
      res = luna('luna://com.webos.applicationManager/listLaunchPoints');
    } catch (e) {
      console.error('listLaunchPoints failed: ' + e.message);
    }
    if (res && res.launchPoints && res.launchPoints.length) {
      if (i) console.error('App list ready after ' + (i * 5) + 's.');
      return res.launchPoints;
    }
    if (!i) console.error('App list not ready yet: ' + JSON.stringify(res).slice(0, 200));
    if (i < tries - 1) sleep(5);
  }
  console.error('listLaunchPoints still empty after ' + (tries * 5) + 's.');
  return [];
}

/** Builds launch points by reading every appinfo.json on disk. */
function fromDisk() {
  var seen = {}, out = [];
  APP_DIRS.forEach(function (dir) {
    var names;
    try { names = fs.readdirSync(dir); } catch (e) { return; }
    names.forEach(function (n) {
      var base = path.join(dir, n);
      var info = readJSON(path.join(base, 'appinfo.json'), null);
      if (!info || !info.id || seen[info.id]) return;
      seen[info.id] = true;
      out.push({
        id: info.id,
        title: info.title || info.id,
        icon: info.icon ? path.join(base, info.icon) : '',
        largeIcon: info.largeIcon ? path.join(base, info.largeIcon) : '',
        iconColor: info.iconColor || info.bgColor || '',
        // Private metadata is stripped before writing launcher apps.js.
        _sourceDir: dir,
        _hasMain: !!info.main || !!info.executable,
        _hasTitle: !!info.title,
        _hidden: info.visible === false || info.hidden === true ||
          info.noWindow === true || info.noDisplay === true,
        _service: info.type === 'service' || info.type === 'jsservice'
      });
    });
  });
  return out;
}

/**
 * Only show apps that a TV user can actually launch.
 * Luna launchpoints are the authoritative list for LG system applications.
 * Developer/cryptofs packages provide fallback for third-party installed apps
 * that older firmware omits from listLaunchPoints. Never expose internal system
 * packages simply because their appinfo.json is present.
 */
function isUserFacing(p, fromLuna) {
  if (!p || typeof p.id !== 'string' || !p.id || p.id.length > 240) return false;
  if (p.id === APP_ID || p.id === 'com.webos.app.home') return false;
  if (/(^|[.])service([.]|$)/i.test(p.id) || /(^|[.])daemon([.]|$)/i.test(p.id)) return false;
  if (p.hidden === true || p.visible === false || p._hidden === true || p._service === true) return false;
  if (fromLuna) return true; // Luna is the actual on-screen app catalog.
  if (p._sourceDir !== '/media/developer/apps/usr/palm/applications' &&
      p._sourceDir !== '/media/cryptofs/apps/usr/palm/applications') return false;
  // An installed user app needs an entry point, human-readable title and icon.
  // An IPK without those is likely a service/companion, not an app tile.
  return p._hasMain === true && p._hasTitle === true &&
    !!(p.icon || p.largeIcon);
}
function mergePoints(lunaPoints, diskPoints) {
  var map = {}, order = [], visible = {}, suppressed = {};
  // Honor explicit Luna hide flags before considering the fallback appinfo.
  (lunaPoints || []).forEach(function (p) {
    if (p && p.id && (p.hidden === true || p.visible === false))
      suppressed[p.id] = true;
  });
  (lunaPoints || []).forEach(function (p) {
    if (!isUserFacing(p, true) || Object.prototype.hasOwnProperty.call(visible,p.id)) return;
    visible[p.id] = true;
    map[p.id] = p;
    order.push(p.id);
  });
  (diskPoints || []).forEach(function (p) {
    if (!p || !p.id || suppressed[p.id]) return;
    // Don't re-enable apps Luna explicitly marks hidden.
    if (Object.prototype.hasOwnProperty.call(visible,p.id)) {
      if (p._hidden || p._service) return;
      var current = map[p.id], copy = {}, key;
      for (key in current) if (Object.prototype.hasOwnProperty.call(current,key)) copy[key] = current[key];
      // Preserve readable disk icons when Luna supplies icon://, URLs or empty data.
      if (isFile(p.largeIcon)) copy.largeIcon = p.largeIcon;
      if (isFile(p.icon)) copy.icon = p.icon;
      map[p.id] = copy;
    } else if (isUserFacing(p,false)) {
      visible[p.id] = true;
      map[p.id] = p;
      order.push(p.id);
    }
  });
  return order.map(function (id) { return map[id]; });
}
function findLauncherDir() {
  var preferred = [
    '/media/developer/apps/usr/palm/applications/' + APP_ID,
    '/media/cryptofs/apps/usr/palm/applications/' + APP_ID,
    '/usr/palm/applications/' + APP_ID
  ];
  for (var i = 0; i < preferred.length; i++) {
    try { if (fs.statSync(preferred[i]).isDirectory()) return preferred[i]; } catch (e) {}
  }
  return preferred[0];
}
function listPoints() {
  var diskPoints = fromDisk(), lunaPoints = fromLuna(diskPoints.length > 0);
  var merged = mergePoints(lunaPoints, diskPoints);
  console.error('App discovery: Luna ' + lunaPoints.length + ', installed packages ' +
    diskPoints.length + ', user-facing apps ' + merged.length + '.');
  return { points: merged, source: 'Luna+disk' };
}

function main() {
  APP_DIR = findLauncherDir();
  var found = listPoints(), points = found.points;

  if (process.argv.indexOf('--list') !== -1) {
    points.forEach(function (p) { console.log((p.id + '                                             ').slice(0, 45) + ' ' + p.title); });
    return;
  }

  if (!fs.existsSync(APP_DIR)) {
    console.error('Launcher is not installed (' + APP_DIR + ' missing).');
    process.exit(1);
  }

  // Inputs: ask webOS, fall back to the four standard HDMI ports.
  var inputs = [];
  try {
    var devs = luna('luna://com.webos.service.eim/getAllInputStatus').devices || [];
    devs.forEach(function (d) { if (d.appId) inputs.push({ appId: d.appId, label: d.label || d.id }); });
  } catch (e) { /* older/newer firmware: use the fallback */ }
  if (!inputs.length) {
    [1, 2, 3, 4].forEach(function (n) { inputs.push({ appId: 'com.webos.app.hdmi' + n, label: 'HDMI ' + n }); });
  }

  // Apps and icons. Your own icons in DATA/icons/<app id>.png win over the TV's.
  var iconDir = path.join(APP_DIR, 'icons');
  if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir);
  var apps = [];
  points.forEach(function (p) {
    if (!p || !p.id || p.hidden) return;
    var name = safeName(p.id);
    var custom = path.join(DATA, 'icons', name);
    var src = isFile(custom) ? custom : (isFile(p.largeIcon) ? p.largeIcon : p.icon);
    // Preserve launchable apps even if their original icon is missing.
    if (!isFile(src)) src = path.join(APP_DIR, 'icon.png');
    if (!isFile(src)) return;
    try { copyFile(src, path.join(iconDir, name)); } catch (e) { return; }
    apps.push({ id: p.id, title: String(p.title || p.id), icon: 'icons/' + name, iconColor: p.iconColor || p.bgColor || '' });
  });
  // An empty list would leave an empty launcher on screen, so keep whatever is already there.
  if (!apps.length) {
    console.error('No apps found (node ' + process.version + ', ' + points.length + ' launch points).');
    console.error('Tried listLaunchPoints and ' + APP_DIRS.join(', ') + '.');
    console.error('The app list was left unchanged. Please report this with your TV model and');
    console.error('webOS version: https://github.com/infiniti-money/lg-tv-webos/issues');
    process.exit(1);
  }

  atomicWrite(path.join(APP_DIR, 'apps.js'),
    '// Generated on the TV by sync.js\nwindow.TV_APPS = ' + JSON.stringify({ apps: apps, inputs: inputs }, null, 1) + ';\n');

  // Personal settings and wallpaper. The copy is named after the photo's timestamp so a new photo
  // gets a new file name and the launcher never shows a cached old one.
  var settings = readJSON(path.join(DATA, 'settings.json'), {});
  var wp = path.join(DATA, 'wallpaper.jpg');
  var bgName = isFile(wp) ? 'bg-' + Math.floor(fs.statSync(wp).mtime.getTime() / 1000) + '.jpg' : '';
  fs.readdirSync(APP_DIR).forEach(function (f) {
    if (/^bg(-\d+)?\.jpg$/.test(f) && f !== bgName) fs.unlinkSync(path.join(APP_DIR, f));
  });
  if (bgName && !isFile(path.join(APP_DIR, bgName))) copyFile(wp, path.join(APP_DIR, bgName));
  settings.wallpaper = bgName;
  atomicWrite(path.join(APP_DIR, 'user.js'),
    '// Generated on the TV by sync.js from ' + DATA + '/settings.json\n' +
    '(function () { var u = ' + JSON.stringify(settings) + '; for (var k in u) window.CONFIG[k] = u[k]; })();\n');

  console.log('Synced ' + apps.length + ' apps (from ' + found.source + ') and ' + inputs.length + ' inputs.');
}

if (require.main === module) main();
module.exports = {mergePoints:mergePoints, listPoints:listPoints, findLauncherDir:findLauncherDir};
