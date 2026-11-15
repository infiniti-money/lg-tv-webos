/* Infiniti Autostart companion: safe foreground handoff for legacy LG webOS 3.x.
 * This changes only the separate org.webosbrew.autostart application.
 * Homebrew Channel and its startup.sh remain untouched.
 * Upstream source: https://github.com/speed47/webosbrew-autostart (ISC).
 */
import 'core-js/stable';
import 'regenerator-runtime';
import 'webostvjs/webOSTV';

var handoff = require('./handoff');
var AUTOSTART = 'org.webosbrew.autostart';
var LIVE_TV = 'com.webos.app.livetv';
var logNode = document.querySelector('pre');
function log(message) {
  var line = '[' + new Date().toISOString() + '] ' + message;
  if (logNode) logNode.textContent += line + '\n';
  if (typeof console !== 'undefined') console.log(line);
}
function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
function lunaCall(uri, parameters) {
  return new Promise(function (resolve, reject) {
    var finished = false;
    var timer = setTimeout(function () {
      if (finished) return;
      finished = true;
      reject(new Error('Luna timeout: ' + uri));
    }, 9000);
    function done(ok, value) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (ok) resolve(value || {});
      else reject(new Error(JSON.stringify(value || { message: 'Luna error' })));
    }
    try {
      var slash = uri.indexOf('/', 7);
      webOS.service.request(uri.substring(0, slash), {
        method: uri.substring(slash + 1),
        parameters: parameters || {},
        onSuccess: function (result) { done(true, result); },
        onFailure: function (error) { done(false, error); }
      });
    } catch (e) { done(false, { errorText: String(e) }); }
  });
}
async function callWithRetry(uri, payload, name, attempts) {
  var count = attempts || 2, lastError;
  for (var n = 0; n < count; n++) {
    try {
      var result = await lunaCall(uri, payload);
      if (result.returnValue === false) throw new Error(result.errorText || result.message || 'returnValue=false');
      return result;
    } catch (e) {
      lastError = e;
      log(name + ': try ' + (n + 1) + '/' + count + ' failed: ' + e.message);
      if (n + 1 < count) await sleep(850 + 850 * n);
    }
  }
  throw lastError;
}
async function bootHomebrew() {
  try {
    await callWithRetry('luna://org.webosbrew.hbchannel.service/autostart', {}, 'Homebrew startup', 3);
    log('Homebrew startup requested');
  } catch (e) {
    log('Homebrew startup unavailable: ' + e.message);
  }
}
async function getPreviousApp() {
  try {
    var response = await callWithRetry('luna://org.webosbrew.hbchannel.service/exec', {
      command: 'cat /var/lib/eim/lastinput'
    }, 'Read last input', 2);
    var appId = handoff.chooseAppId(response.stdoutString);
    log('Restore target: ' + appId);
    return appId;
  } catch (e) {
    log('Last input unavailable; use Live TV: ' + e.message);
    return LIVE_TV;
  }
}
async function foregroundId() {
  try {
    var response = await lunaCall('luna://com.webos.applicationManager/getForegroundAppInfo', {});
    return response.appId || response.id || '';
  } catch (e) { return ''; }
}
async function restoreDisplay(target) {
  var delays = [1200, 2500, 4000];
  for (var n = 0; n < delays.length; n++) {
    await sleep(delays[n]);
    var current = await foregroundId();
    if (current === target) {
      log('Foreground already restored: ' + current);
      return true;
    }
    // Avoid interrupting the user if an actual application already took over.
    if (current && current !== AUTOSTART && current !== LIVE_TV && current !== target) {
      log('Foreground changed externally to ' + current + '; no forced takeover');
      return true;
    }
    try {
      var answer = await lunaCall('luna://com.webos.service.applicationManager/launch', { id: target });
      if (answer.returnValue === false) throw new Error(answer.errorText || 'Launch rejected');
      log('Foreground restore attempt ' + (n + 1) + ' submitted for ' + target);
    } catch (e) {
      log('Foreground restore attempt ' + (n + 1) + ' failed: ' + e.message);
      if (n === 1 && target !== LIVE_TV) {
        target = LIVE_TV;
        log('Using Live TV fallback');
      }
    }
  }
  var current = await foregroundId();
  log('Final foreground: ' + (current || 'unknown'));
  return current === target;
}
async function configureEim() {
  var del = 'luna://com.webos.service.eim/deleteDevice';
  var add = 'luna://com.webos.service.eim/addDevice';
  try {
    // Delete/re-add is required by legacy webOS EIM to get next-boot activation.
    await callWithRetry(del, { appId: AUTOSTART }, 'EIM unregister', 2);
    await callWithRetry(add, {
      appId: AUTOSTART, pigImage: '', mvpdIcon: '',
      type: 'MVPD_IP', label: 'Autostart', description: 'webosbrew autostart'
    }, 'EIM register', 2);
  } catch (e) {
    log('EIM registration failed, preserving current EIM: ' + e.message);
    return false;
  }

  // Unlike the original app, findmnt success alone does not prove a bind overlay.
  // The original /var/lib/eim is itself an ext4 mount on some LG webOS 3 TVs.
  var command = 'set -eu; ' +
    'if [ ! -d /var/lib/webosbrew/eim ]; then cp -a /var/lib/eim /var/lib/webosbrew/eim; fi; ' +
    'src=$(stat -c "%d:%i" /var/lib/webosbrew/eim); ' +
    'dst=$(stat -c "%d:%i" /var/lib/eim); ' +
    'if [ "$src" != "$dst" ]; then mount --bind /var/lib/webosbrew/eim /var/lib/eim; fi; ' +
    'dst=$(stat -c "%d:%i" /var/lib/eim); ' +
    'if [ "$src" = "$dst" ]; then echo EIM_OVERLAY_OK; else echo EIM_OVERLAY_FAILED; fi';
  try {
    var result = await callWithRetry('luna://org.webosbrew.hbchannel.service/exec', {
      command: command
    }, 'EIM overlay verify', 2);
    if (!handoff.overlayVerified(result)) {
      log('EIM overlay not verified; skip deleting EIM overlay registration');
      return false;
    }
    log('EIM overlay verified using device:inode');
  } catch (e) {
    log('EIM overlay failed; original registration is retained: ' + e.message);
    return false;
  }
  try {
    await callWithRetry(del, { appId: AUTOSTART }, 'Remove overlay-only entry', 2);
  } catch (e) {
    log('Overlay cleanup failed without affecting the persistent source: ' + e.message);
  }
  return true;
}
(async function () {
  log('Infiniti Autostart handoff: starting (webOS 3.x)');
  var startTask = bootHomebrew();
  var previousTask = getPreviousApp();
  var target = await previousTask;
  // Restore foreground while setup runs. Every request has a timeout and retry cap.
  var displayTask = restoreDisplay(target);
  await startTask;
  await configureEim();
  var displayRestored = await displayTask;
  log('Handoff finished; foreground verified=' + displayRestored);
  await sleep(1000);
  // Never keep a privileged input placeholder covering the TV indefinitely.
  try { window.close(); } catch (e) { log('window.close unavailable: ' + e.message); }
})().catch(function (e) {
  log('Unexpected handoff failure: ' + e.message);
  setTimeout(function () { try { window.close(); } catch (ignored) {} }, 1500);
});
