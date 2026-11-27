'use strict';
var assert=require('assert'),m=require('../tv/local-name.js'),ip='192.168.2.154';
var p=m.parse(m.packet(ip,120,null,true));assert.equal(p.flags,0);assert.equal(p.questions[0].name,'tan-dev.local');assert.ok(m.matches(p.questions[0]));assert.equal(p.records[0].ip,ip);
p=m.parse(m.packet(ip,120,null,false));assert.ok(p.flags&32768);assert.equal(p.records[0].ttl,120);
var q={id:123,questions:[{name:'tan-dev.local',type:1,cls:1}]};p=m.parse(m.packet(ip,10,q,false));assert.equal(p.id,123);assert.equal(p.questions.length,1);assert.equal(p.records[0].ttl,10);
assert.equal(m.matches({name:'other.local',type:1,cls:1}),false);assert.throws(function(){m.parse(Buffer.alloc(2));});
var bad=Buffer.alloc(18);bad.writeUInt16BE(1,4);bad[12]=192;bad[13]=12;assert.throws(function(){m.parse(bad);});
console.log('mDNS packet, probe, legacy reply and malformed compression checks passed.');
