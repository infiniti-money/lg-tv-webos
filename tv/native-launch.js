#!/usr/bin/env node
'use strict';
var fs=require('fs'), luna=require('./legacy-luna.js').luna;
var state='/tmp/infiniti-native-home-trial', app='com.infinitimoney.tvhome';
var api='luna://com.webos.applicationManager/', log=state+'/launch.log';
var lock=state+'/launch-lock', held=false;
function record(msg){try{fs.appendFileSync(log,Date.now()+' '+msg+'\n');}catch(e){}}
function active(){
  try {
    if(fs.existsSync(state+'/cancel'))return false;
    var deadline=Number(fs.readFileSync(state+'/active','utf8'));
    var now=Date.now()/1000;
    return deadline>now&&deadline-now<=65;
  }catch(e){return false;}
}
function finish(msg,code){
  record(msg);
  if(held){try{fs.rmdirSync(lock);}catch(e){}held=false;}
  process.exitCode=code;
}
if(active()){
  record('HOME invoked');
  try{fs.mkdirSync(lock,448);held=true;}catch(e){record('HOME coalesced');}
  if(held){
    luna(api+'getForegroundAppInfo',{},function(e,r){
      if(e||!r||typeof r.appId!=='string'||!r.appId)return finish('Foreground unavailable; no launch',1);
      if(!active())return finish('Trial inactive; no launch',1);
      if(r.appId===app)return finish('Already foreground; no launch',0);
      luna(api+'launch',{id:app},function(e){
        if(e)return finish('Launch failed: '+e.message,1);
        if(!active())return finish('Trial ended after launch request',1);
        luna(api+'getForegroundAppInfo',{},function(e,r){
          finish(!e&&r&&r.appId===app?'Launch accepted; foreground confirmed':'Launch accepted; foreground unverified',!e&&r&&r.appId===app?0:1);
        },null,2000);
      },null,3000);
    },null,2000);
  }
}
