#!/usr/bin/env node
'use strict';
// Offline: exercise root + Homebrew Failsafe detection without touching TV.
var assert=require('assert'),fs=require('fs'),path=require('path'),
 os=require('os'),cp=require('child_process');
var original=fs.readFileSync('tv/root-safety-check.sh','utf8');
var installer=fs.readFileSync('install.sh','utf8');
var recovery=fs.readFileSync('tv/safe-recovery.sh','utf8');
var tmp=fs.mkdtempSync(path.join(os.tmpdir(),'infiniti-root-safety-'));
try {
  var hb=path.join(tmp,'webosbrew'),mark=path.join(tmp,'webosbrew_failsafe');
  function probe(uid,rootExists,failsafe) {
    fs.rmSync(hb,{recursive:true,force:true});
    if(rootExists) fs.mkdirSync(path.join(hb,'init.d'),{recursive:true});
    if(failsafe) fs.writeFileSync(mark,'keep this marker; do not auto-remove');
    else if(fs.existsSync(mark))fs.unlinkSync(mark);
    var script=original.replace('ROOT_DIR=/var/lib/webosbrew','ROOT_DIR='+hb)
      .replace('FAILSAFE=/var/luna/preferences/webosbrew_failsafe','FAILSAFE='+mark)
      .replace('UID_NOW=$(id -u 2>/dev/null) || UID_NOW=unknown','UID_NOW='+uid);
    var file=path.join(tmp,'root-check.sh');
    fs.writeFileSync(file,script);
    var a=cp.spawnSync('sh',[file],{encoding:'utf8',timeout:4000});
    assert.strictEqual(a.status,0,'Read-only status must be runnable: '+a.stderr);
    assert.ok(a.stdout.indexOf('AUDIT_ONLY:')>=0);
    if(failsafe) assert.strictEqual(fs.readFileSync(mark,'utf8'),
      'keep this marker; do not auto-remove','Must preserve Failsafe flag');
    return a.stdout;
  }
  assert.ok(probe('0',true,false).indexOf('ROOT_OK:')>=0);
  assert.ok(probe('0',true,true).indexOf('ROOT_FAILSAFE:')>=0);
  assert.ok(probe('1000',true,false).indexOf('ROOT_NOT_ACTIVE:')>=0);
  assert.ok(probe('0',false,false).indexOf('ROOT_UNVERIFIED:')>=0);
  assert.ok(!/(^|\n)\s*(rm|mv|cp|touch|reboot|mount|umount|pkill|systemctl|initctl)\s/.test(original),
    'Read-only checker must not mutate root, marker or startup');
  assert.ok(installer.indexOf('if [ -n "$DIAGNOSE_ROOT" ]; then')>=0 &&
    installer.indexOf('sh /tmp/infiniti-root-safety-check.sh')>=0,
    'Allow root diagnostic without attempting install/root access');
  assert.ok(installer.indexOf('if [ -n "$RECOVER_HOME" ]; then')>=0 &&
    installer.indexOf('sh /tmp/infiniti-safe-recovery.sh') >
      installer.indexOf('if [ -n "$RECOVER_HOME" ]; then'),
    'Recovering launcher startup should be deliberate, never implicit');
  assert.ok(installer.indexOf('if [ -e /var/luna/preferences/webosbrew_failsafe ]; then')>=0,
    'Refuse root install when Failsafe flag is present');
  assert.ok(installer.indexOf('if [ -n "$APP_ONLY" ]; then')>=0 &&
    installer.indexOf('APP_ONLY_COMPLETE')>=0,
    'An IPK-only safe path must avoid touching root services');
  assert.ok(installer.indexOf('rm -rf "$DATA"')===-1 &&
    installer.indexOf('rm -f "$INITD"')===-1,
    'Uninstall must preserve root sidecars and unknown startup hooks');
  assert.ok(recovery.indexOf('webosbrew_failsafe')===-1,
    'Infiniti emergency Home rollback must not delete Failsafe marker');
  console.log('Root/Failsafe offline regression: rooted, failsafe, non-root, missing Homebrew, app-only, explicit recovery, backups preserved.');
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
