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
