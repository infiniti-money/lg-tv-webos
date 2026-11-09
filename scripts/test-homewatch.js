#!/usr/bin/env node
'use strict';
var assert = require('assert');
var p = require('../tv/homewatch.js').shouldRedirect;
assert.strictEqual(p('org.webosbrew.inputhook', true, 0), true, 'Input Hook at boot');
assert.strictEqual(p('org.webosbrew.hbchannel', true, 10), true, 'Homebrew at boot');
assert.strictEqual(p('com.webos.app.livetv', true, 30), true, 'Live TV at boot');
assert.strictEqual(p('org.webosbrew.inputhook', false, 100), false, 'never hijack Input Hook later');
assert.strictEqual(p('com.webos.app.livetv', false, 100), false, 'never hijack Live TV later');
assert.strictEqual(p('org.webosbrew.inputhook', true, 91000), false, 'boot grace expires');
assert.strictEqual(p('com.webos.app.home', false, 999999), true, 'LG Home always redirects');
assert.strictEqual(p('com.infinitimoney.tvhome', true, 0), false, 'do not loop self');
assert.strictEqual(p('com.netflix.app', true, 0), false, 'never hijack third-party app');
console.log('Home watcher policy tests passed.');
