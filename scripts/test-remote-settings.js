'use strict';
var assert=require('assert'),r=require('../tv/remote-settings.js');
assert.ok(r.validate('idleEffect','snow'));assert.ok(!r.validate('idleEffect','shell'));assert.ok(r.validate('idleSeconds',60));assert.ok(!r.validate('idleSeconds',-1));assert.ok(r.validate('app:com.netflix.app:title','Phim'));assert.ok(!r.validate('app:com.infinitimoney.tvhome:visible',false));assert.ok(!r.validate('app:com.netflix.app:icon','https://example.com/a'));assert.ok(r.validate('app:com.netflix.app:icon','pack:gold:netflix'));assert.ok(!r.validate('__proto__',{}));assert.ok(!r.validate('command','reboot'));console.log('Typed remote settings validation passed.');

assert.ok(r.validate('app:com.netflix.app:pinned',true));assert.ok(!r.validate('app:com.netflix.app:pinned','yes'));assert.ok(r.validate('weatherUnit','fahrenheit'));
