/* Typed LAN settings mailbox. No shell, arbitrary paths or executable input. */
'use strict';
var fs=require('fs'),path=require('path'),crypto=require('crypto'),own=Object.prototype.hasOwnProperty;
var fields={theme:['midnight','ocean','amber'],font:['lexend','sans','serif'],idleSeconds:[0,30,60,120,300],idleEffect:["rain","snow","petals","stars","fireflies","bubbles","mist","leaves","sparkles","meteor","aurora","embers","waves","hearts","random","random-light"],pack:['original','minimal','neon','glass','pastel','gold'],largeText:true,showWeek:true,reduceMotion:true,showSolar:true,showLunar:true,idleRain:true,weatherUnit:['celsius','fahrenheit']};
var packs=['minimal','neon','glass','pastel','gold'],glyphs=['video','music','web','tv','game','settings','home','photo','apps','youtube','netflix','prime','disney','tiktok','jellyfin','spotify','radio','hdmi','store','files','network'];
function idOK(id){return typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,159}$/.test(id)&&id!=='constructor'&&id!=='prototype'&&id!=='com.infinitimoney.tvhome'&&id!=='com.webos.app.livetv'&&!/^com\.webos\.app\.hdmi[0-9]+$/.test(id);}
function iconOK(v){if(v===''||v==='original')return true;var a=typeof v==='string'?v.split(':'):[];return a.length===3&&a[0]==='pack'&&packs.indexOf(a[1])>=0&&glyphs.indexOf(a[2])>=0;}
function validate(k,v){if(k==='appOrder')return Array.isArray(v)&&v.length<=250&&v.every(function(id,i){return idOK(id)&&v.indexOf(id)===i;});if(k==='weatherEnabled')return typeof v==='boolean';if(k==='weatherLocation')return obj(v)&&typeof v.latitude==='number'&&isFinite(v.latitude)&&v.latitude>=-90&&v.latitude<=90&&typeof v.longitude==='number'&&isFinite(v.longitude)&&v.longitude>=-180&&v.longitude<=180&&typeof v.place==='string'&&v.place.length<=90&&!/[\x00-\x1f\x7f]/.test(v.place)&&Object.keys(v).length===3;if(own.call(fields,k))return fields[k]===true?typeof v==='boolean':fields[k].indexOf(v)>=0;
 var m=/^app:(.+):(title|icon|visible|pinned)$/.exec(k);if(!m||!idOK(m[1]))return false;
 return (m[2]==='visible'||m[2]==='pinned')?typeof v==='boolean':m[2]==='title'?typeof v==='string'&&v.length<=48&&!/[\x00-\x1f\x7f]/.test(v):iconOK(v);}
