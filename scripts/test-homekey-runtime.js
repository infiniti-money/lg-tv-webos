#!/usr/bin/env node
'use strict';
// Source-level guards; a TV remote press and real Input Hook logs are still required.
var assert = require('assert'), fs = require('fs');
var cmd = fs.readFileSync('tv/golauncher.sh','utf8');
var diag = fs.readFileSync('tv/diagnose-home.sh','utf8');
var control = fs.readFileSync('tv/home-control.sh','utf8');
var installer = fs.readFileSync('install.sh','utf8');
assert.ok(cmd.indexOf('HOME Execute invoked')>=0,'Home command must log actual invocation');
assert.ok(cmd.indexOf('Launch accepted')>=0,'Home command must verify Luna acceptance');
assert.ok(cmd.indexOf('com.webos.app.home')>=0 &&
  cmd.indexOf('/launch \'{"id":"com.webos.app.home"}\'')<0,
  'Do not attempt to launch non-existent legacy webOS Home application');
assert.ok(diag.indexOf('/tmp/lginput-hook')>=0,'Inspect real Input Hook logs');
assert.ok(diag.indexOf('/tmp/infiniti-homekey.log')>=0,'Inspect launcher invocation trace');
assert.ok(diag.indexOf('getForegroundAppInfo')>=0,'Inspect app manager foreground');
assert.ok(control.indexOf('NOTE: ACTIVE reflects saved JSON only')>=0,
  'Status must not claim hardware remapping is confirmed');
assert.ok(control.indexOf('diagnose)')>=0,'Read-only diagnose command must exist');
assert.ok(installer.indexOf('diagnose-home.sh')>=0,'Root installer must distribute diagnosis tool');
console.log('Legacy webOS Home mapping runtime diagnostics source checks passed.');
