/* Legacy webOS foreground idle effects: one tiled layer with an explicit bounded JS renderer. */
(function(root){
'use strict';
var timer=null,fallback=null,serial=0,mode='off',sheet=document.querySelector('#idleRain .rainSheet');
var layer=document.querySelector('#idleRain'),duration={rain:1350,snow:12000,petals:17000,stars:45000,fireflies:24000,bubbles:19000,mist:36000,leaves:19000,sparkles:21000,meteor:6500,aurora:45000,embers:14500,waves:30000,hearts:22000};
function permitted(){return document.body.classList.contains('idle-home')&&!document.body.classList.contains('launcher-covered')&&!document.body.classList.contains('motion-reduced')&&!document.hidden;}
function clear(){
 serial++;if(timer!==null){clearTimeout(timer);timer=null;}if(fallback!==null){clearInterval(fallback);fallback=null;}
 if(sheet){sheet.style.webkitAnimation='';sheet.style.animation='';sheet.style.webkitTransform='';sheet.style.transform='';sheet.style.backgroundPosition='';sheet.style.backgroundImage='';sheet.style.opacity='';}
 if(layer)layer.style.display='';mode='off';
}
function transform(){try{var s=root.getComputedStyle(sheet);return s.webkitTransform||s.transform||'none';}catch(e){return '';}}
function legacy(){var u=root.navigator&&root.navigator.userAgent||'',m=/Chrom(?:e|ium)\/([0-9]+)/.exec(u);return !!root.PalmSystem||!!(m&&Number(m[1])<=49);}
function paintJS(effect,id){
 if(id!==serial||!permitted())return;
 mode='fallback';
 if(layer)layer.style.display='block';
 sheet.style.backgroundImage='url("icons/'+(effect==='rain'?'rain-tile':'idle-'+effect)+'.svg")';
 sheet.style.opacity=effect==='rain'?'.85':'.78';
 sheet.style.webkitAnimation='none';sheet.style.animation='none';sheet.style.webkitTransform='none';sheet.style.transform='none';
 var begin=Date.now();function paint(){
  if(id!==serial||!permitted()){clear();return;}
  var fraction=((Date.now()-begin)%duration[effect])/duration[effect],reverse=['fireflies','bubbles','embers','hearts'].indexOf(effect)>=0;
  var x=['mist','aurora','waves','leaves','meteor'].indexOf(effect)>=0?Math.round(fraction*480):0,y=['mist','aurora','waves'].indexOf(effect)>=0?0:Math.round((reverse?-1:1)*fraction*270);sheet.style.backgroundPosition=x+'px '+y+'px';
 }
 paint();if(mode==='fallback')fallback=setInterval(paint,100);
}
function start(effect){
 clear();if(!sheet||!Object.prototype.hasOwnProperty.call(duration,effect)||!permitted())return;
 var id=serial;
 // Native legacy webOS uses explicit background position updates; do not trust
 // a moving computed transform as evidence that the compositor repainted.
 if(legacy()){paintJS(effect,id);return;}
 mode='css';var first=transform();
 timer=setTimeout(function(){timer=null;if(id!==serial||!permitted())return;var later=transform();if(later&&later!=='none'&&later!==first)return;paintJS(effect,id);},800);
}
root.INFINITI_IDLE_EFFECT_START=start;root.INFINITI_IDLE_EFFECT_STOP=clear;root.INFINITI_IDLE_EFFECT_MODE=function(){return mode;};
})(window);
