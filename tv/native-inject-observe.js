#!/usr/bin/env node
/* Only launch the pinned injector for the synthetic probe created by the parent lab. */
'use strict';
var fs=require('fs'),cp=require('child_process');
var dir=process.argv[2],pid=process.argv[3],parent=process.argv[4];
function fail(s){console.error(s);process.exit(1);}
if(!/^\/tmp\/infiniti-native-lab\.[A-Za-z0-9]+$/.test(dir||'')||!/^[0-9]+$/.test(pid||'')||!/^[0-9]+$/.test(parent||''))fail('invalid isolated lab identity');
try{
 if(fs.readlinkSync('/proc/'+pid+'/exe')!==dir+'/thumb-probe')fail('not synthetic probe');
 if(!new RegExp('^PPid:\\s*'+parent+'\\s*$','m').test(fs.readFileSync('/proc/'+pid+'/status','utf8')))fail('not owned child');
 if(!new RegExp('^PPid:\\s*'+parent+'\\s*$','m').test(fs.readFileSync('/proc/'+process.pid+'/status','utf8')))fail('not owned lab observer');
 if(/libinputhookpp\.so|libphp\.so/.test(fs.readFileSync('/proc/'+pid+'/maps','utf8')))fail('already mapped');
}catch(e){fail(e.message);}
var t=process.hrtime(),timedOut=false,done=false,timer,p;
function finish(code,signal,error){
 if(done)return;done=true;clearTimeout(timer);
 var d=process.hrtime(t);
 var result={exitCode:code,signal:signal,timedOut:timedOut,elapsedMs:Math.round(d[0]*1000+d[1]/1000000),error:error||null};
 fs.writeFileSync(dir+'/inject-result.json',JSON.stringify(result)+'\n',{mode:384});
 console.log(JSON.stringify(result));
 process.exitCode=code===0&&!signal&&!timedOut&&!error?0:1;
}
try{
 p=cp.spawn(dir+'/ezinject',['-l',dir+'/hook.log',pid,dir+'/libinputhookpp.so'],{stdio:['ignore','inherit','inherit']});
 p.on('error',function(e){finish(null,null,e.message);});
 p.on('exit',function(c,s){finish(c,s,null);});
 timer=setTimeout(function(){timedOut=true;try{p.kill('SIGKILL');}catch(e){finish(null,null,e.message);}},20000);
}catch(e){finish(null,null,e.message);}
