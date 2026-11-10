#!/usr/bin/env node
'use strict';
// Luna can return only 20 visible apps while 185 system packages exist.
// Do not confuse installed internal system services with app tiles.
var assert=require('assert'), sync=require('../tv/sync.js');
var developer='/media/developer/apps/usr/palm/applications';
var store='/media/cryptofs/apps/usr/palm/applications';
function installed(id,title,source,more) {
  var p={id:id,title:title,icon:'/icons/'+id+'.png',_sourceDir:source,
    _hasMain:true,_hasTitle:true,_hidden:false,_service:false};
  Object.keys(more||{}).forEach(function(k){p[k]=more[k];});
  return p;
}
var disk=[
  installed('com.webos.app.browser','Browser','/usr/palm/applications'),
  installed('com.netflix.app','Netflix',store),
  installed('com.other.app','Installed application',developer),
  installed('com.webos.app.settinghelper','Settings helper','/usr/palm/applications'),
  installed('com.hidden.internal','Internal service',developer,{_hidden:true}),
  installed('com.noicon.app','No icon',developer,{icon:''}),
  installed('com.noentry.app','No main',store,{_hasMain:false}),
  installed('com.webos.app.systemdaemon','LG daemon','/usr/palm/applications'),
  installed('com.manual.service','Background service',store),
  installed('com.prohibited.app','Hidden via Luna',store)
];
var luna=[
  {id:'com.webos.app.browser',title:'Trình duyệt',icon:'icon://browser'},
  {id:'com.youtube.app',title:'YouTube',icon:'icon://youtube'},
  {id:'com.webos.app.home',title:'LG Home',icon:'icon://home'},
  {id:'com.prohibited.app',title:'Hidden',hidden:true}
];
var points=sync.mergePoints(luna,disk);
assert.deepStrictEqual(points.map(function(x){return x.id;}),
  ['com.webos.app.browser','com.youtube.app','com.netflix.app','com.other.app'],
  'Only visible Luna apps and launchable installed third-party apps are shown');
assert.strictEqual(points[0].title,'Trình duyệt','Luna title takes precedence');
assert.strictEqual(sync.mergePoints([],disk).length,2,'No Luna: only installed user apps survive');
assert.strictEqual(sync.mergePoints(luna,[]).length,2,'No disk: Luna visible apps survive');
assert.strictEqual(sync.mergePoints([{id:'same',title:'a'},{id:'same',title:'b'}],[]).length,1,
  'duplicate IDs must be deduplicated');
assert.strictEqual(sync.mergePoints([{title:'no ID'},null,{id:''}],[]).length,0,'reject invalid IDs');
console.log('LG app discovery: only installed user-facing apps, no internal services or hidden apps.');
