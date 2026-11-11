#!/usr/bin/env node
'use strict';
/* Source-inspired compatibility guards; deliberately no boot modifications. */
var fs=require('fs'), assert=require('assert');
var keymap=fs.readFileSync('tv/keymap.js','utf8');
var diag=fs.readFileSync('tv/integration-diagnostics.sh','utf8');
var control=fs.readFileSync('tv/home-control.sh','utf8');
var install=fs.readFileSync('install.sh','utf8');
var docs=fs.readFileSync('docs/upstream-webos3-compat.md','utf8');
assert.ok(keymap.indexOf("x.action === 'launch'")>=0 &&
  keymap.indexOf("x.action === 'exec'")>=0,
  'LG Input Hook supports both Launch App and Execute, preserve safe rollback');
assert.ok(keymap.indexOf("conf[key] = {action: 'exec', command: cmd}")>=0,
  'Use the tested Execute action for the managed Home key');
assert.ok(diag.indexOf('com.ecklf.luma')>=0 &&
  diag.indexOf('io.freemytv')>=0 &&
  diag.indexOf('org.webosbrew.inputhook')>=0,
  'Read-only integration check should recognize all three upstream apps');
assert.ok(diag.indexOf('/var/lib/luma-home')>=0 &&
  diag.indexOf('/var/lib/webosbrew/init.d/97-homekey')>=0,
  'Detect unsupported takeover artifacts and conflicting Home key loops');
assert.ok(diag.indexOf('773')>=0 && diag.indexOf('0305')>=0);
assert.ok(!/(?:^|\n)\s*(?:rm|mv|cp|mount|umount|reboot|shutdown|systemctl|initctl|kill|pkill|touch|tee)\s/m.test(diag),
  'Diagnostics cannot alter Home, scripts, mounts, or reboot');
assert.ok(diag.indexOf('luna://')===-1,
  'The diagnostic should not call Luna methods that could mutate the TV');
assert.ok(control.indexOf('sh "$DATA/integration-diagnostics.sh"')>=0,
  'Home diagnostics should include read-only integration audit');
assert.ok(install.indexOf('diagnose-home.sh integration-diagnostics.sh compat-check.sh')>=0,
  'Root installer should distribute the interoperability diagnostic');
assert.ok(docs.indexOf('Simon34545/lginputhook')>=0 &&
  docs.indexOf('ecklf/lg-luma')>=0 &&
  docs.indexOf('simbasjungles/free-my-tv')>=0,
  'Keep source references and license considerations discoverable');
assert.ok(docs.indexOf('webOS 3.4')>=0 &&
  docs.indexOf('webOS 5')>=0,
  'Clearly distinguish unsupported native takeover from legacy webOS');
console.log('Upstream compatibility: Input Hook Execute/Launch, read-only conflict diagnostics, webOS3 takeover guard passed.');
