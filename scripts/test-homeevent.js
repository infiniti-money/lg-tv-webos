#!/usr/bin/env node
'use strict';
var assert = require('assert'), fs = require('fs'), vm = require('vm');
var source = fs.readFileSync('tv/home-event-monitor.js', 'utf8');
var events = [], pending = null;
var mockFs = {
  existsSync:function(path){ return path === '/home/root/lg-tv-vibehack/home-enabled'; },
  appendFileSync:function(){}
};
var fakeCp = {execFile:function(file,args,opts,cb) {
  events.push({file:file,args:args,timeout:opts.timeout});
  pending = cb;
}};
var box={exports:{}};
var context = {
  module:box,
  process:{arch:'arm',argv:['node','home-event-monitor.js']},
  Buffer:Buffer,
  require:function(x){ return x === 'fs' ? mockFs : x === 'child_process' ? fakeCp : null; },
  console:console,
  Date:Date
};
vm.runInNewContext(source,context,{filename:'home-event-monitor.js'});
var m=box.exports;
function event(size,code,value,type) {
  var x=new Buffer(size);
  x.fill(0);
  x.writeUInt16LE(type===undefined?1:type,size-8);
  x.writeUInt16LE(code,size-6);
  x.writeInt32LE(value,size-4);
  return x;
}
assert.strictEqual(m.EVENT_BYTES,16,'LG ARM 32-bit input_event size');
assert.strictEqual(m.validDevice('/dev/input/event3'),true);
assert.strictEqual(m.validDevice('/dev/input/event19'),true);
assert.strictEqual(m.validDevice('/tmp/foo'),false);
assert.strictEqual(m.validDevice('/dev/input/event3;rm -rf /'),false);
assert.strictEqual(m.isHomeDown(m.decode(event(16,0x0305,1))),true);
assert.strictEqual(m.isHomeDown(m.decode(event(24,0x0305,1))),true,'64-bit event layout');
assert.strictEqual(m.isHomeDown(m.decode(event(16,0x0305,0))),false,'ignore keyup');
assert.strictEqual(m.isHomeDown(m.decode(event(16,0x0305,2))),false,'ignore key repeats');
assert.strictEqual(m.isHomeDown(m.decode(event(16,0x0110,1))),false,'OK must remain unchanged');
assert.strictEqual(m.isHomeDown(m.decode(event(16,0x019c,1))),false,'Back must remain unchanged');
assert.strictEqual(m.isHomeDown(m.decode(event(16,0x0305,1,2))),false,'not EV_KEY');
assert.strictEqual(m.decode(new Buffer(8)),null,'reject truncated event');
assert.strictEqual(m.onEvent(m.decode(event(16,0x0110,1)),10000),false);
assert.strictEqual(m.onEvent(m.decode(event(16,0x0305,1)),10000),true);
assert.strictEqual(events.length,1);
assert.strictEqual(events[0].file,'/bin/sh');
assert.strictEqual(events[0].args[0],'/home/root/lg-tv-vibehack/golauncher.sh');
assert.strictEqual(m.onEvent(m.decode(event(16,0x0305,1)),11000),false,'busy/debounce');
pending(null);
assert.strictEqual(m.onEvent(m.decode(event(16,0x0305,1)),11799),false,'debounce');
assert.strictEqual(m.onEvent(m.decode(event(16,0x0305,1)),11801),true,'new press after debounce');
assert.strictEqual(events.length,2);
pending(null);
assert.ok(source.indexOf('fs.read(fd, buffer')!==-1,
  'must read input asynchronously so launcher callbacks can finish');
assert.ok(source.indexOf('fs.readSync(fd, buffer')===-1,
  'synchronous input loop starves launcher callbacks');
console.log('Physical HOME 773 observer tests passed: 16/24 byte events, OK/Back ignored, debounce and async reads.');
