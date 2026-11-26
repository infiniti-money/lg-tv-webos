'use strict';
var fs=require('fs'),assert=require('assert'),vm=require('vm'),crypto=require('crypto');
var s=fs.readFileSync('tv/wallpaper-server.js','utf8'),i=s.indexOf('function validKey('),j=s.indexOf('function storeKey(',i),ctx={crypto:crypto};vm.runInNewContext(s.slice(i,j),ctx);
assert.ok(ctx.validKey('My_PrivateKey-1234'));assert.ok(!ctx.validKey('1234'));assert.ok(!ctx.validKey('invalid key with spaces'));assert.ok(!ctx.validKey(['My_PrivateKey-1234']));assert.ok(ctx.keyMatches('My_PrivateKey-1234','My_PrivateKey-1234'));assert.ok(!ctx.keyMatches('My_PrivateKey-1234','My_PrivateKey-1235'));
assert.ok(s.indexOf("route==='POST /api/key'")>=0);assert.ok(s.indexOf("route==='GET /'")>=0);assert.ok(s.indexOf('fs.chmodSync(tmp,384)')>=0);assert.ok(s.indexOf('keyMatches(q.k,KEY)')>=0);console.log('LAN key validation, rotation wiring and login checks passed.');

assert.ok(ctx.validKey('abcdefgh'));assert.ok(!ctx.validKey('abcdefg'));assert.ok(ctx.keyMatches('abcdefgh','abcdefgh'));

for(var i=0;i<5;i++)assert.equal(ctx.keyFailure('ip:test',1000),false);assert.equal(ctx.keyFailure('ip:test',1000),true);assert.equal(ctx.keyFailure('ip:test',61000),false);
