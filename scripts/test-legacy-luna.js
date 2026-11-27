'use strict';
var assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
var helper=require('../tv/legacy-luna.js');
var dir=fs.mkdtempSync(path.join(os.tmpdir(),'v8-luna-'));
var bin=path.join(dir,'luna');
function script(src){fs.writeFileSync(bin,src);fs.chmodSync(bin,448);}
script('#!/usr/bin/env python3\nimport select,sys,json\nif select.select([sys.stdin],[],[],0.15)[0]: sys.exit(0)\nprint(json.dumps({"returnValue":True,"appId":"com.infinitimoney.tvhome"}),flush=True)\n');
helper.luna('fake',{},function(e,r){
  assert.ifError(e);assert.strictEqual(r.appId,'com.infinitimoney.tvhome');
  script('#!/bin/sh\nexit 0\n');
  helper.luna('fake',{},function(e){
    assert.ok(e);
    script('#!/bin/sh\nprintf \'%s\\n\' \'{"returnValue":false}\'\n');
    helper.luna('fake',{},function(e){
      assert.ok(e);fs.unlinkSync(bin);fs.rmdirSync(dir);
      console.log('Legacy Node Luna held-open stdin, missing JSON and rejection passed.');
    },bin,2000);
  },bin,2000);
},bin,2000);

var sequence=[false,true,false,true,true],samples=0;
helper.waitReady(function(){return 'ready';},function(cb){samples++;cb(sequence.shift(),'test');},function(e){
  assert.ifError(e);assert.strictEqual(samples,5,'two consecutive successful samples required');
  helper.waitReady(function(){return 'cancel';},function(){throw Error('sample after cancel');},function(e){
    assert.ok(e);assert.ok(/canceled/.test(e.message));
    helper.waitReady(function(){return 'pending';},function(){throw Error('sample during failsafe');},function(e){
      assert.ok(e);assert.ok(/timeout/.test(e.message));
      console.log('Adaptive boot readiness: consecutive samples, cancel and timeout passed.');
    },{seconds:0.02,interval:2});
  },{interval:0});
},{interval:0});

 // A fresh proof on the fast path must never cause a close; errors fall back once.
 function scenario(errors,guards,expected,success){
   var calls=[],result=0;
   helper.redirectHome('enabled',function(mode,closeFirst,cb,opts){
     assert.strictEqual(mode,'enabled');
     calls.push(closeFirst);
     if(!closeFirst){assert.strictEqual(opts.deadline,2500);assert.strictEqual(opts.launchTimeout,1200);}
     cb(errors.shift()||null);
   },function(){return guards.shift();},function(e){
     result++;assert.strictEqual(!e,success);
   });
   assert.deepStrictEqual(calls,expected);assert.strictEqual(result,1);
 }
 scenario([null],[true],[false],true);
 scenario([Error('no render proof'),null],[true,true],[false,true],true);
 scenario([Error('timeout'),Error('fallback timeout')],[true,true],[false,true],false);
 scenario([Error('canceled')],[true,false],[false],false);
 scenario([],[false],[],false);
 console.log('Home fast relaunch, one fallback, and failsafe cancellation passed.');

 // Foreground Tân Dev may be covered by native LG ribbon even with a valid render.
 function foregroundScenario(err,reply,guards,errors,expected,success){
   var calls=[],probes=0,finished=0;
   helper.redirectFromForeground('enabled',function(cb){probes++;cb(err,reply);},
     function(mode,closeFirst,cb){assert.strictEqual(mode,'enabled');calls.push(closeFirst);cb(errors.shift()||null);},
     function(){return guards.length?guards.shift():true;},
     function(e){finished++;assert.strictEqual(!e,success);});
   assert.deepStrictEqual(calls,expected);assert.strictEqual(finished,1);
   assert.strictEqual(probes,expected.length===0&&guards.length===0&&reply===null&&!err?0:1);
 }
 foregroundScenario(null,{appId:'com.infinitimoney.tvhome'},[],[],[true],true);
 foregroundScenario(null,{appId:'youtube.leanback.v4'},[],[],[false],true);
 foregroundScenario(null,{appId:'com.webos.app.livetv'},[],[],[false],true);
 foregroundScenario(null,{appId:'UNKNOWN'},[],[],[true],true);
 foregroundScenario(null,{appId:' '},[],[],[true],true);
 foregroundScenario(Error('probe timeout'),null,[],[],[true],true);
 foregroundScenario(null,{appId:'youtube.leanback.v4'},[],[Error('no fresh proof'),null],[false,true],true);
 foregroundScenario(null,{appId:'com.infinitimoney.tvhome'},[],[Error('render failed')],[true],false);
 foregroundScenario(null,{appId:'com.infinitimoney.tvhome'},[true,false],[],[],false);
 foregroundScenario(null,null,[false],[],[],false);
 console.log('Home foreground recovery, unknown state, fast path and cancellation passed.');
