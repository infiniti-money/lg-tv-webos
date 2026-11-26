#!/usr/bin/env node
'use strict';
var assert = require('assert'), lunar = require('../app/lunar.js');
function check(day, month, year, ld, lm, ly, leap) {
  var actual = lunar.convert(day, month, year);
  assert.deepEqual(actual, {day:ld, month:lm, year:ly, leap:!!leap},
    'Lunar conversion for ' + day + '/' + month + '/' + year);
}
check(10, 11, 2026, 2, 10, 2026, false);
check(9, 11, 2026, 1, 10, 2026, false);
check(17, 2, 2026, 1, 1, 2026, false);
check(29, 1, 2025, 1, 1, 2025, false);
assert.equal(lunar.yearName(2026), 'Bính Ngọ');
assert.equal(lunar.convert(2, 2, 1800), null);
console.log('Vietnamese lunar date tests passed.');

var fs=require('fs'),vm=require('vm'), target={textContent:''}, hidden=true, cover, ticks=0;
var FakeDate=Date;
var root={INFINITI_LIFECYCLE:{isCovered:function(){return hidden;},subscribe:function(fn){cover=fn;}}};
vm.runInNewContext(fs.readFileSync('app/lunar.js','utf8'),{window:root,document:{getElementById:function(id){return id==='lunarDate'?target:null;}},Date:FakeDate,setInterval:function(){ticks++;return 1;},clearInterval:function(){ticks--;}});
assert.ok(/^Âm lịch: \d+\/\d+\/\d+/.test(target.textContent),'Initial date renders even when covered');
assert.equal(ticks,0);
hidden=false;cover(false);assert.equal(ticks,1);
target.textContent='';root.INFINITI_LUNAR.render();assert.ok(target.textContent.indexOf('Âm lịch:')===0);
hidden=true;cover(true);assert.equal(ticks,0);
console.log('Lunar initial DOM, refresh and lifecycle tests passed.');
