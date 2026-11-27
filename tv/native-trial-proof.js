#!/usr/bin/env node
'use strict';
var fs=require('fs'), proof=require('./native-proof.js');
var state='/tmp/infiniti-native-home-trial', sys='/var/log/messages';
function run(action){
 if(action==='begin'){
   var c=proof.cursor(sys);if(!c)throw Error('missing system log');
   fs.writeFileSync(state+'/baseline.json',JSON.stringify({cursor:c,boot:fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8'),at:Date.now()}),{mode:384,flag:'wx'});
 }else if(action==='report'){
   var b=JSON.parse(fs.readFileSync(state+'/baseline.json','utf8'));
   if(b.boot!==fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8'))throw Error('boot changed');
   var delta=proof.appended(sys,b.cursor);
   var launches=fs.existsSync(state+'/launch.log')?fs.readFileSync(state+'/launch.log','utf8'):'';
   var hook=fs.readFileSync(state+'/hook.log','utf8');
   var shown=(delta.match(/surface-manager-starfish[^\n]* LSM NL_HOME_SHOWN /g)||[]).length;
   var report={ribbonLogEvents:shown,homePress:(hook.match(/state=1 uinput_code=773\b/g)||[]).length,homeRelease:(hook.match(/state=0 uinput_code=773\b/g)||[]).length,foregroundConfirmed:(launches.match(/Launch accepted; foreground confirmed/g)||[]).length,alreadyForegroundNoLaunch:(launches.match(/Already foreground; no launch/g)||[]).length,errors:(launches.match(/failed|unverified|unavailable|inactive|ended after/g)||[]).length};
   console.log(JSON.stringify(report));
   console.log('Log evidence only. Confirm no visible ribbon, no UI reload and healthy remote manually. No certification.');
 }else throw Error('begin|report');
}
try{run(process.argv[2]);}catch(e){console.error(e.message);process.exitCode=1;}
