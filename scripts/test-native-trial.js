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
assert.ok(trial.indexOf('bounded "$STATE/ezinject" -l "$STATE/hook.log" "$p"')>=0);
assert.ok(trial.indexOf('--confirm-05.70.45')>=0);
assert.ok(trial.indexOf('native-trial-original.json')>=0);
assert.ok(fs.readFileSync('tv/native-lab.sh','utf8').indexOf('= "$$" ]')>=0);
console.log('Native trial foreground, coalescing, expired/refused launch and static safety checks passed.');
