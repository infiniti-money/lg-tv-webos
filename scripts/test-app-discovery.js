#!/usr/bin/env node
'use strict';
// Luna can return a partial launchpoint list even while other installed app
// packages are present in /media/*/applications. Verify safe deduplication.
var assert=require('assert'), sync=require('../tv/sync.js');
var disk=[
  {id:'com.webos.app.browser',title:'Browser',icon:'/not-mounted/icon.png'},
  {id:'com.netflix.app',title:'Netflix',icon:'/not-mounted/netflix.png'},
  {id:'com.other.app',title:'Local package',iconColor:'#fafafa'}
];
var luna=[
  {id:'com.webos.app.browser',title:'Trình duyệt',icon:'icon://browser'},
  {id:'com.youtube.app',title:'YouTube',icon:'icon://youtube'}
];
var points=sync.mergePoints(luna,disk);
assert.equal(points.length,4,'Luna must not hide disk-only packages');
assert.deepEqual(points.map(function(x){return x.id;}),
  ['com.webos.app.browser','com.netflix.app','com.other.app','com.youtube.app']);
assert.equal(points[0].title,'Trình duyệt','Luna title takes precedence');
assert.equal(points[1].title,'Netflix','Disk package survives partial Luna results');
assert.equal(sync.mergePoints([],disk).length,3,'Fallback when Luna is empty');
assert.equal(sync.mergePoints(luna,[]).length,2,'Fallback when filesystem is unreadable');
assert.equal(sync.mergePoints([{id:'invalid',title:'a'},{id:'invalid',title:'b'}],[]).length,1,
  'duplicate IDs must be deduplicated');
assert.equal(sync.mergePoints([{title:'no ID'},null,{id:''}],[]).length,0,'reject invalid IDs');
console.log('LG app discovery tests passed (partial Luna listing, disk merge, duplicate IDs).');
