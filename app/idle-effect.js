/* Legacy compositor fallback: use CSS by default; sample once to detect stalled animation. */
(function(root){
'use strict';
var timer=null,fallback=null,serial=0,mode='off',sheet=document.querySelector('#idleRain .rainSheet');
var duration={rain:1350,snow:12000,petals:17000,stars:45000,fireflies:24000,bubbles:19000,mist:36000};
function clear(){
 serial++;if(timer!==null){clearTimeout(timer);timer=null;}if(fallback!==null){clearInterval(fallback);fallback=null;}
 if(sheet){sheet.style.webkitAnimation='';sheet.style.animation='';sheet.style.webkitTransform='';sheet.style.transform='';sheet.style.backgroundPosition='';}mode='off';
}
function transform(){try{var s=root.getComputedStyle(sheet);return s.webkitTransform||s.transform||'none';}catch(e){return '';}}
function start(effect){
 clear();if(!sheet||!duration[effect])return;
 mode='css';var id=serial,first=transform();
 timer=setTimeout(function(){
  timer=null;if(id!==serial||!document.body.classList.contains('idle-home')||document.body.classList.contains('launcher-covered'))return;
  var later=transform();if(later&&later!=='none'&&later!==first)return;
  mode='fallback';sheet.style.webkitAnimation='none';sheet.style.animation='none';sheet.style.webkitTransform='none';sheet.style.transform='none';
  var begin=Date.now();function paint(){
   if(id!==serial||!document.body.classList.contains('idle-home')||document.body.classList.contains('launcher-covered')||document.body.classList.contains('motion-reduced')){clear();return;}
   var fraction=((Date.now()-begin)%duration[effect])/duration[effect],reverse=effect==='fireflies'||effect==='bubbles';
   sheet.style.backgroundPosition=effect==='mist'?Math.round(fraction*480)+'px 0px':'0px '+Math.round((reverse?-1:1)*fraction*270)+'px';
  }paint();fallback=setInterval(paint,100);
 },800);
}
root.INFINITI_IDLE_EFFECT_START=start;root.INFINITI_IDLE_EFFECT_STOP=clear;root.INFINITI_IDLE_EFFECT_MODE=function(){return mode;};
})(window);