function obj(v){return v&&typeof v==='object'&&!Array.isArray(v);}
function create(dir,appDir,allowed,log){
 var store=path.join(dir,'remote-settings.json'),token=crypto.randomBytes(24).toString('hex'),snap=null,seen=0,data={revision:0,changes:{}};
 try{var d=JSON.parse(fs.readFileSync(store,'utf8'));if(obj(d)&&typeof d.revision==='number'&&d.revision>=0&&d.revision<9007199254740000&&Math.floor(d.revision)===d.revision&&obj(d.changes)){data.revision=d.revision;Object.keys(d.changes).slice(0,800).forEach(function(k){var e=d.changes[k];if(obj(e)&&typeof e.rev==='number'&&e.rev>0&&e.rev<=d.revision&&validate(k,e.value))data.changes[k]=e;});}}catch(e){}
 function write(f,s,mode){var tmp=f+'.remote-'+process.pid;fs.writeFileSync(tmp,s,{mode:mode});fs.renameSync(tmp,f);}
 function publish(){if(!allowed())return;try{var f=path.join(appDir(),'remote-inbox.js'),s='window.INFINITI_REMOTE_INBOX = '+JSON.stringify({revision:data.revision,changes:data.changes,token:token}).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n';try{if(fs.readFileSync(f,'utf8')===s)return;}catch(e){}write(f,s,420);}catch(e){log('remote bridge: '+e.message);}}
 function catalog(){try{var s=fs.readFileSync(path.join(appDir(),'apps.js'),'utf8'),m=/window\.TV_APPS\s*=\s*([\s\S]*);\s*$/.exec(s);return m?(JSON.parse(m[1]).apps||[]).filter(function(a){return a&&idOK(a.id);}).slice(0,250).map(function(a){return{id:a.id,title:String(a.title||a.id).slice(0,100)};}):[];}catch(e){return [];}}
 function commit(changes){if(!obj(changes))throw Error('bad data');var ks=Object.keys(changes),ids=catalog().map(function(a){return a.id;});if(!ks.length||ks.length>40)throw Error('bad count');ks.forEach(function(k){if(!validate(k,changes[k]))throw Error('bad field');if(k==='appOrder'&&changes[k].some(function(id){return ids.indexOf(id)<0;}))throw Error('unknown app');var m=/^app:(.+):(title|icon|visible|pinned)$/.exec(k);if(m&&ids.indexOf(m[1])<0)throw Error('unknown app');});var n={revision:data.revision+1,changes:{}};Object.keys(data.changes).forEach(function(k){n.changes[k]=data.changes[k];});ks.forEach(function(k){n.changes[k]={rev:n.revision,value:changes[k]};});if(Object.keys(n.changes).length>800||!allowed())throw Error('disabled or full');write(store,JSON.stringify(n),384);data=n;publish();return n.revision;}
 function body(req,res,limit,send,cb){var chunks=[],len=0,done=false;req.on('data',function(d){if(done)return;len+=d.length;if(len>limit){done=true;chunks=[];send(413,{error:'too large'});return;}chunks.push(d);});req.on('end',function(){if(done)return;done=true;if(!allowed())return send(503,{error:'disabled'});try{cb(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch(e){send(400,{error:'invalid request'});}});}
 function route(req,res,url,json,authenticated,authorized){
  var p=url.pathname,m=req.method,local=/^(127\.0\.0\.1|::1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress||'');
  function send(code,v){json(res,code,v);}
  if(p==='/api/remote-ack'){
    if(!local||!allowed()) {send(403,{error:'local only'});return true;}
    var origin=req.headers.origin;
    if(origin&&origin!=='null'){send(403,{error:'origin'});return true;}
    var headers={'Access-Control-Allow-Origin':'null','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'X-Infiniti-Remote, Content-Type'};
    if(m==='OPTIONS'){json(res,204,{},headers);return true;}
    if(m!=='POST'){send(403,{error:'method'});return true;}
    body(req,res,150000,function(c,v){json(res,c,v,headers);},function(v){
      if(!obj(v)||(v.token!==token&&req.headers['x-infiniti-remote']!==token)){json(res,403,{error:'token'},headers);return;}
      if(typeof v.revision!=='number'||v.revision<0||Math.floor(v.revision)!==v.revision||v.revision>data.revision||!obj(v.values))throw Error('bad ack');
      if(snap&&v.revision<snap.revision){json(res,409,{error:'stale ack'},headers);return;}
      var clean={};Object.keys(v.values).slice(0,800).forEach(function(k){if(validate(k,v.values[k]))clean[k]=v.values[k];});
      var idle=null;if(obj(v.idle)){var d=v.idle;idle={active:d.active===true,covered:d.covered===true,eligible:d.eligible===true,enabled:d.enabled===true,reduceMotion:d.reduceMotion===true,engine:['css','fallback','off'].indexOf(d.engine)>=0?d.engine:'off',effect:fields.idleEffect.indexOf(d.effect)>=0?d.effect:'rain',actualEffect:fields.idleEffect.indexOf(d.actualEffect)>=0?d.actualEffect:'',seconds:fields.idleSeconds.indexOf(d.seconds)>=0?d.seconds:60};}
      snap={revision:v.revision,values:clean,idle:idle};seen=Date.now();json(res,200,{ok:true},headers);
    });return true;
  }
  if(p!=='/api/remote-state'&&p!=='/api/remote-set')return false;
  if(!authenticated){send(403,{error:'key'});return true;}
  if(m==='GET'&&p==='/api/remote-state'){send(200,{revision:data.revision,applied:snap?snap.revision:null,online:Date.now()-seen<25000,idle:snap?snap.idle:null,values:snap?snap.values:{},queuedValues:Object.keys(data.changes).reduce(function(out,k){if(!snap||data.changes[k].rev>snap.revision)out[k]=data.changes[k].value;return out;},{}),apps:catalog(),pending:Object.keys(data.changes).filter(function(k){return !snap||data.changes[k].rev>snap.revision;})});return true;}
  if(m==='POST'&&p==='/api/remote-set'){body(req,res,24000,send,function(v){if(authorized&&!authorized())return send(403,{error:'key or service changed'});send(202,{revision:commit(v),queued:true});});return true;}
  send(405,{error:'method'});return true;
 }
 return {publish:publish,route:route,commit:commit};
}
module.exports={create:create,validate:validate,idOK:idOK};
