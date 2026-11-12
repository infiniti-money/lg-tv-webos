'use strict';
// Regression checks for the ES5 Glasshouse cover/Home adapter.
// The real suspend/resume and screen output must still be checked on the TV.
var assert = require('assert');
var fs = require('fs');
var vm = require('vm');

var src = fs.readFileSync('app/lifecycle.js', 'utf8');
function harness(withGlasshouse, initialCovered) {
  var events = {}, coveredHandler = null, homeHandler = null, now = 1000;
  var gh = withGlasshouse ? {
    isCovered: function () { return !!initialCovered; },
    onCovered: function (fn) { coveredHandler = fn; },
    onHome: function (fn) { homeHandler = fn; }
  } : null;
  var doc = {
    hidden: false,
    addEventListener: function (name, fn) { events[name] = fn; }
  };
  var win = {};
  if (gh) win.Glasshouse = gh;
  vm.runInNewContext(src, {
    window: win, document: doc,
    Date: { now: function () { return now; } }
  }, { filename: 'app/lifecycle.js' });
  return {
    api: win.INFINITI_LIFECYCLE,
    doc: doc,
    visibility: function () { events.visibilitychange(); },
    cover: function (v) { coveredHandler(v); },
    home: function () { homeHandler(); },
    tick: function (ms) { now += ms; }
  };
}

var tv = harness(true, true);
var covers = [], homeCount = 0;
assert.strictEqual(tv.api.isCovered(), true, 'initial Glasshouse state wins');
tv.api.subscribe(function (value) { covers.push(value); });
tv.api.onHome(function () { homeCount++; });
tv.home();
assert.strictEqual(homeCount, 0, 'do not process Home while covered');
tv.cover(false);
assert.strictEqual(tv.api.isCovered(), false);
tv.cover(false);
assert.deepStrictEqual(covers, [false], 'duplicate cover transitions ignored');
tv.home();
tv.home();
assert.strictEqual(homeCount, 1, 'rapid Home signals coalesced');
tv.tick(650);
tv.home();
assert.strictEqual(homeCount, 2, 'later deliberate Home still works');
tv.doc.hidden = true;
tv.visibility();
assert.strictEqual(tv.api.isCovered(), true);
tv.cover(true);
tv.cover(false);
assert.strictEqual(tv.api.isCovered(), true, 'visibility still blocks callbacks');
tv.doc.hidden = false;
tv.visibility();
assert.strictEqual(tv.api.isCovered(), false);
assert.deepStrictEqual(covers, [false, true, false]);

var standalone = harness(false, false), changes = [];
standalone.api.subscribe(function (value) { changes.push(value); });
standalone.doc.hidden = true;
standalone.visibility();
standalone.visibility();
standalone.doc.hidden = false;
standalone.visibility();
assert.deepStrictEqual(changes, [true, false], 'normal installed IPK uses visibility events');

var app = fs.readFileSync('app/app.js', 'utf8');
var weather = fs.readFileSync('app/extras.js', 'utf8');
var lunar = fs.readFileSync('app/lunar.js', 'utf8');
var html = fs.readFileSync('app/index.html', 'utf8');
assert(html.indexOf('src="lifecycle.js"') > 0 &&
       html.indexOf('src="lifecycle.js"') < html.indexOf('src="app.js"'), 'adapter loads first');
assert(app.indexOf('lifecycle.onHome(') >= 0 && app.indexOf('pauseForeground()') >= 0,
       'launcher handles Home and background work');
assert(weather.indexOf('pauseWeather()') >= 0 &&
       weather.indexOf('active.abort()') >= 0, 'weather aborts while covered');
assert(lunar.indexOf('stopLunar()') >= 0, 'lunar timer pauses while covered');
console.log('Glasshouse cover/Home lifecycle regression checks passed.');
