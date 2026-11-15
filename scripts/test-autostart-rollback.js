#!/usr/bin/env node
'use strict';
var assert=require('assert'),fs=require('fs');
var src=fs.readFileSync('tv/autostart-rollback.sh','utf8');
assert(src.indexOf('MODE="--inspect"')>=0,'read-only default');
assert(src.indexOf('[ "$ROOT" = "$OVERLAY" ]')>=0,'guard mount');
assert(src.indexOf('cp -a "$EIM" "$SNAPSHOT/eim-real"')>=0,'real EIM backup');
assert(src.indexOf('luna://com.webos.service.eim/deleteDevice')>=0,'EIM API');
assert(src.indexOf('grep -Eq')>=0,'check EIM API result');
assert(src.indexOf('rm -rf')<0,'no unsafe delete');
assert(src.indexOf('reboot')>=0,'reboot warning');
console.log('Autostart EIM rollback safety preflight passed.');
