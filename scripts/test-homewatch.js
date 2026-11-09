#!/usr/bin/env node
'use strict';
var assert = require('assert');
var p = require('../tv/homewatch.js').shouldRedirect;
assert.strictEqual(p('org.webosbrew.inputhook', true, 0, true), true, 'Input Hook at real boot');
assert.strictEqual(p('org.webosbrew.inputhook', true, 0, false), false, 'restarting watcher must not hijack Input Hook');
assert.strictEqual(p('org.webosbrew.hbchannel', true, 10, true), true, 'Homebrew at boot');
assert.strictEqual(p('com.webos.app.livetv', true, 30, true), true, 'Live TV at boot');
assert.strictEqual(p('org.webosbrew.inputhook', false, 100, true), false, 'never hijack Input Hook later');
assert.strictEqual(p('com.webos.app.livetv', false, 100, true), false, 'never hijack Live TV later');
assert.strictEqual(p('org.webosbrew.inputhook', true, 91000, true), false, 'boot grace expires');
assert.strictEqual(p('com.webos.app.home', false, 999999, false), true, 'LG Home always redirects');
assert.strictEqual(p('com.infinitimoney.tvhome', true, 0, true), false, 'do not loop self');
assert.strictEqual(p('com.netflix.app', true, 0, true), false, 'never hijack third-party app');
assert.strictEqual(p('com.webos.app.home', false, 999999, true), true, 'LG Home in boot mode');
console.log('Home watcher policy tests passed.');
