/* Bounded idle photo album, root service only. Files are never executed. */
'use strict';
var fs=require('fs'),path=require('path'),crypto=require('crypto');
var TIMES=[0,15,20,30,60,120,300,600,1800,3600,7200,21600,43200,86400,172800,604800],MAX=20,LIMIT=1500000,ID=/^[a-f0-9]{24}$/;
var STYLES=["fade","slide-left","slide-right","slide-up","zoom-in","zoom-out","dissolve","cinema","slide-down","diagonal","soft-rotate","sweep","lift","focus","slide-nw","slide-ne","slide-sw","cross-zoom","swing-left","swing-right","drift-in","drop-in","curtain-lite","flip-lite","random","random-light","random-cinema","none"],MOTIONS=["still","zoom","pan","drift","random","random-light","zoom-in","zoom-out","pan-left","pan-right","pan-up","pan-down","pan-nw","pan-ne","pan-sw","pan-se","drift-horizontal","drift-vertical"];
function settings(v){return {enabled:!!(v&&v.enabled===true),seconds:v&&TIMES.indexOf(v.seconds)>=0?v.seconds:20,random:!!(v&&v.random===true),transition:v&&STYLES.indexOf(v.transition)>=0?v.transition:'random-light',motion:v&&MOTIONS.indexOf(v.motion)>=0?v.motion:'random-light',intensity:v&&v.intensity==='medium'?'medium':'light',speed:v&&[600,1100,1600].indexOf(v.speed)>=0?v.speed:1100};}
function jpeg(b){return b.length>=4&&b.length<=LIMIT&&b[0]===255&&b[1]===216&&b[b.length-2]===255&&b[b.length-1]===217;}
function create(data,appDir,allowed,log){
 var dir=path.join(data,'idle-album'),file=path.join(dir,'album.json');
 try{fs.mkdirSync(dir,448);}catch(e){if(e.code!=='EEXIST')throw e;}
 var st=settings({});st.photos=[];
 try{var old=JSON.parse(fs.readFileSync(file,'utf8'));st=settings(old);st.photos=(old.photos||[]).filter(function(id,i,a){return typeof id==='string'&&ID.test(id)&&a.indexOf(id)===i&&fs.existsSync(path.join(dir,id+'.jpg'));}).slice(0,MAX);}catch(e){}
 function atomic(f,s,mode){var t=f+'.album-'+process.pid;fs.writeFileSync(t,s,{mode:mode});fs.renameSync(t,f);}
 function powerEpoch(){try{var boot=fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),wake='';try{wake=fs.readFileSync('/tmp/infiniti-idle-wake','utf8').trim();}catch(e){}return /^[a-f0-9-]{36}$/.test(boot)?boot+':'+wake:'';}catch(e){return '';}}
 var localToken=crypto.randomBytes(24).toString('hex'),lastPublish=0,lastDest='',lastEpoch='';
 function publish(force){if(!allowed())return false;try{
   var dest=appDir(),epoch=powerEpoch(),now=Date.now();if(!fs.existsSync(dest))return false;
   if(!force&&dest===lastDest&&epoch===lastEpoch&&now-lastPublish<30000&&fs.existsSync(path.join(dest,'idle-album.js')))return true;
   var valid=[];
   st.photos.forEach(function(id){var n='idle-photo-'+id+'.jpg',target=path.join(dest,n),src=path.join(dir,id+'.jpg');try{if(!fs.existsSync(target)||fs.statSync(target).size!==fs.statSync(src).size)atomic(target,fs.readFileSync(src),420);valid.push(id);}catch(e){log('album copy: '+e.message);}});
   var script='window.INFINITI_IDLE_ALBUM = '+JSON.stringify({enabled:st.enabled,seconds:st.seconds,random:st.random,transition:st.transition,motion:st.motion,intensity:st.intensity,speed:st.speed,powerEpoch:epoch,photos:valid,localToken:localToken})+';\n',f=path.join(dest,'idle-album.js'),same=false;
   try{same=fs.readFileSync(f,'utf8')===script;}catch(e){}
   if(!same)atomic(f,script,420);
   fs.readdirSync(dest).forEach(function(n){var m=/^idle-photo-([a-f0-9]{24})\.jpg$/.exec(n);if(m&&st.photos.indexOf(m[1])<0)try{fs.unlinkSync(path.join(dest,n));}catch(e){}});
   if(valid.length===st.photos.length){lastDest=dest;lastEpoch=epoch;lastPublish=now;return true;}return false;
 }catch(e){log('album publish: '+e.message);return false;}}
 function save(next){if(!allowed())throw Error('disabled');atomic(file,JSON.stringify(next),384);st=next;return publish(true);}
 function route(req,res,u,json,send,authorized){
  var p=u.pathname,m=req.method,q=u.query;
  if(p.indexOf('/api/album')!==0)return false;
  function reply(code,v){json(res,code,v);}
  if(m==='GET'&&p==='/api/album'){reply(200,{enabled:st.enabled,seconds:st.seconds,random:st.random,transition:st.transition,motion:st.motion,intensity:st.intensity,speed:st.speed,photos:st.photos,max:MAX,maxBytes:LIMIT});return true;}
  if(m==='GET'&&p==='/api/album/photo'){if(typeof q.id!=='string'||!ID.test(q.id)||st.photos.indexOf(q.id)<0){reply(404,{error:'not found'});return true;}try{send(res,200,'image/jpeg',fs.readFileSync(path.join(dir,q.id+'.jpg')));}catch(e){reply(404,{error:'not found'});}return true;}
  if(m==='POST'&&p==='/api/album/settings'){
   if(TIMES.indexOf(Number(q.seconds))<0||!/^[01]$/.test(q.enabled||'')||!/^[01]$/.test(q.random||'')||(q.transition!==undefined&&STYLES.indexOf(q.transition)<0)||(q.motion!==undefined&&MOTIONS.indexOf(q.motion)<0)||(q.intensity!==undefined&&['light','medium'].indexOf(q.intensity)<0)||(q.speed!==undefined&&[600,1100,1600].indexOf(Number(q.speed))<0)){reply(400,{error:'invalid settings'});return true;}
   try{reply(200,{ok:true,published:save({enabled:q.enabled==='1',seconds:Number(q.seconds),random:q.random==='1',transition:q.transition===undefined?st.transition:q.transition,motion:q.motion===undefined?st.motion:q.motion,intensity:q.intensity===undefined?st.intensity:q.intensity,speed:q.speed===undefined?st.speed:Number(q.speed),photos:st.photos.slice()})});}catch(e){reply(500,{error:'save failed'});}return true;
  }
  if(m==='POST'&&p==='/api/album/move'){
   var i=typeof q.id==='string'?st.photos.indexOf(q.id):-1,step=q.direction==='up'?-1:q.direction==='down'?1:0;
   if(i<0||!step){reply(400,{error:'invalid move'});return true;}
   if(i+step<0||i+step>=st.photos.length){reply(409,{error:'album boundary'});return true;}
   try{var next=settings(st);next.photos=st.photos.slice();next.photos[i]=next.photos[i+step];next.photos[i+step]=q.id;reply(200,{ok:true,published:save(next)});}catch(e){reply(500,{error:'save failed'});}return true;
  }
  if(m==='POST'&&p==='/api/album/delete'){
   if(typeof q.id!=='string'||!ID.test(q.id)||st.photos.indexOf(q.id)<0){reply(404,{error:'not found'});return true;}
   try{var next={enabled:st.enabled,seconds:st.seconds,random:st.random,transition:st.transition,motion:st.motion,intensity:st.intensity,speed:st.speed,photos:st.photos.filter(function(id){return id!==q.id;})},ok=save(next);try{fs.unlinkSync(path.join(dir,q.id+'.jpg'));}catch(e){}reply(200,{ok:true,published:ok});}catch(e){reply(500,{error:'save failed'});}return true;
  }
  if(m==='POST'&&p==='/api/album/upload'){
   if(st.photos.length>=MAX){reply(409,{error:'album full'});return true;}
   var chunks=[],size=0,done=false;req.on('data',function(d){if(done)return;size+=d.length;if(size>LIMIT){done=true;chunks=[];reply(413,{error:'too large'});return;}chunks.push(d);});
   req.on('end',function(){if(done)return;done=true;if(!allowed()||(authorized&&!authorized())){reply(403,{error:'key or service changed'});return;}if(st.photos.length>=MAX){reply(409,{error:'album full'});return;}var buf=Buffer.concat(chunks);if(!jpeg(buf)){reply(400,{error:'invalid JPEG'});return;}var id=crypto.randomBytes(12).toString('hex'),src=path.join(dir,id+'.jpg');try{atomic(src,buf,384);var ok=save({enabled:st.enabled,seconds:st.seconds,random:st.random,transition:st.transition,motion:st.motion,intensity:st.intensity,speed:st.speed,photos:st.photos.concat(id)});reply(201,{id:id,published:ok});}catch(e){if(st.photos.indexOf(id)<0)try{fs.unlinkSync(src);}catch(x){}reply(500,{error:'save failed'});}});return true;
  }
  reply(405,{error:'method'});return true;
 }
 function localRoute(req,res,u,json){
  if(u.pathname!=='/api/album-local')return false;
  var local=/^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress||''),origin=req.headers.origin;
  if(!local||!allowed()||(origin&&origin!=='null')){json(res,403,{error:'local only'});return true;}
  var headers={'Access-Control-Allow-Origin':'null','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  function reply(c,v){json(res,c,v,headers);}
  if(req.method==='OPTIONS'){reply(204,{});return true;}
  if(req.method!=='POST'){reply(405,{error:'method'});return true;}
  var chunks=[],size=0,done=false;
  req.on('data',function(d){if(done)return;size+=d.length;if(size>2048){done=true;chunks=[];reply(413,{error:'too large'});return;}chunks.push(d);});
  req.on('end',function(){if(done)return;done=true;if(!allowed()){reply(503,{error:'disabled'});return;}try{
   var v=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(!v||v.token!==localToken){reply(403,{error:'token'});return;}
   var q={},p;
   if(v.action==='delete'&&v.confirm===true){p='/api/album/delete';q.id=v.id;}
   else if(v.action==='move'){p='/api/album/move';q.id=v.id;q.direction=v.direction;}
   else if(v.action==='settings'){
    var next=settings(st),k=v.field,val=v.value;
    if(k==='enabled'||k==='random'){if(typeof val!=='boolean')throw Error('bad boolean');}
    else if(k==='seconds'){if(TIMES.indexOf(val)<0)throw Error('bad time');}
    else if(k==='intensity'){if(['light','medium'].indexOf(val)<0)throw Error('bad intensity');}
    else throw Error('bad field');
    next[k]=val;next.photos=st.photos.slice();reply(200,{ok:true,published:save(next)});return;
   }else throw Error('bad action');
   route({method:'POST'},res,{pathname:p,query:q},function(r,c,v){reply(c,v);},null,null);
  }catch(e){reply(400,{error:'invalid request'});}});return true;
 }
 return {route:route,publish:publish,localRoute:localRoute};
}
module.exports={create:create,settings:settings,jpeg:jpeg};
