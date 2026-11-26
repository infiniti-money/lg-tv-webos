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
