/* Glasshouse Custom Launcher lifecycle adapter. ES5 for webOS 3.4 / Chromium 38.
 * No system hooks, app launches or boot/wake actions are performed here.
 */
(function (root) {
  'use strict';
  var listeners = [], homeListeners = [], glasshouse = root.Glasshouse || null;
  var hidden = typeof document !== 'undefined' && !!document.hidden;
  var glasshouseCovered = false, lastHome = 0;
  if (glasshouse && typeof glasshouse.isCovered === 'function') {
    try { glasshouseCovered = !!glasshouse.isCovered(); } catch (e) { /* use visibility fallback */ }
  }
  var covered = hidden || glasshouseCovered;

  function publish() {
    var next = !!(hidden || glasshouseCovered), i;
    if (next === covered) return;
    covered = next;
    for (i = 0; i < listeners.length; i++) {
      try { listeners[i](covered); } catch (e) { /* isolate subscribers */ }
    }
  }
  function subscribe(fn) {
    if (typeof fn !== 'function') return;
    listeners.push(fn);
  }
  function onHome(fn) {
    if (typeof fn !== 'function') return;
    homeListeners.push(fn);
  }
  if (glasshouse && typeof glasshouse.onCovered === 'function') {
    try {
      glasshouse.onCovered(function (value) {
        glasshouseCovered = !!value;
        publish();
      });
    } catch (e) { /* keep the visibility fallback */ }
  }
  if (glasshouse && typeof glasshouse.onHome === 'function') {
    try {
      glasshouse.onHome(function () {
        // Ignore the burst of repeated Home reports on older remote input stacks.
        var now = Date.now(), i;
        if (covered || now - lastHome < 600) return;
        lastHome = now;
        for (i = 0; i < homeListeners.length; i++) {
          try { homeListeners[i](); } catch (e) { /* isolate subscribers */ }
        }
      });
    } catch (e) { /* the remote stays owned by Glasshouse */ }
  }
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', function () {
      hidden = !!document.hidden;
      publish();
    });
  }
  root.INFINITI_LIFECYCLE = {
    isCovered: function () { return covered; },
    subscribe: subscribe,
    onHome: onHome
  };
})(typeof window !== 'undefined' ? window : this);
