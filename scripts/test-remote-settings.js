'use strict';
var assert=require('assert'),r=require('../tv/remote-settings.js');
assert.ok(r.validate('idleEffect','snow'));assert.ok(!r.validate('idleEffect','shell'));assert.ok(r.validate('idleSeconds',60));assert.ok(!r.validate('idleSeconds',-1));assert.ok(r.validate('app:com.netflix.app:title','Phim'));assert.ok(!r.validate('app:com.infinitimoney.tvhome:visible',false));assert.ok(!r.validate('app:com.netflix.app:icon','https://example.com/a'));assert.ok(r.validate('app:com.netflix.app:icon','pack:gold:netflix'));assert.ok(!r.validate('__proto__',{}));assert.ok(!r.validate('command','reboot'));console.log('Typed remote settings validation passed.');

assert.ok(r.validate('app:com.netflix.app:pinned',true));assert.ok(!r.validate('app:com.netflix.app:pinned','yes'));assert.ok(r.validate('weatherUnit','fahrenheit'));

assert.ok(r.validate('weatherLocation',{latitude:20,longitude:106,place:'Hưng Yên'}));assert.ok(!r.validate('weatherLocation',{latitude:91,longitude:106,place:'bad'}));assert.ok(r.validate('weatherEnabled',false));

assert.ok(r.validate('appOrder',['netflix','youtube.leanback.v4']));assert.ok(!r.validate('appOrder',['netflix','netflix']));assert.ok(!r.validate('appOrder',['com.infinitimoney.tvhome']));assert.ok(!r.validate('appOrder','netflix'));
