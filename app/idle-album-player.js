/* Two bounded image layers, only while idle; no background timer otherwise. */
(function(root){
'use strict';
var active=false,seq=0,timer=null,index=-1,current='',layer=0,prefs=null,loaded=null,script=null,loadTimer=null,imageTimer=null;
var allowed=[15,30,60,120,300,600],a=document.getElementById('idlePhotoA'),b=document.getElementById('idlePhotoB');
function clean(){if(imageTimer!==null){clearTimeout(imageTimer);imageTimer=null;}if(timer!==null){clearTimeout(timer);timer=null;}if(loadTimer!==null){clearTimeout(loadTimer);loadTimer=null;}if(script&&script.parentNode)script.parentNode.removeChild(script);script=null;if(loaded){loaded.onload=loaded.onerror=null;loaded=null;}}
function stop(){active=false;seq++;clean();[a,b].forEach(function(el){el.classList.remove('shown');el.style.backgroundImage='';});current='';index=-1;layer=0;}
function nextIndex(n,i,random,r){if(n<=1)return 0;if(!random)return(i+1)%n;var j=Math.floor(r*(n-(i>=0?1:0)));return i>=0&&j>=i?j+1:j;}
function schedule(n){if(active&&n===seq)timer=setTimeout(function(){timer=null;read(n);},prefs?prefs.seconds*1000:60000);}
function render(n){
 if(!active||n!==seq)return;
 if(!prefs||!prefs.enabled||!prefs.photos.length){[a,b].forEach(function(el){el.classList.remove('shown');el.style.backgroundImage='';});current='';schedule(n);return;}
 index=prefs.photos.indexOf(current);var i=nextIndex(prefs.photos.length,index,prefs.random,Math.random()),id=prefs.photos[i];
 if(id===current){schedule(n);return;}
 var src='idle-photo-'+id+'.jpg',im=new Image();loaded=im;
 im.onload=function(){if(!active||n!==seq||loaded!==im)return;clearTimeout(imageTimer);imageTimer=null;loaded=null;var dim=typeof CONFIG.wallpaperDim==='number'?Math.max(0,Math.min(.8,CONFIG.wallpaperDim)):.35,front=layer===0?a:b,back=layer===0?b:a;
 front.style.backgroundImage='linear-gradient(rgba(0,0,0,'+dim+'),rgba(0,0,0,'+dim+')),url("'+src+'")';front.style.zIndex='1';back.style.zIndex='1';front.classList.add('shown');back.classList.remove('shown');layer=1-layer;current=id;schedule(n);};
 im.onerror=function(){if(active&&n===seq&&loaded===im){clearTimeout(imageTimer);imageTimer=null;loaded=null;schedule(n);}};imageTimer=setTimeout(function(){if(loaded===im){im.onload=im.onerror=null;loaded=null;imageTimer=null;schedule(n);}},8000);im.src=src;
}
function read(n){
 if(!active||n!==seq)return;
 var s=document.createElement('script');script=s;root.INFINITI_IDLE_ALBUM=null;s.src='idle-album.js?t='+Date.now();
 function finish(ok){if(script!==s)return;if(loadTimer!==null){clearTimeout(loadTimer);loadTimer=null;}if(s.parentNode)s.parentNode.removeChild(s);script=null;if(!active||n!==seq)return;
 var p=ok?root.INFINITI_IDLE_ALBUM:null;
 if(p&&Array.isArray(p.photos)&&allowed.indexOf(p.seconds)>=0){prefs={enabled:p.enabled===true,seconds:p.seconds,random:p.random===true,photos:p.photos.filter(function(id){return typeof id==='string'&&/^[a-f0-9]{24}$/.test(id);}).slice(0,20)};}else prefs=null;
 render(n);}
 s.onload=function(){finish(true);};s.onerror=function(){finish(false);};loadTimer=setTimeout(function(){finish(false);},4000);document.body.appendChild(s);
}
root.INFINITI_IDLE_ALBUM_START=function(){stop();active=true;read(seq);};
root.INFINITI_IDLE_ALBUM_STOP=stop;
root.INFINITI_IDLE_NEXT_INDEX=nextIndex;
})(window);
