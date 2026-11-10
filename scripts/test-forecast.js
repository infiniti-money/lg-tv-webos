#!/usr/bin/env node
'use strict';
var assert = require('assert'), p = require('../app/forecast.js');
var data = {time:[], weather_code:[], temperature_2m_max:[],
  temperature_2m_min:[], precipitation_probability_max:[]};
for (var i=1; i<=8; i++) {
  data.time.push('2026-11-' + (i < 10 ? '0' : '') + i);
  data.weather_code.push(i%2 ? 0 : 61);
  data.temperature_2m_max.push(29+i);
  data.temperature_2m_min.push(21+i);
  data.precipitation_probability_max.push(10*i);
}
var cards=p.prepare(data,true);
assert.equal(cards.length,3);
assert.equal(cards[0].label,'Hôm nay');
assert.equal(cards[0].dateLabel,'CN 1/11');
assert.equal(cards[1].label,'Ngày mai');
assert.equal(cards[2].label,'Ngày kia');
assert.equal(cards[0].high,30);
assert.equal(cards[1].condition,'Mưa');
assert.equal(cards[2].rain,30);
assert.equal(p.prepare(null,true).length,0);
data.temperature_2m_max[0]=null;
assert.equal(p.prepare(data,true).length,2);
assert.equal(p.prepare(data,false)[0].label,'Tomorrow');
assert.equal(p.prepare({time:['2026-02-30'],temperature_2m_max:[32],temperature_2m_min:[20]},true).length,0);
assert.equal(p.condition(95,true),'Dông');
console.log('Three-day weather forecast tests passed.');
