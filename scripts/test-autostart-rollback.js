#!/usr/bin/env node
'use strict';
var assert = require('assert'), fs = require('fs');
var src = fs.readFileSync('tv/autostart-rollback.sh', 'utf8');
assert(src.indexOf('MODE="--inspect"') >= 0, 'read-only default');
assert(src.indexOf('BLOCKED: Automatic EIM rollback') >= 0, 'explicitly refuse unsafe disable');
assert(src.indexOf('exit 3') >= 0, 'unsafe mode has nonzero result');
assert(src.indexOf('/proc/self/mountinfo') >= 0, 'mount stack is inspected');
assert(src.indexOf('stat -c') >= 0, 'compare inode references');
assert(!/^[\t ]*(umount|mount|rm|mv|cp|reboot|shutdown|pkill|kill|luna-send)\b/m.test(src),
  'no modifying shell commands are allowed');
assert(src.indexOf('luna://com.webos.service.eim/deleteDevice') < 0, 'do not mutate EIM registration');
console.log('Read-only EIM rollback and disabled-mutation checks passed.');
