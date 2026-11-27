'use strict';
var fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert'),EventEmitter=require('events').EventEmitter,album=require('../tv/idle-album.js'),remote=require('../tv/remote-settings.js');
var dir=fs.mkdtempSync(path.join(os.tmpdir(),'infiniti-album-test-')),dest=path.join(dir,'app');fs.mkdirSync(dest);
var allowed=true,auth=true,log=function(){};
function run(service,method,p,q,body,isRemote,local){var req=new EventEmitter(),out=null;req.method=method;req.socket={remoteAddress:local?'127.0.0.1':'192.168.1.10'};req.headers={};var json=function(res,c,v){out={code:c,value:v};},send=function(res,c,t,v){out={code:c,value:v};};assert.equal(service.route(req,{}, {pathname:p,query:q||{}},json,isRemote?true:send,function(){return auth;}),true);if(body!==undefined){req.emit('data',Buffer.isBuffer(body)?body:Buffer.from(body));req.emit('end');}assert.ok(out,'response expected: '+p);return out;}
try{
 var a=album.create(dir,function(){return dest;},function(){return allowed;},log);
 assert.equal(run(a,'POST','/api/album/settings',{enabled:'1',seconds:'3600',random:'1',transition:'cinema',motion:'pan'}).code,200);
 ['',' ','0.0', ['0'], null].forEach(function(seconds){assert.equal(run(a,'POST','/api/album/settings',{enabled:'1',seconds:seconds,random:'0'}).code,400);});
 assert.equal(run(a,'POST','/api/album/settings',{enabled:['1'],seconds:'30',random:'0'}).code,400);
 var pic=Buffer.from([255,216,1,2,255,217]);var uploaded=run(a,'POST','/api/album/upload',{},pic);assert.equal(uploaded.code,201);var id=uploaded.value.id;
 assert.ok(fs.existsSync(path.join(dest,'idle-photo-'+id+'.jpg')));
 var state=run(a,'GET','/api/album').value;assert.equal(state.transition,'cinema');assert.equal(state.motion,'pan');assert.equal(state.seconds,3600);assert.equal(state.photos.length,1);
 auth=false;assert.equal(run(a,'POST','/api/album/upload',{},pic).code,403);auth=true;
 assert.equal(run(a,'POST','/api/album/upload',{},Buffer.from('invalid')).code,400);
 assert.equal(run(a,'POST','/api/album/settings',{enabled:'1',seconds:'3600',random:'1',transition:'invalid'}).code,400);
 var id2=run(a,'POST','/api/album/upload',{},pic).value.id;
 assert.equal(run(a,'POST','/api/album/move',{id:id,direction:'up'}).code,409);
 assert.equal(run(a,'POST','/api/album/move',{id:id,direction:'down'}).code,200);
 assert.deepStrictEqual(run(a,'GET','/api/album').value.photos,[id2,id]);
 assert.equal(run(a,'POST','/api/album/settings',{enabled:'1',seconds:'3600',random:'0',intensity:'medium'}).code,200);
 assert.equal(run(a,'POST','/api/album/settings',{enabled:'1',seconds:'3600',random:'0',intensity:'invalid'}).code,400);
 var restored=album.create(dir,function(){return dest;},function(){return allowed;},log);assert.equal(run(restored,'GET','/api/album').value.photos[0],id2);assert.equal(run(restored,'GET','/api/album').value.intensity,'medium');
 assert.equal(run(restored,'POST','/api/album/delete',{id:id}).code,200);assert.ok(!fs.existsSync(path.join(dest,'idle-photo-'+id+'.jpg')));assert.equal(run(restored,'GET','/api/album').value.transition,'cinema');
 var cfg=JSON.parse(fs.readFileSync(path.join(dest,'idle-album.js'),'utf8').replace(/^window\.INFINITI_IDLE_ALBUM = /,'').replace(/;\s*$/,''));
 function localAlbum(v,ip,origin){var req=new EventEmitter(),out;req.method='POST';req.socket={remoteAddress:ip||'127.0.0.1'};req.headers={origin:origin||'null'};assert.equal(restored.localRoute(req,{}, {pathname:'/api/album-local'},function(res,c,v){out={code:c,value:v};}),true);req.emit('data',Buffer.from(JSON.stringify(v)));req.emit('end');return out;}
 var token=cfg.localToken;assert.equal(token.length,48);
 assert.equal(localAlbum({token:token,action:'settings',field:'seconds',value:30},'192.168.1.10').code,403);
 assert.equal(localAlbum({token:token,action:'settings',field:'seconds',value:30},'127.0.0.1','https://example.com').code,403);
 assert.equal(localAlbum({token:'bad',action:'settings',field:'seconds',value:30}).code,403);
 assert.equal(localAlbum({token:token,action:'settings',field:'command',value:'reboot'}).code,400);
 assert.equal(localAlbum({token:token,action:'delete',id:id2}).code,400);
 assert.equal(localAlbum({token:token,action:'settings',field:'seconds',value:30}).code,200);
 assert.equal(run(restored,'GET','/api/album').value.seconds,30);
 assert.equal(localAlbum({token:token,action:'delete',id:id2,confirm:true}).code,200);
 assert.equal(run(restored,'GET','/api/album').value.photos.length,0);
 fs.writeFileSync(path.join(dir,'idle-album','album.json'),JSON.stringify({enabled:true,seconds:30,photos:{bad:true}}));
 var corrupt=album.create(dir,function(){return dest;},function(){return allowed;},log);
 assert.deepStrictEqual(run(corrupt,'GET','/api/album').value.photos,[]);
 assert.equal(run(corrupt,'POST','/api/album/upload',{},pic).code,201);
 assert.equal(run(corrupt,'GET','/api/album').value.photos.length,1);
 fs.writeFileSync(path.join(dest,'apps.js'),'window.TV_APPS = {"apps":[{"id":"netflix","title":"Netflix"}]};\n');
 var m=remote.create(dir,function(){return dest;},function(){return allowed;},log);
 assert.equal(run(m,'POST','/api/remote-set',{},JSON.stringify({idleEffect:'snow','app:netflix:pinned':true,weatherUnit:'fahrenheit'}),true).code,202);
 assert.equal(run(m,'POST','/api/remote-set',{},JSON.stringify({'app:unknown:title':'no'}),true).code,400);
 auth=false;assert.equal(run(m,'POST','/api/remote-set',{},JSON.stringify({idleEffect:'rain'}),true).code,403);auth=true;
 assert.equal(run(m,'GET','/api/remote-state',{},undefined,true).value.revision,1);
 var inbox=JSON.parse(fs.readFileSync(path.join(dest,'remote-inbox.js'),'utf8').replace(/^window\.INFINITI_REMOTE_INBOX = /,'').replace(/;\s*$/,''));
 function ack(rev,local){return run(m,'POST','/api/remote-ack',{},JSON.stringify({token:inbox.token,revision:rev,values:{idleEffect:'snow'}}),true,local);}
 assert.equal(ack(1,false).code,403);
 assert.equal(ack(0.5,true).code,400);
 assert.equal(ack(1,true).code,200);
 assert.equal(ack(0,true).code,409);
 assert.equal(run(m,'GET','/api/remote-state',{},undefined,true).value.applied,1);
 assert.equal(run(m,'GET','/api/remote-state',{},undefined,true).value.pending.length,0);
 console.log('Album persistence, delete, preference validation and in-flight authentication tests passed.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
