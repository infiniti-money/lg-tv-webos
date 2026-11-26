'use strict';
var assert=require('assert'),a=require('../tv/idle-album.js');
assert.equal(a.settings({seconds:30,random:true,enabled:true}).seconds,30);assert.equal(a.settings({seconds:1}).seconds,60);assert.equal(a.jpeg(Buffer.from([255,216,255,217])),true);assert.equal(a.jpeg(Buffer.from([255,216,0,0])),false);assert.equal(a.jpeg(Buffer.alloc(1500001)),false);
var vm=require('vm'),fs=require('fs'),root={},el={classList:{remove:function(){}}};vm.runInNewContext(fs.readFileSync('app/idle-album-player.js','utf8'),{window:root,document:{getElementById:function(){return el;}}});var n=root.INFINITI_IDLE_NEXT_INDEX;assert.equal(n(3,2,false,.5),0);assert.equal(n(3,1,true,0),0);assert.equal(n(3,1,true,.99),2);assert.equal(n(1,0,true,.9),0);console.log('Album limits and random next-photo selection passed.');

assert.ok(fs.readFileSync('tv/wallpaper-server.js','utf8').indexOf('remote.publish();album.publish();')>=0);
assert.ok(fs.readFileSync('app/index.html','utf8').indexOf('id="idleSignature">Designed by Tân Dev')>=0);
