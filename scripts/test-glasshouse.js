#!/usr/bin/env node
'use strict';
var assert = require('assert');
var fs = require('fs');
var vm = require('vm');

var adapter = fs.readFileSync('app/glasshouse.js', 'utf8');
var app = fs.readFileSync('app/app.js', 'utf8');
var html = fs.readFileSync('app/index.html', 'utf8');

function run(window) {
  vm.runInNewContext(adapter, { window: window, encodeURIComponent: encodeURIComponent });
}

(function nativeInstallUnaffected() {
  var root = { TV_APPS: { apps: [{ id: 'native', title: 'Native' }], inputs: [] } };
  run(root);
  assert.strictEqual(root.INFINITI_GLASSHOUSE, undefined);
  assert.strictEqual(root.TV_APPS.apps[0].id, 'native');
})();

(function hostedByGlasshouse() {
  var requests = [], opens = [], redraws = 0, changed;
  var root = {
    TV_APPS: { apps: [], inputs: [] },
    INFINITI_LAUNCHER_REFRESH: function () { redraws++; }
  };
  root.Glasshouse = {
    catalogue: function (cb) { requests.push(cb); },
    open: function (kind, id, cb) { opens.push([kind, id]); cb(null); },
    iconUrl: function (id) { return '/icon/' + id; },
    onChanged: function (fn) { changed = fn; }
  };

  run(root);
  assert.ok(root.INFINITI_GLASSHOUSE.enabled);
  assert.strictEqual(requests.length, 1, 'must fetch on initial load');
  requests.shift()(null, {
    apps: [
      { id: 'com.example.app', title: 'Example', icon: '/icons/example.png' },
      { id: 'com.example.hidden', title: 'Hidden', hidden: true },
      { id: 'com.example.other', title: 'Other' }
    ],
    inputs: [
      { id: 'hdmi:1', title: 'HDMI 1' },
      { id: 'tuner', title: 'Live TV', tuner: true },
      { id: 'hidden', title: 'Hidden input', hidden: true }
    ]
  });
  assert.strictEqual(root.TV_APPS.apps.length, 2, 'honor Glasshouse hidden apps');
  assert.strictEqual(root.TV_APPS.apps[0].icon, '/icons/example.png');
  assert.strictEqual(root.TV_APPS.apps[1].icon, '/icon/com.example.other');
  assert.strictEqual(root.TV_APPS.inputs.length, 2, 'honor hidden inputs');
  assert.strictEqual(root.TV_APPS.inputs[0].kind, 'input');
  assert.strictEqual(root.TV_APPS.inputs[1].tuner, true);
  assert.strictEqual(redraws, 1, 'initial catalogue should redraw the UI');

  root.INFINITI_GLASSHOUSE.openApp('com.example.app', function (err) { assert.ifError(err); });
  root.INFINITI_GLASSHOUSE.openInput('hdmi:1', function (err) { assert.ifError(err); });
  assert.strictEqual(JSON.stringify(opens), JSON.stringify([
    ['app', 'com.example.app'], ['input', 'hdmi:1']
  ]));

  var latest = JSON.stringify(root.TV_APPS);
  var changedFlag = null;
  root.INFINITI_GLASSHOUSE.refresh(function (changed) { changedFlag = changed; });
  requests.shift()(null, {
    apps: [
      { id: 'com.example.app', title: 'Example', icon: '/icons/example.png' },
      { id: 'com.example.other', title: 'Other' }
    ],
    inputs: [
      { id: 'hdmi:1', title: 'HDMI 1' },
      { id: 'tuner', title: 'Live TV', tuner: true }
    ]
  });
  assert.strictEqual(changedFlag, false);
  assert.strictEqual(redraws, 1, 'unchanged refresh must not redraw');

  changed();
  requests.shift()(new Error('temporary connection loss'));
  assert.strictEqual(JSON.stringify(root.TV_APPS), latest, 'do not erase on failure');

  changed();
  requests.shift()(null, { apps: [], inputs: [] });
  assert.strictEqual(JSON.stringify(root.TV_APPS), latest, 'do not erase on transient empty result');

  changed();
  requests.shift()(null, {
    apps: [{ id: 'com.example.new', title: 'New app', icon: '/icons/new.png' }],
    inputs: [{ id: 'hdmi:2', title: 'HDMI 2' }]
  });
  assert.strictEqual(root.TV_APPS.apps[0].id, 'com.example.new');
  assert.strictEqual(root.TV_APPS.inputs[0].appId, 'hdmi:2');
  assert.strictEqual(redraws, 2, 'changed catalogue should redraw once');
  assert.strictEqual(root.INFINITI_GLASSHOUSE.lastError, null);
})();

assert.ok(/<script src="apps\.js"><\/script>[\s\S]*?<script src="glasshouse\.js"><\/script>/.test(html),
  'Glasshouse adapter must load after native catalogue placeholder');
assert.ok(html.indexOf('glasshouse.js') < html.indexOf('customize.js'),
  'adapter must be available when Customize initializes');
assert.ok(/gh\.openApp\(id,/.test(app), 'app launches must use Glasshouse API');
assert.ok(/gh\.openInput\(row\.appId,/.test(app), 'HDMI must use Glasshouse input API');
assert.ok(/gh\.refresh\(function \(changed\)/.test(app), 'refresh must not reload stale apps.js');
console.log('Glasshouse native integration tests passed');
