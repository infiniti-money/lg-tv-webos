'use strict';
var assert=require('assert'),a=require('../tv/idle-album.js');
assert.equal(a.settings({seconds:30,random:true,enabled:true}).seconds,30);assert.equal(a.settings({seconds:1}).seconds,20);assert.equal(a.jpeg(Buffer.from([255,216,255,217])),true);assert.equal(a.jpeg(Buffer.from([255,216,0,0])),false);assert.equal(a.jpeg(Buffer.alloc(1500001)),false);
var vm=require('vm'),fs=require('fs'),root={},el={classList:{remove:function(){}}};vm.runInNewContext(fs.readFileSync('app/idle-album-player.js','utf8'),{window:root,document:{getElementById:function(){return el;}}});var n=root.INFINITI_IDLE_NEXT_INDEX;assert.equal(n(3,2,false,.5),0);assert.equal(n(3,1,true,0),0);assert.equal(n(3,1,true,.99),2);assert.equal(n(1,0,true,.9),0);console.log('Album limits and random next-photo selection passed.');

assert.ok(fs.readFileSync('tv/wallpaper-server.js','utf8').indexOf('remote.publish();album.publish();')>=0);
assert.ok(fs.readFileSync('app/index.html','utf8').indexOf('id="idleSignature">Designed by Tân Dev')>=0);

var advance=root.INFINITI_IDLE_SHOULD_ADVANCE,p={seconds:0,powerEpoch:'boot2',photos:['a','b']};assert.equal(advance({id:'a',seconds:0,epoch:'boot1'},p,100),true);assert.equal(advance({id:'a',seconds:0,epoch:'boot2'},p,100),false);p.seconds=86400;assert.equal(advance({id:'a',seconds:86400,at:0},p,86399999),false);assert.equal(advance({id:'a',seconds:86400,at:0},p,86400000),true);assert.equal(a.settings({seconds:0}).seconds,0);assert.equal(a.settings({seconds:604800}).seconds,604800);

assert.ok(fs.readFileSync('tv/idle-album.js','utf8').indexOf('now-lastPublish<30000')>=0);

var pick=root.INFINITI_IDLE_CHOOSE_STYLE;assert.equal(pick('random',['fade','zoom-in'],'fade',0),'zoom-in');assert.equal(pick('fade',['fade','zoom-in'],'fade',0),'fade');assert.equal(a.settings({transition:'bad',motion:'bad'}).transition,'random-light');assert.equal(a.settings({transition:'slide-left',motion:'pan'}).motion,'pan');
var albumCss=fs.readFileSync('app/style.css','utf8');["fade","slide-left","slide-right","slide-up","zoom-in","zoom-out","dissolve","cinema"].forEach(function(s){assert.ok(albumCss.indexOf('.album-enter-'+s)>=0);});assert.ok(albumCss.indexOf('.idlePhoto.shown .motion-pan-left')>=0);assert.ok(fs.readFileSync('tv/wallpaper.html','utf8').indexOf('id="albumTransition"')>=0);console.log('Album transition styles, motion modes and nonrepeating random selection passed.');

var mt=root.INFINITI_IDLE_MOTION_TRANSFORM,et=root.INFINITI_IDLE_ENTRY_TRANSFORM;assert.notEqual(mt('pan-left',0),mt('pan-left',1));assert.notEqual(mt('zoom-in',0),mt('zoom-in',1));assert.equal(mt('still',.5),'');assert.notEqual(et('slide-left',0),et('slide-left',1));assert.equal(et('fade',.5),'');

["slide-down","diagonal","soft-rotate","sweep","lift","focus"].forEach(function(s){assert.ok(albumCss.indexOf('.album-enter-'+s)>=0);assert.equal(a.settings({transition:s}).transition,s);assert.notEqual(root.INFINITI_IDLE_ENTRY_TRANSFORM(s,0),root.INFINITI_IDLE_ENTRY_TRANSFORM(s,1));});

["slide-nw","slide-ne","slide-sw","cross-zoom","swing-left","swing-right","drift-in","drop-in","curtain-lite","flip-lite"].forEach(function(s){assert.equal(a.settings({transition:s}).transition,s);assert.ok(albumCss.indexOf('.album-enter-'+s)>=0);assert.notEqual(et(s,0),et(s,1));});
["zoom-in","zoom-out","pan-left","pan-right","pan-up","pan-down","pan-nw","pan-ne","pan-sw","pan-se","drift-horizontal","drift-vertical"].forEach(function(s){assert.equal(a.settings({motion:s}).motion,s);assert.notEqual(mt(s,0),mt(s,1));});
assert.equal(a.settings({seconds:20,speed:600}).speed,600);assert.equal(a.settings({speed:17}).speed,1100);assert.equal(pick('random-light',['fade','slide-left','swing-left'],'fade',0),'slide-left');assert.equal(pick('random-cinema',['fade','cinema','focus'],'cinema',0),'focus');

var playerSource=fs.readFileSync('app/idle-album-player.js','utf8');assert.ok(playerSource.indexOf('if(advance&&!previewMode)remember(id)')>=0);assert.ok(playerSource.indexOf('previewMode?5000:60000')>=0);assert.ok(playerSource.indexOf('failed[id]=Date.now()')>=0);

