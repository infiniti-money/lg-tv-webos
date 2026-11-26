/* Two bounded image layers, only while idle; no background timer otherwise. */
(function(root){
'use strict';
var active=false,seq=0,timer=null,index=-1,current='',layer=0,prefs=null,loaded=null,script=null,loadTimer=null,imageTimer=null,transitionTimer=null,lastStyle='',lastMotion='',appliedMotion='',motionTimer=null,motionStart=0,motionLayer=null,motionName='still',enterState=null;
var allowed=[0,15,30,60,120,300,600,1800,3600,7200,21600,43200,86400,172800,604800],a=document.getElementById('idlePhotoA'),b=document.getElementById('idlePhotoB');
function clean(){stopMotion();enterState=null;if(transitionTimer!==null){clearTimeout(transitionTimer);transitionTimer=null;}if(imageTimer!==null){clearTimeout(imageTimer);imageTimer=null;}if(timer!==null){clearTimeout(timer);timer=null;}if(loadTimer!==null){clearTimeout(loadTimer);loadTimer=null;}if(script&&script.parentNode)script.parentNode.removeChild(script);script=null;if(loaded){loaded.onload=loaded.onerror=null;loaded=null;}}
function clearLayer(el){el.className='idlePhoto';el.style.zIndex='0';el.style.opacity='';el.style.webkitTransform='';el.style.transform='';el.firstChild.style.webkitTransform='';el.firstChild.style.transform='';el.firstChild.className='idlePhotoImage';el.firstChild.style.backgroundImage='';}
function stop(){active=false;seq++;clean();[a,b].forEach(clearLayer);current='';index=-1;layer=0;appliedMotion='';}
var styles=["fade","slide-left","slide-right","slide-up","zoom-in","zoom-out","dissolve","cinema","slide-down","diagonal","soft-rotate","sweep","lift","focus"],motions=['zoom-in','zoom-out','pan-left','pan-right','pan-up','pan-down'];
function chooseStyle(pref,options,last,r){if(pref!=='random')return pref;var available=options.filter(function(x){return x!==last;});if(!available.length)available=options;return available[Math.min(available.length-1,Math.max(0,Math.floor(r*available.length)))];}
function reduced(){return document.body.classList.contains('motion-reduced');}
function legacy(){var u=root.navigator&&root.navigator.userAgent||'',m=/Chrom(?:e|ium)\/([0-9]+)/.exec(u);return !!root.PalmSystem||!!(m&&Number(m[1])<=49);}
function transform(el,v){el.style.webkitTransform=v;el.style.transform=v;}
function stopMotion(){if(motionTimer!==null){clearInterval(motionTimer);motionTimer=null;}motionLayer=null;motionName='still';}
function motionTransform(name,p){var z=1.11,x=0,y=0;if(name==='zoom-in')z=1.03+.09*p;else if(name==='zoom-out')z=1.12-.09*p;else if(name==='pan-left')x=2.5-5*p;else if(name==='pan-right')x=-2.5+5*p;else if(name==='pan-up')y=2.5-5*p;else if(name==='pan-down')y=-2.5+5*p;else return '';return 'scale('+z.toFixed(4)+') translate('+x.toFixed(3)+'%,'+y.toFixed(3)+'%)';}
function entryTransform(kind,p){var q=1-p;switch(kind){case 'slide-left':return 'translateX('+(12*q)+'%)';case 'slide-right':return 'translateX('+(-12*q)+'%)';case 'slide-up':return 'translateY('+(12*q)+'%)';case 'zoom-in':return 'scale('+(1-.08*q)+')';case 'zoom-out':return 'scale('+(1+.14*q)+')';case 'cinema':return 'translateX('+(5*q)+'%) scale('+(1+.08*q)+')';case 'slide-down':return 'translateY('+(-12*q)+'%)';case 'diagonal':return 'translate('+(9*q)+'%,'+(9*q)+'%)';case 'soft-rotate':return 'rotate('+(-3*q)+'deg) scale('+(1+.1*q)+')';case 'sweep':return 'translateX('+(-18*q)+'%) scale('+(1+.04*q)+')';case 'lift':return 'translateY('+(7*q)+'%) scale('+(1-.04*q)+')';case 'focus':return 'scale('+(1+.20*q)+')';default:return '';}}
function tickMotion(){if(!active||document.hidden||document.body.classList.contains('launcher-covered')||!document.body.classList.contains('idle-home')){stopMotion();return;}var now=Date.now();if(reduced()){if(enterState){var e=enterState;enterState=null;e.front.style.opacity='';transform(e.front,'');clearLayer(e.back);}if(motionLayer)transform(motionLayer.firstChild,'');stopMotion();return;}
 if(motionLayer&&motionName!=='still'){var f=((now-motionStart)%64000)/32000;var p=f>1?2-f:f;transform(motionLayer.firstChild,motionTransform(motionName,p));}
 if(enterState){var s=enterState,p=Math.min(1,Math.max(0,(now-s.at)/1100)),ease=p*p*(3-2*p);s.front.style.opacity=String(s.kind==='dissolve'?ease*ease:ease);transform(s.front,entryTransform(s.kind,ease));if(p>=1){s.front.style.opacity='';transform(s.front,'');clearLayer(s.back);enterState=null;}}
 if(!enterState&&motionName==='still')stopMotion();}
function ensureMotion(){if(motionTimer===null)motionTimer=setInterval(tickMotion,100);tickMotion();}
function applyMotion(el,pref){var list=pref==='zoom'?motions.slice(0,2):pref==='pan'?motions.slice(2):motions;var m=pref==='still'||reduced()?'still':chooseStyle('random',list,lastMotion,Math.random());if(legacy()){el.firstChild.className='idlePhotoImage';motionLayer=el;motionName=m;motionStart=Date.now();if(m==='still')transform(el.firstChild,'');else ensureMotion();}else el.firstChild.className='idlePhotoImage motion-'+m;lastMotion=m;appliedMotion=pref;}
function showPhoto(front,back,src,dim,n){
  clearLayer(front);front.style.zIndex='1';back.style.zIndex='0';
  front.firstChild.style.backgroundImage='linear-gradient(rgba(0,0,0,'+dim+'),rgba(0,0,0,'+dim+')),url("'+src+'")';
  var kind=reduced()?'none':chooseStyle(prefs.transition,styles,lastStyle,Math.random());lastStyle=kind;
  applyMotion(front,prefs.motion);
  front.className='idlePhoto shown';
  if(kind==='none'){clearLayer(back);return;}
  if(legacy()){enterState={front:front,back:back,kind:kind,at:Date.now()};ensureMotion();return;}
  front.className='idlePhoto shown album-enter-'+kind;
  // Keep the previous photo fully visible until the new layer has entered.
  transitionTimer=setTimeout(function(){transitionTimer=null;if(!active||n!==seq)return;front.className='idlePhoto shown';clearLayer(back);},1250);
}
function nextIndex(n,i,random,r){if(n<=1)return 0;if(!random)return(i+1)%n;var j=Math.floor(r*(n-(i>=0?1:0)));return i>=0&&j>=i?j+1:j;}
function previous(){try{return JSON.parse(localStorage.getItem('tvhome.idleAlbum.last'))||{};}catch(e){return {};}}
function remember(id){try{localStorage.setItem('tvhome.idleAlbum.last',JSON.stringify({id:id,at:Date.now(),epoch:prefs.powerEpoch,seconds:prefs.seconds}));}catch(e){}}
function shouldAdvance(last,p,now){if(!last.id||p.photos.indexOf(last.id)<0||last.seconds!==p.seconds)return true;if(p.seconds===0)return !!p.powerEpoch&&last.epoch!==p.powerEpoch;return typeof last.at!=='number'||now<last.at||now-last.at>=p.seconds*1000;}
function schedule(n){if(active&&n===seq){var delay=60000;if(prefs&&prefs.enabled&&prefs.photos.length&&prefs.seconds>0){var last=previous(),remaining=prefs.seconds*1000-(Date.now()-last.at);delay=Math.max(1000,Math.min(60000,isFinite(remaining)&&remaining>0?remaining:10000));}timer=setTimeout(function(){timer=null;read(n);},delay);}}
function render(n){
 if(!active||n!==seq)return;
 if(!prefs||!prefs.enabled||!prefs.photos.length){stopMotion();enterState=null;[a,b].forEach(clearLayer);current='';schedule(n);return;}
 var last=previous(),advance=shouldAdvance(last,prefs,Date.now());index=prefs.photos.indexOf(last.id);var i=advance?nextIndex(prefs.photos.length,index,prefs.random,Math.random()):index,id=prefs.photos[i];
 if(id===current){if(advance)remember(id);if(appliedMotion!==prefs.motion)applyMotion(layer===0?b:a,prefs.motion);schedule(n);return;}
 var src='idle-photo-'+id+'.jpg',im=new Image();loaded=im;
 im.onload=function(){if(!active||n!==seq||loaded!==im)return;clearTimeout(imageTimer);imageTimer=null;loaded=null;var dim=typeof CONFIG.wallpaperDim==='number'?Math.max(0,Math.min(.8,CONFIG.wallpaperDim)):.35,front=layer===0?a:b,back=layer===0?b:a;
 showPhoto(front,back,src,dim,n);layer=1-layer;current=id;if(advance)remember(id);schedule(n);};
 im.onerror=function(){if(active&&n===seq&&loaded===im){clearTimeout(imageTimer);imageTimer=null;loaded=null;schedule(n);}};imageTimer=setTimeout(function(){if(loaded===im){im.onload=im.onerror=null;loaded=null;imageTimer=null;schedule(n);}},8000);im.src=src;
}
function read(n){
 if(!active||n!==seq)return;
 var s=document.createElement('script');script=s;root.INFINITI_IDLE_ALBUM=null;s.src='idle-album.js?t='+Date.now();
 function finish(ok){if(script!==s)return;if(loadTimer!==null){clearTimeout(loadTimer);loadTimer=null;}if(s.parentNode)s.parentNode.removeChild(s);script=null;if(!active||n!==seq)return;
 var p=ok?root.INFINITI_IDLE_ALBUM:null;
 if(p&&Array.isArray(p.photos)&&allowed.indexOf(p.seconds)>=0){prefs={enabled:p.enabled===true,seconds:p.seconds,random:p.random===true,transition:styles.indexOf(p.transition)>=0||p.transition==='none'?p.transition:'random',motion:['still','zoom','pan','random'].indexOf(p.motion)>=0?p.motion:'random',powerEpoch:typeof p.powerEpoch==='string'?p.powerEpoch:'',photos:p.photos.filter(function(id){return typeof id==='string'&&/^[a-f0-9]{24}$/.test(id);}).slice(0,20)};}else prefs=null;
 render(n);}
 s.onload=function(){finish(true);};s.onerror=function(){finish(false);};loadTimer=setTimeout(function(){finish(false);},4000);document.body.appendChild(s);
}
root.INFINITI_IDLE_ALBUM_START=function(){stop();active=true;read(seq);};
root.INFINITI_IDLE_ALBUM_STOP=stop;
root.INFINITI_IDLE_NEXT_INDEX=nextIndex;
root.INFINITI_IDLE_CHOOSE_STYLE=chooseStyle;
root.INFINITI_IDLE_MOTION_TRANSFORM=motionTransform;
root.INFINITI_IDLE_ENTRY_TRANSFORM=entryTransform;
root.INFINITI_IDLE_SHOULD_ADVANCE=shouldAdvance;
})(window);
