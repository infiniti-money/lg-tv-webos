/* Poll the authenticated local mailbox while the Launcher is visible. ES5. */
(function(root){
'use strict';
var p=root.INFINITI_PREFS,life=root.INFINITI_LIFECYCLE,timer=null,busy=false,serial=0;
if(!p)return;
var applied=0;
try{applied=Number(localStorage.getItem('tvhome.remote.revision'))||0;}catch(e){}
var appearance=['theme','font','idleSeconds','idleEffect','largeText','showWeek','reduceMotion','showSolar','showLunar','idleRain'];
function covered(){return life?life.isCovered():!!document.hidden;}
function snapshot(){
 var v=p.getAppearance(),out={pack:p.getIconPack()};
 appearance.forEach(function(k){out[k]=v[k];});
 ((root.TV_APPS||{}).apps||[]).slice(0,250).forEach(function(a){if(!a||p.isProtected(a.id))return;var s=p.getAppStyle(a.id),k='app:'+a.id+':';out[k+'title']=s.title;out[k+'icon']=/^pack:/.test(s.icon)||s.icon==='original'?s.icon:'';out[k+'visible']=p.isVisible(a.id,(root.CONFIG||{}).hiddenApps||[]);});
 return out;
}
function apply(inbox){
 var delta={},apps={},changed=false,style=false,keys=Object.keys(inbox.changes||{}).sort(function(x,y){return inbox.changes[x].rev-inbox.changes[y].rev;});
 for(var i=0;i<keys.length;i++){var k=keys[i],e=inbox.changes[k];if(e.rev<=applied)continue;
 if(appearance.indexOf(k)>=0){delta[k]=e.value;style=true;}
 else if(k==='pack'){if(!p.setIconPack(e.value))throw Error('pack');changed=true;}
 else {var m=/^app:(.+):(title|icon|visible)$/.exec(k);if(!m||p.isProtected(m[1]))continue;
 var id=m[1];if(m[2]==='visible'){if(!p.setVisible(id,e.value))throw Error('visibility');changed=true;}
 else {var s=apps[id]||p.getAppStyle(id);s[m[2]]=e.value;apps[id]=s;}}
 }
 if(style)p.saveAppearance(delta);
 Object.keys(apps).forEach(function(id){var s=apps[id];if(!p.saveAppStyle(id,s.title,s.icon))throw Error('app style');changed=true;});
 if(style||changed){if(root.INFINITI_REMOTE_REFRESH)root.INFINITI_REMOTE_REFRESH(style,changed);}
 localStorage.setItem('tvhome.remote.revision',String(inbox.revision));applied=inbox.revision;
}
function ack(inbox){
 if(covered())return;
 var x=new XMLHttpRequest();try{x.open('POST','http://127.0.0.1:8090/api/remote-ack',true);x.timeout=4000;x.setRequestHeader('X-Infiniti-Remote',inbox.token);x.setRequestHeader('Content-Type','application/json');x.send(JSON.stringify({revision:applied,values:snapshot()}));}catch(e){}
}
function poll(){
 if(document.body.classList.contains('launcher-covered')||covered()||busy||(root.INFINITI_CUSTOMIZE_IS_OPEN&&root.INFINITI_CUSTOMIZE_IS_OPEN())||(root.INFINITI_REMOTE_CAN_APPLY&&!root.INFINITI_REMOTE_CAN_APPLY()))return;
 busy=true;var n=++serial,s=document.createElement('script'),timeout;
 function done(){clearTimeout(timeout);if(s.parentNode)s.parentNode.removeChild(s);busy=false;}
 root.INFINITI_REMOTE_INBOX=null;
 s.src='remote-inbox.js?t='+Date.now();
 s.onload=function(){if(n!==serial)return;var inbox=root.INFINITI_REMOTE_INBOX;done();
 if(covered()||!inbox||!/^[a-f0-9]{48}$/.test(inbox.token)||typeof inbox.revision!=='number'||inbox.revision<0)return;
 if((root.INFINITI_CUSTOMIZE_IS_OPEN&&root.INFINITI_CUSTOMIZE_IS_OPEN())||(root.INFINITI_REMOTE_CAN_APPLY&&!root.INFINITI_REMOTE_CAN_APPLY()))return;
 try{if(inbox.revision>applied)apply(inbox);else if(inbox.revision<applied){localStorage.setItem('tvhome.remote.revision','0');applied=0;return;}ack(inbox);}catch(e){}
 };
 s.onerror=function(){if(n===serial)done();};
 timeout=setTimeout(function(){if(n===serial){serial++;done();}},4000);document.body.appendChild(s);
}
function start(){if(timer!==null||covered())return;poll();timer=setInterval(poll,8000);}
function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
if(life)life.subscribe(function(hidden){if(hidden)stop();else start();});
else document.addEventListener('visibilitychange',function(){if(covered())stop();else start();});
start();
})(window);
