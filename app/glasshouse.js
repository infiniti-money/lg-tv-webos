/*
 * Use Glasshouse's supported Custom Launcher API when Infiniti is hosted as
 * Glasshouse Home. Native IPK installations still use TV_APPS from sync.js.
 *
 * This file is ES5 for the Chromium 38 engine on webOS 3.x.
 */
(function (root) {
  'use strict';

  var glasshouse = root.Glasshouse;
  if (!glasshouse || typeof glasshouse.catalogue !== 'function' ||
      typeof glasshouse.open !== 'function') return;

  var previous = '';
  var pending = [];
  var working = false;
  var notifyWhenReady = false;

  var bridge = {
    enabled: true,
    lastError: null,
    refresh: refresh,
    openApp: function (id, cb) { open('app', id, cb); },
    openInput: function (id, cb) { open('input', id, cb); }
  };
  root.INFINITI_GLASSHOUSE = bridge;

  function open(kind, id, cb) {
    var done = typeof cb === 'function' ? cb : function () {};
    try {
      glasshouse.open(kind, String(id), function (err) { done(err || null); });
    } catch (e) { done(e); }
  }

  function update(catalogue) {
    if (!catalogue || !catalogue.apps || !catalogue.inputs ||
        !Array.isArray(catalogue.apps) || !Array.isArray(catalogue.inputs)) {
      bridge.lastError = 'Glasshouse returned an invalid catalogue';
      return false;
    }

    var apps = [], inputs = [], i, a, item;
    for (i = 0; i < catalogue.apps.length; i++) {
      a = catalogue.apps[i];
      if (!a || !a.id || a.hidden === true) continue;
      apps.push({
        id: String(a.id),
        title: String(a.title || a.id),
        icon: a.icon || (typeof glasshouse.iconUrl === 'function' ?
          glasshouse.iconUrl(a.id) : '/api/home/icon?id=' + encodeURIComponent(a.id)),
        iconColor: ''
      });
    }
    for (i = 0; i < catalogue.inputs.length; i++) {
      item = catalogue.inputs[i];
      if (!item || !item.id || item.hidden === true) continue;
      inputs.push({
        appId: String(item.id),
        label: String(item.title || item.id),
        kind: 'input',
        tuner: item.tuner === true
      });
    }

    // A transient empty catalogue must not erase the last working app list.
    if (!apps.length) {
      bridge.lastError = 'Glasshouse returned no visible apps';
      return false;
    }

    var next = { apps: apps, inputs: inputs };
    var snapshot = JSON.stringify(next);
    bridge.lastError = null;
    if (snapshot === previous) return false;
    previous = snapshot;
    root.TV_APPS = next;
    return true;
  }

  function finished(changed) {
    working = false;
    var callbacks = pending;
    pending = [];
    var notify = notifyWhenReady;
    notifyWhenReady = false;
    // A user of refresh(cb) redraws the launcher itself. The initial load
    // and Glasshouse.onChanged notifications have no callback and redraw here.
    if (notify && !callbacks.length && (changed || (!previous && bridge.lastError)) &&
        typeof root.INFINITI_LAUNCHER_REFRESH === 'function') {
      root.INFINITI_LAUNCHER_REFRESH();
    }
    for (var i = 0; i < callbacks.length; i++) callbacks[i](changed);
  }

  function refresh(cb) {
    if (typeof cb === 'function') pending.push(cb);
    else notifyWhenReady = true;
    if (working) return;
    working = true;
    try {
      glasshouse.catalogue(function (err, catalogue) {
        if (err) {
          bridge.lastError = err.message || String(err);
          return finished(false);
        }
        finished(update(catalogue));
      });
    } catch (e) {
      bridge.lastError = e.message || String(e);
      finished(false);
    }
  }

  if (typeof glasshouse.onChanged === 'function') {
    glasshouse.onChanged(function () { refresh(); });
  }
  refresh();
})(window);
