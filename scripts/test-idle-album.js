'use strict';
var assert=require('assert'),a=require('../tv/idle-album.js');
assert.equal(a.settings({seconds:30,random:true,enabled:true}).seconds,30);assert.equal(a.settings({seconds:1}).seconds,60);assert.equal(a.jpeg(Buffer.from([255,216,255,217])),true);assert.equal(a.jpeg(Buffer.from([255,216,0,0])),false);assert.equal(a.jpeg(Buffer.alloc(1500001)),false);
var vm=require('vm'),fs=require('fs'),root={},el={classList:{remove:function(){}}};vm.runInNewContext(fs.readFileSync('app/idle-album-player.js','utf8'),{window:root,document:{getElementById:function(){return el;}}});var n=root.INFINITI_IDLE_NEXT_INDEX;assert.equal(n(3,2,false,.5),0);assert.equal(n(3,1,true,0),0);assert.equal(n(3,1,true,.99),2);assert.equal(n(1,0,true,.9),0);console.log('Album limits and random next-photo selection passed.');

assert.ok(fs.readFileSync('tv/wallpaper-server.js','utf8').indexOf('remote.publish();album.publish();')>=0);
assert.ok(fs.readFileSync('app/index.html','utf8').indexOf('id="idleSignature">Designed by Tân Dev')>=0);

var advance=root.INFINITI_IDLE_SHOULD_ADVANCE,p={seconds:0,powerEpoch:'boot2',photos:['a','b']};assert.equal(advance({id:'a',seconds:0,epoch:'boot1'},p,100),true);assert.equal(advance({id:'a',seconds:0,epoch:'boot2'},p,100),false);p.seconds=86400;assert.equal(advance({id:'a',seconds:86400,at:0},p,86399999),false);assert.equal(advance({id:'a',seconds:86400,at:0},p,86400000),true);assert.equal(a.settings({seconds:0}).seconds,0);assert.equal(a.settings({seconds:604800}).seconds,604800);

assert.ok(fs.readFileSync('tv/idle-album.js','utf8').indexOf('now-lastPublish<30000')>=0);

var pick=root.INFINITI_IDLE_CHOOSE_STYLE;assert.equal(pick('random',['fade','zoom-in'],'fade',0),'zoom-in');assert.equal(pick('fade',['fade','zoom-in'],'fade',0),'fade');assert.equal(a.settings({transition:'bad',motion:'bad'}).transition,'random');assert.equal(a.settings({transition:'slide-left',motion:'pan'}).motion,'pan');
var albumCss=fs.readFileSync('app/style.css','utf8');["fade","slide-left","slide-right","slide-up","zoom-in","zoom-out","dissolve","cinema"].forEach(function(s){assert.ok(albumCss.indexOf('.album-enter-'+s)>=0);});assert.ok(albumCss.indexOf('.idlePhoto.shown .motion-pan-left')>=0);assert.ok(fs.readFileSync('tv/wallpaper.html','utf8').indexOf('id="albumTransition"')>=0);console.log('Album transition styles, motion modes and nonrepeating random selection passed.');

var mt=root.INFINITI_IDLE_MOTION_TRANSFORM,et=root.INFINITI_IDLE_ENTRY_TRANSFORM;assert.notEqual(mt('pan-left',0),mt('pan-left',1));assert.notEqual(mt('zoom-in',0),mt('zoom-in',1));assert.equal(mt('still',.5),'');assert.notEqual(et('slide-left',0),et('slide-left',1));assert.equal(et('fade',.5),'');

["slide-down","diagonal","soft-rotate","sweep","lift","focus"].forEach(function(s){assert.ok(albumCss.indexOf('.album-enter-'+s)>=0);assert.equal(a.settings({transition:s}).transition,s);assert.notEqual(root.INFINITI_IDLE_ENTRY_TRANSFORM(s,0),root.INFINITI_IDLE_ENTRY_TRANSFORM(s,1));});
