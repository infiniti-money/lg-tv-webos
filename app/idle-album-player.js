/* Two bounded image layers, only while idle; no background timer otherwise. */
(function(root){
'use strict';
var active=false,seq=0,timer=null,index=-1,current='',layer=0,prefs=null,loaded=null,script=null,loadTimer=null,imageTimer=null,transitionTimer=null,lastStyle='',lastMotion='',appliedMotion='',motionTimer=null,motionStart=0,motionLayer=null,motionName='still',enterState=null,previewMode=false,previewOptions=null,failed={};
var allowed=[0,15,20,30,60,120,300,600,1800,3600,7200,21600,43200,86400,172800,604800],a=document.getElementById('idlePhotoA'),b=document.getElementById('idlePhotoB');
function clean(){stopMotion();enterState=null;if(transitionTimer!==null){clearTimeout(transitionTimer);transitionTimer=null;}if(imageTimer!==null){clearTimeout(imageTimer);imageTimer=null;}if(timer!==null){clearTimeout(timer);timer=null;}if(loadTimer!==null){clearTimeout(loadTimer);loadTimer=null;}if(script&&script.parentNode)script.parentNode.removeChild(script);script=null;if(loaded){loaded.onload=loaded.onerror=null;loaded.removeAttribute('src');loaded=null;}}
function clearLayer(el){el.className='idlePhoto';el.style.zIndex='0';el.style.opacity='';el.style.webkitAnimationDuration='';el.style.animationDuration='';el.style.webkitTransform='';el.style.transform='';el.firstChild.style.webkitTransform='';el.firstChild.style.transform='';el.firstChild.className='idlePhotoImage';el.firstChild.style.backgroundImage='';}
function stop(){previewMode=false;previewOptions=null;failed={};active=false;seq++;clean();[a,b].forEach(clearLayer);current='';index=-1;layer=0;appliedMotion='';prefs=null;}
var styles=["fade","slide-left","slide-right","slide-up","zoom-in","zoom-out","dissolve","cinema","slide-down","diagonal","soft-rotate","sweep","lift","focus","slide-nw","slide-ne","slide-sw","cross-zoom","swing-left","swing-right","drift-in","drop-in","curtain-lite","flip-lite"],motions=["zoom-in","zoom-out","pan-left","pan-right","pan-up","pan-down","pan-nw","pan-ne","pan-sw","pan-se","drift-horizontal","drift-vertical"];
function chooseStyle(pref,options,last,r){if(pref==='random-light')options=options.filter(function(x){return ['fade','dissolve','slide-left','slide-right','zoom-in','zoom-out','drift-in','pan-left','pan-right','pan-up','pan-down','drift-horizontal','drift-vertical'].indexOf(x)>=0;});else if(pref==='random-cinema')options=options.filter(function(x){return ['cinema','focus','cross-zoom','swing-left','swing-right','curtain-lite','drop-in'].indexOf(x)>=0;});else if(pref!=='random')return pref;if(!options.length)return last||'none';var available=options.filter(function(x){return x!==last;});if(!available.length)available=options;return available[Math.min(available.length-1,Math.max(0,Math.floor(r*available.length)))];}
function reduced(){return document.body.classList.contains('motion-reduced');}
function legacy(){var u=root.navigator&&root.navigator.userAgent||'',m=/Chrom(?:e|ium)\/([0-9]+)/.exec(u);return !!root.PalmSystem||!!(m&&Number(m[1])<=49);}
function transform(el,v){el.style.webkitTransform=v;el.style.transform=v;}
function stopMotion(){if(motionTimer!==null){clearInterval(motionTimer);motionTimer=null;}motionLayer=null;motionName='still';}
function motionTransform(name,p){var z=1.11,x=0,y=0;if(name==='zoom-in')z=1.03+.09*p;else if(name==='zoom-out')z=1.12-.09*p;else if(name==='pan-left')x=2.5-5*p;else if(name==='pan-right')x=-2.5+5*p;else if(name==='pan-up')y=2.5-5*p;else if(name==='pan-down')y=-2.5+5*p;else if(name==='pan-nw'){x=2-4*p;y=2-4*p;}else if(name==='pan-ne'){x=-2+4*p;y=2-4*p;}else if(name==='pan-sw'){x=2-4*p;y=-2+4*p;}else if(name==='pan-se'){x=-2+4*p;y=-2+4*p;}else if(name==='drift-horizontal'){z=1.06;x=1.4-2.8*p;}else if(name==='drift-vertical'){z=1.06;y=1.4-2.8*p;}else return '';return 'scale('+z.toFixed(4)+') translate('+x.toFixed(3)+'%,'+y.toFixed(3)+'%)';}
function entryTransform(kind,p){var q=1-p;switch(kind){case 'slide-left':return 'translateX('+(12*q)+'%)';case 'slide-right':return 'translateX('+(-12*q)+'%)';case 'slide-up':return 'translateY('+(12*q)+'%)';case 'zoom-in':return 'scale('+(1-.08*q)+')';case 'zoom-out':return 'scale('+(1+.14*q)+')';case 'cinema':return 'translateX('+(5*q)+'%) scale('+(1+.08*q)+')';case 'slide-down':return 'translateY('+(-12*q)+'%)';case 'diagonal':return 'translate('+(9*q)+'%,'+(9*q)+'%)';case 'soft-rotate':return 'rotate('+(-3*q)+'deg) scale('+(1+.1*q)+')';case 'sweep':return 'translateX('+(-18*q)+'%) scale('+(1+.04*q)+')';case 'lift':return 'translateY('+(7*q)+'%) scale('+(1-.04*q)+')';case 'focus':return 'scale('+(1+.20*q)+')';case 'slide-nw':return 'translate('+(10*q)+'%,'+(10*q)+'%)';case 'slide-ne':return 'translate('+(-10*q)+'%,'+(10*q)+'%)';case 'slide-sw':return 'translate('+(10*q)+'%,'+(-10*q)+'%)';case 'cross-zoom':return 'scale('+(1+.13*q)+')';case 'swing-left':return 'rotate('+(-5*q)+'deg) scale('+(1+.12*q)+')';case 'swing-right':return 'rotate('+(5*q)+'deg) scale('+(1+.12*q)+')';case 'drift-in':return 'translateX('+(5*q)+'%) scale('+(1+.03*q)+')';case 'drop-in':return 'translateY('+(-9*q)+'%) scale('+(1+.06*q)+')';case 'curtain-lite':return 'scaleX('+(1-.3*q)+')';case 'flip-lite':return 'scaleX('+(1-.15*q)+')';default:return '';}}
function tickMotion(){if(!active||document.hidden||document.body.classList.contains('launcher-covered')||!document.body.classList.contains('idle-home')){stopMotion();return;}var now=Date.now();if(reduced()){if(enterState){var e=enterState;enterState=null;e.front.style.opacity='';transform(e.front,'');clearLayer(e.back);}if(motionLayer)transform(motionLayer.firstChild,'');stopMotion();return;}
 if(motionLayer&&motionName!=='still'){var f=((now-motionStart)%64000)/32000;var p=f>1?2-f:f;transform(motionLayer.firstChild,motionTransform(motionName,p));}
 if(enterState){var s=enterState,p=Math.min(1,Math.max(0,(now-s.at)/s.speed)),ease=p*p*(3-2*p);s.front.style.opacity=String(s.kind==='dissolve'?ease*ease:ease);transform(s.front,entryTransform(s.kind,ease));if(p>=1){s.front.style.opacity='';transform(s.front,'');clearLayer(s.back);enterState=null;}}
 if(!enterState&&motionName==='still')stopMotion();}
function ensureMotion(){if(motionTimer===null)motionTimer=setInterval(tickMotion,100);tickMotion();}
function applyMotion(el,pref){var list=pref==='zoom'?motions.slice(0,2):pref==='pan'?motions.slice(2,10):pref==='drift'?motions.slice(10):motions;var m=pref==='still'||reduced()?'still':motions.indexOf(pref)>=0?pref:chooseStyle(pref==='random-light'?'random-light':'random',list,lastMotion,Math.random());if(legacy()){el.firstChild.className='idlePhotoImage';motionLayer=el;motionName=m;motionStart=Date.now();if(m==='still')transform(el.firstChild,'');else ensureMotion();}else el.firstChild.className='idlePhotoImage motion-'+m;lastMotion=m;appliedMotion=pref;}
function showPhoto(front,back,src,dim,n){
  clearLayer(front);front.style.zIndex='1';back.style.zIndex='0';
  front.firstChild.style.backgroundImage='linear-gradient(rgba(0,0,0,'+dim+'),rgba(0,0,0,'+dim+')),url("'+src+'")';
  var kind=reduced()?'none':chooseStyle(prefs.transition,styles,lastStyle,Math.random());lastStyle=kind;
  applyMotion(front,prefs.motion);
  front.className='idlePhoto shown';
  if(kind==='none'){clearLayer(back);return;}
  if(legacy()){enterState={front:front,back:back,kind:kind,at:Date.now(),speed:prefs.speed};ensureMotion();return;}
  front.className='idlePhoto shown album-enter-'+kind;front.style.webkitAnimationDuration=prefs.speed+'ms';front.style.animationDuration=prefs.speed+'ms';
  // Keep the previous photo fully visible until the new layer has entered.
  transitionTimer=setTimeout(function(){transitionTimer=null;if(!active||n!==seq)return;front.className='idlePhoto shown';clearLayer(back);},prefs.speed+150);
}
function nextIndex(n,i,random,r){if(n<=1)return 0;if(!random)return(i+1)%n;var j=Math.floor(r*(n-(i>=0?1:0)));return i>=0&&j>=i?j+1:j;}
function previous(){try{return JSON.parse(localStorage.getItem('tvhome.idleAlbum.last'))||{};}catch(e){return {};}}
function remember(id){try{localStorage.setItem('tvhome.idleAlbum.last',JSON.stringify({id:id,at:Date.now(),epoch:prefs.powerEpoch,seconds:prefs.seconds}));}catch(e){}}
function shouldAdvance(last,p,now){if(!last.id||p.photos.indexOf(last.id)<0||last.seconds!==p.seconds)return true;if(p.seconds===0)return !!p.powerEpoch&&last.epoch!==p.powerEpoch;return typeof last.at!=='number'||now<last.at||now-last.at>=p.seconds*1000;}
function schedule(n){if(active&&n===seq){var delay=previewMode?5000:60000;if(!previewMode&&prefs&&prefs.enabled&&prefs.photos.length&&prefs.seconds>0){var last=previous(),remaining=prefs.seconds*1000-(Date.now()-last.at);delay=Math.max(1000,Math.min(60000,isFinite(remaining)&&remaining>0?remaining:10000));}timer=setTimeout(function(){timer=null;read(n);},delay);}}
function render(n){
 if(!active||n!==seq)return;
 if(!prefs||(!previewMode&&!prefs.enabled)||!prefs.photos.length){stopMotion();enterState=null;[a,b].forEach(clearLayer);current='';schedule(n);return;}
 var last=previous(),advance=previewMode||shouldAdvance(last,prefs,Date.now());index=prefs.photos.indexOf(previewMode?current:last.id);var i=advance?nextIndex(prefs.photos.length,index,prefs.random,Math.random()):index,id=prefs.photos[i];
 if(failed[id]&&Date.now()-failed[id]<60000){var choices=prefs.photos.filter(function(x){return !failed[x]||Date.now()-failed[x]>=60000;});if(!choices.length){schedule(n);return;}id=choices[0];advance=true;}
 if(id===current&&(!previewMode||prefs.photos.length===1)){if(advance)remember(id);if(appliedMotion!==prefs.motion)applyMotion(layer===0?b:a,prefs.motion);schedule(n);return;}
 var src='idle-photo-'+id+'.jpg',im=new Image();loaded=im;
 im.onload=function(){if(!active||n!==seq||loaded!==im)return;clearTimeout(imageTimer);imageTimer=null;loaded=null;var dim=typeof CONFIG.wallpaperDim==='number'?Math.max(0,Math.min(.8,CONFIG.wallpaperDim)):.35,front=layer===0?a:b,back=layer===0?b:a;
 showPhoto(front,back,src,dim,n);layer=1-layer;current=id;delete failed[id];if(advance&&!previewMode)remember(id);schedule(n);};
 im.onerror=function(){if(active&&n===seq&&loaded===im){clearTimeout(imageTimer);imageTimer=null;loaded=null;failed[id]=Date.now();schedule(n);}};imageTimer=setTimeout(function(){if(loaded===im){im.onload=im.onerror=null;im.removeAttribute('src');loaded=null;imageTimer=null;failed[id]=Date.now();schedule(n);}},8000);im.src=src;
}
function read(n){
 if(!active||n!==seq)return;
 if(document.hidden||document.body.classList.contains('launcher-covered')||!document.body.classList.contains('idle-home')){stop();return;}
 if(script||loaded)return;
 var s=document.createElement('script');script=s;root.INFINITI_IDLE_ALBUM=null;s.src='idle-album.js?t='+Date.now();
 function finish(ok){if(script!==s)return;if(loadTimer!==null){clearTimeout(loadTimer);loadTimer=null;}if(s.parentNode)s.parentNode.removeChild(s);script=null;if(!active||n!==seq)return;
 var p=ok?root.INFINITI_IDLE_ALBUM:null;
 if(p&&Array.isArray(p.photos)&&allowed.indexOf(p.seconds)>=0){prefs={enabled:p.enabled===true,seconds:p.seconds,random:p.random===true,transition:["fade","slide-left","slide-right","slide-up","zoom-in","zoom-out","dissolve","cinema","slide-down","diagonal","soft-rotate","sweep","lift","focus","slide-nw","slide-ne","slide-sw","cross-zoom","swing-left","swing-right","drift-in","drop-in","curtain-lite","flip-lite","random","random-light","random-cinema","none"].indexOf(p.transition)>=0?p.transition:'random-light',motion:["still","zoom","pan","drift","random","random-light","zoom-in","zoom-out","pan-left","pan-right","pan-up","pan-down","pan-nw","pan-ne","pan-sw","pan-se","drift-horizontal","drift-vertical"].indexOf(p.motion)>=0?p.motion:'random-light',speed:[600,1100,1600].indexOf(p.speed)>=0?p.speed:1100,powerEpoch:typeof p.powerEpoch==='string'?p.powerEpoch:'',photos:p.photos.filter(function(id){return typeof id==='string'&&/^[a-f0-9]{24}$/.test(id);}).slice(0,20)};}else prefs=null;
 if(prefs&&previewMode&&previewOptions){if(previewOptions.transition)prefs.transition=previewOptions.transition;if(previewOptions.motion)prefs.motion=previewOptions.motion;}
 render(n);}
 s.onload=function(){finish(true);};s.onerror=function(){finish(false);};loadTimer=setTimeout(function(){finish(false);},4000);document.body.appendChild(s);
}
function previewSelection(options){var out={};if(options&&styles.indexOf(options.transition)>=0)out.transition=options.transition;if(options&&(motions.indexOf(options.motion)>=0||options.motion==='still'))out.motion=options.motion;return out;}
root.INFINITI_IDLE_ALBUM_PREVIEW_SELECTION=previewSelection;
root.INFINITI_IDLE_ALBUM_STYLES=function(){return styles.slice();};
root.INFINITI_IDLE_ALBUM_MOTIONS=function(){return motions.slice();};
root.INFINITI_IDLE_ALBUM_START=function(preview,options){stop();previewMode=preview===true;previewOptions=previewMode?previewSelection(options):null;active=true;read(seq);};
root.INFINITI_IDLE_ALBUM_NEXT=function(){if(!active||!previewMode||!prefs||prefs.photos.length<2||script||loaded||enterState||transitionTimer!==null)return false;if(timer!==null){clearTimeout(timer);timer=null;}read(seq);return true;};
root.INFINITI_IDLE_ALBUM_IS_PREVIEW=function(){return active&&previewMode;};
root.INFINITI_IDLE_ALBUM_STOP=stop;
root.INFINITI_IDLE_NEXT_INDEX=nextIndex;
root.INFINITI_IDLE_CHOOSE_STYLE=chooseStyle;
root.INFINITI_IDLE_MOTION_TRANSFORM=motionTransform;
root.INFINITI_IDLE_ENTRY_TRANSFORM=entryTransform;
root.INFINITI_IDLE_SHOULD_ADVANCE=shouldAdvance;
})(window);
