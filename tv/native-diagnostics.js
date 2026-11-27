#!/usr/bin/env node
/* Node 0.12. Read-only classification; never attaches to a process. */
'use strict';
var fs=require('fs');
function read(p){try{return fs.readFileSync(p,'utf8');}catch(e){return '';}}
function classify(maps,log,meta){
 var mapped=/libinputhookpp\.so(?:\s|$)/m.test(maps), old=/libphp\.so(?:\s|$)/m.test(maps);
 var init=/InputHook initialized/.test(log), gum=/Frida gum initialized/.test(log);
 var replace=/Replacing lginput_uinput_send_button/.test(log);
 var done=/lib_main returned: 0\b/.test(log);
 var calls=(log.match(/lginput_uinput_send_button called:/g)||[]).length;
 var fault=/SIGILL|SIGSEGV|Illegal instruction|Segmentation fault/i.test(log);
 return {mapped:mapped,oldHook:old,initialized: init,gum:gum,replacementLogged:replace,libMainReturned:done,observedCalls:calls,fault:fault,injector:meta||null,
 status:old?'CONFLICT':!mapped?'NOT_MAPPED':fault?'FAULT':!(init&&gum&&replace&&done)?'MAPPED_INIT_UNVERIFIED':!calls?'INIT_LOGGED_NO_CALLS':'CALLS_OBSERVED', reinjectForbidden:mapped||old};
}
function main(){
 var pid=process.argv[2],dir=process.argv[3];
 if(!/^[0-9]+$/.test(pid)||!dir)throw Error('usage: native-diagnostics.js PID EVIDENCE_DIR');
 var base='/proc/'+pid, maps=fs.readFileSync(base+'/maps','utf8'), meta=null;
 try{meta=JSON.parse(read(dir+'/inject-result.json'));}catch(e){}
 var result=classify(maps,read(dir+'/hook.log'),meta);
 result.pid=pid;
 result.threads=fs.readdirSync(base+'/task').map(function(t){
  var path=base+'/task/'+t;
  return {tid:t,status:read(path+'/status').split('\n').filter(function(l){return /^(Name|State|TracerPid|Threads):/.test(l);}),wchan:read(path+'/wchan').trim()};
 });
 result.logBytes=read(dir+'/hook.log').length;
 result.hookLogOpen=fs.readdirSync(base+'/fd').some(function(f){try{return fs.readlinkSync(base+'/fd/'+f)===dir+'/hook.log';}catch(e){return false;}});
 console.log(JSON.stringify(result,null,2));
}
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={classify:classify};
