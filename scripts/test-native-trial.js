'use strict';
var fs=require('fs'),vm=require('vm'),assert=require('assert');
var src=fs.readFileSync('tv/native-launch.js','utf8');
function scenario(fg,expired,locked,fail){
 var calls=[],log='',now=Date.now();
 var f={
  existsSync:function(){return false;},
  readFileSync:function(){return String(now/1000+(expired?-1:60));},
  mkdirSync:function(){if(locked)throw Error('busy');},
  rmdirSync:function(){},
  appendFileSync:function(p,s){log+=s;}
 };
 var proc={};
 var mock=function(uri,body,cb){
  calls.push(uri);
  if(fail)return cb(Error('unavailable'));
  if(/launch$/.test(uri))return cb(null,{returnValue:true});
  cb(null,{appId:calls.length===1?fg:'com.infinitimoney.tvhome'});
 };
 vm.runInNewContext(src,{require:function(p){return p==='fs'?f:{luna:mock};},process:proc,Date:Date,Number:Number});
 return {calls:calls,log:log,code:proc.exitCode};
}
var app='com.infinitimoney.tvhome',r=scenario(app);
assert.strictEqual(r.calls.length,1);assert.ok(/Already foreground; no launch/.test(r.log));
r=scenario('other');assert.strictEqual(r.calls.length,3);assert.ok(/foreground confirmed/.test(r.log));
r=scenario(app,true);assert.strictEqual(r.calls.length,0);
r=scenario(app,false,true);assert.strictEqual(r.calls.length,0);assert.ok(/coalesced/.test(r.log));
r=scenario(app,false,false,true);assert.strictEqual(r.calls.length,1);assert.ok(/no launch/.test(r.log));
var trial=fs.readFileSync('tv/native-trial.sh','utf8');
assert.ok(trial.indexOf('sha256sum "/proc/$p/exe"')>=0);
assert.ok(trial.indexOf('Physical injection suspended')>=0);
assert.ok(trial.indexOf('bounded "$STATE/ezinject"')<0);
assert.ok(trial.indexOf('--confirm-05.70.45')>=0);
assert.ok(trial.indexOf('native-trial-original.json')>=0);
assert.ok(fs.readFileSync('tv/native-lab.sh','utf8').indexOf('= "$$" ]')>=0);
console.log('Native trial foreground, coalescing, expired/refused launch and static safety checks passed.');

var classify=require('../tv/native-diagnostics.js').classify;
var mapped='123-456 r-xp /tmp/libinputhookpp.so\n';
assert.strictEqual(classify(mapped,'',null).status,'MAPPED_INIT_UNVERIFIED');
assert.strictEqual(classify(mapped,'',null).reinjectForbidden,true);
assert.strictEqual(classify('','',null).status,'NOT_MAPPED');
var log='InputHook initialized\nFrida gum initialized\nReplacing lginput_uinput_send_button\nlib_main returned: 0\n';
assert.strictEqual(classify(mapped,log,null).status,'INIT_LOGGED_NO_CALLS');
assert.strictEqual(classify(mapped,log+'lginput_uinput_send_button called:',null).status,'CALLS_OBSERVED');
console.log('Native diagnostic classifications passed');

var lab=fs.readFileSync('tv/native-lab.sh','utf8');
assert.ok(lab.indexOf('"$work" "$child" "$$" >')>=0,'observer must receive actual shell parent PID');
assert.ok(lab.indexOf('probe-exit-code')>=0,'capture pre-injection probe failures');

assert.ok(lab.indexOf('QUIT_ACK')>=0);
assert.ok(lab.indexOf('mock-exec-once')>=0);
assert.ok(lab.indexOf('cycle-final-pass')>=0);
assert.ok(lab.indexOf('LAB_CLEANUP_INCOMPLETE')>=0);
assert.ok(lab.indexOf('native-lab-cycle-original.json')>=0);

assert.ok(lab.indexOf('preloaded-runtime-verified')>=0);
assert.ok(lab.indexOf('LD_PRELOAD="$preload" LD_DEBUG=libs,bindings')>=0);
assert.ok(lab.indexOf('maps-before.txt')>=0);
assert.ok(lab.indexOf('loader-summary.log')>=0);

['baseline-trace','glib-only','cxx-only','preloaded','cxx-first','preloaded-quiet'].forEach(function(v){assert.ok(lab.indexOf(v)>=0);});
assert.ok(lab.indexOf('native-loader-report.js')>=0);
assert.ok(lab.indexOf('lab-exit-code')>=0);