assert.equal(root.INFINITI_IDLE_ALBUM_IS_PREVIEW(),false);assert.equal(root.INFINITI_IDLE_ALBUM_NEXT(),false);assert.ok(playerSource.indexOf('!previewMode||!prefs')>=0);assert.ok(fs.readFileSync('app/app.js','utf8').indexOf('e.keyCode===39&&window.INFINITI_IDLE_ALBUM_IS_PREVIEW')>=0);

assert.equal(root.INFINITI_IDLE_ALBUM_STYLES().length,24);assert.equal(root.INFINITI_IDLE_ALBUM_MOTIONS().length,12);assert.equal(root.INFINITI_IDLE_ALBUM_PREVIEW_SELECTION({transition:'fade',motion:'still'}).motion,'still');assert.equal(Object.keys(root.INFINITI_IDLE_ALBUM_PREVIEW_SELECTION({transition:'bad',motion:'bad'})).length,0);

assert.ok(playerSource.indexOf('loaded.removeAttribute(\'src\')')>=0);assert.ok(playerSource.indexOf('prefs.photos.length===1')>=0);assert.ok(playerSource.indexOf('if(script||loaded)return;')>=0);assert.ok(fs.readFileSync('app/index.html','utf8').indexOf('customizeAlbumBrowse')>=0);

/* Exercise actual player with deterministic fake DOM, image loading and timers. */
function harness(photos){
 var clock=1000,serial=0,tasks={},images=[],scripts=[],writes=[],win={},classes={'idle-home':true};
 function layer(){return {style:{},firstChild:{style:{}}};}
 var layers=[layer(),layer()],body={classList:{contains:function(k){return !!classes[k];}},appendChild:function(s){s.parentNode=body;scripts.push(s);},removeChild:function(s){s.parentNode=null;}};
 var doc={body:body,hidden:false,getElementById:function(id){return layers[id==='idlePhotoA'?0:1];},createElement:function(){return {};}};
 function later(fn,ms){tasks[++serial]={fn:fn,ms:ms};return serial;}
 function cancel(id){delete tasks[id];}
 function Image(){images.push(this);this.removeAttribute=function(){this.src='';};}
 var config={enabled:true,seconds:20,random:false,transition:'none',motion:'still',speed:600,photos:photos};
 vm.runInNewContext(playerSource,{window:win,document:doc,Image:Image,CONFIG:{},Date:{now:function(){return clock;}},localStorage:{getItem:function(){return null;},setItem:function(k,v){writes.push(v);}},setTimeout:later,clearTimeout:cancel,setInterval:later,clearInterval:cancel});
 function load(){win.INFINITI_IDLE_ALBUM=config;scripts[scripts.length-1].onload();}
 function photo(){images[images.length-1].onload();}
 function tick(ms){var k=Object.keys(tasks).filter(function(k){return tasks[k].ms===ms;})[0];assert.ok(k,'timer '+ms);var f=tasks[k].fn;delete tasks[k];clock+=ms;f();}
 return {win:win,config:config,load:load,photo:photo,tick:tick,images:images,writes:writes,tasks:tasks,doc:doc,layers:layers};
}
var idA='aaaaaaaaaaaaaaaaaaaaaaaa',idB='bbbbbbbbbbbbbbbbbbbbbbbb';
var h=harness([idA]);h.win.INFINITI_IDLE_ALBUM_START(true);h.load();h.photo();h.tick(5000);h.load();assert.equal(h.images.length,1);assert.equal(h.writes.length,0);h.win.INFINITI_IDLE_ALBUM_STOP();assert.equal(Object.keys(h.tasks).length,0);
h=harness([idA,idB]);h.win.INFINITI_IDLE_ALBUM_START(true,{manual:true,motion:'still'});h.load();h.photo();h.tick(60000);h.load();assert.equal(h.images.length,1);assert.equal(h.win.INFINITI_IDLE_ALBUM_NEXT(),true);h.load();assert.equal(h.images[1].src,'idle-photo-'+idB+'.jpg');h.photo();h.config.photos=[idA];h.tick(60000);h.load();assert.equal(h.images[2].src,'idle-photo-'+idA+'.jpg');h.photo();assert.equal(h.writes.length,0);h.win.INFINITI_IDLE_ALBUM_STOP();
h=harness([idA,idB]);h.win.INFINITI_IDLE_ALBUM_START(true);h.load();var stale=h.images[0].onload;h.doc.hidden=true;stale();assert.equal(h.win.INFINITI_IDLE_ALBUM_IS_PREVIEW(),false);assert.equal(Object.keys(h.tasks).length,0);assert.equal(h.layers[0].firstChild.style.backgroundImage,'');
h=harness([idA,idB]);h.win.INFINITI_IDLE_ALBUM_START(true);h.load();h.images[0].onerror();h.tick(5000);h.load();assert.equal(h.images[1].src,'idle-photo-'+idB+'.jpg');h.win.INFINITI_IDLE_ALBUM_STOP();assert.equal(Object.keys(h.tasks).length,0);
console.log('Album behavioral tests passed: preview schedule, manual navigation, deletion, hidden callbacks, failed image and cleanup.');
