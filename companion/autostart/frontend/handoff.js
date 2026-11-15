'use strict';
// Pure helpers: safe to run on Node.js and in the webOS 3 webpack bundle.
var AUTOSTART = 'org.webosbrew.autostart';
var LIVE_TV = 'com.webos.app.livetv';
function chooseAppId(raw) {
  try {
    var input = JSON.parse(raw || '');
    var id = input && input.appId;
    if (typeof id === 'string' && id.length < 128 &&
        /^[a-zA-Z0-9_.-]+$/.test(id) && id !== AUTOSTART) return id;
  } catch (e) { /* fallback to Live TV when EIM is incomplete */ }
  return LIVE_TV;
}
function overlayVerified(result) {
  return !!(result && !result.error && result.returnValue !== false &&
    typeof result.stdoutString === 'string' &&
    /(^|\n)EIM_OVERLAY_OK(\n|$)/.test(result.stdoutString));
}
module.exports = { chooseAppId: chooseAppId, overlayVerified: overlayVerified };
