'use strict';
var assert=require('assert'),parse=require('../tv/native-loader-report.js');
var data=[
" 4050: binding file /tmp/lab/libinputhookpp.so [0] to /usr/lib/libglib-2.0.so.0.4000.0 [0]: normal symbol \x60glib__private__'",
" 4050: binding file /tmp/lab/libinputhookpp.so [0] to /lib/libstdc++.so.6.0.19 [0]: normal symbol \x60_ZNSt5ctypeIwED2Ev'",
" 4050: binding file /tmp/lab/libinputhookpp.so [0] to /lib/libstdc++.so.6.0.19 [0]: normal symbol \x60_ZNSt5ctypeIwED2Ev'",
" 4050: calling init: /tmp/lab/libinputhookpp.so"
].join('\n');
var r=parse(data);
assert.strictEqual(r.hookBindingEvents,3);
assert.strictEqual(r.hookInitEntered,true);
assert.strictEqual(r.providers[1].events,2);
assert.strictEqual(r.providers[1].symbols.length,1);
assert.strictEqual(parse('').hookInitEntered,false);
assert.strictEqual(parse("undefined symbol: foo").loaderErrors.length,1);
console.log('Loader report: provider grouping, distinct symbols and constructor entry tests passed');
