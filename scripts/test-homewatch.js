#!/usr/bin/env node
'use strict';
var assert = require('assert');
var fs = require('fs');
var source = fs.readFileSync('tv/homewatch.js','utf8');
var policy = require('../tv/homewatch.js').shouldRedirect;
['com.webos.app.home','org.webosbrew.inputhook','org.webosbrew.hbchannel',
 'com.webos.app.livetv','com.netflix.app','com.infinitimoney.tvhome'].forEach(function(id) {
  [true,false].forEach(function(boot) {
    [true,false].forEach(function(initial) {
      assert.strictEqual(policy(id,initial,0,boot),false,
        'Never hijack '+id+' (boot='+boot+', initial='+initial+')');
    });
  });
});
assert.strictEqual(source.indexOf('applicationManager/launch'),-1,
  'App-list watcher must never launch another app');
assert.strictEqual(source.indexOf('getForegroundAppInfo'),-1,
  'App-list watcher must never subscribe/poll foreground to redirect it');
assert.strictEqual(source.indexOf('com.webos.app.home'),source.lastIndexOf('com.webos.app.home'),
  'LG Home is mentioned only in the safety comment, not a conditional redirect');
assert.ok(source.indexOf('listLaunchPoints')>=0,
  'Keep app-list change discovery independent of UI');
console.log('Safe Home watcher: no foreground hijack at boot/wake, including --boot mode.');
