#!/usr/bin/env node
'use strict';
// Offline DOM/remote smoke test; emulates Chromium 38-visible settings controls.
// Run on Node 20. This is not a substitute for testing on a physical LG TV.
var assert = require('assert'), fs = require('fs'), vm = require('vm');
var source = fs.readFileSync('app/customize.js','utf8');
var ids = {}, docEvents = {}, weatherCalls = 0, lastXhr = null;

function Node(tag, id) {
  this.tagName = tag || 'div'; this.id = id || '';
  this.parentNode = null; this.children = []; this.className = '';
  this.textContent = ''; this.value = ''; this.events = {}; this.style = {};
  var self = this;
  this.classList = {
    add:function(name) { if (!self.hasClass(name)) self.className += (self.className ? ' ' : '') + name; },
    remove:function(name) { self.className = self.className.split(/\s+/).filter(function (x) { return x && x !== name; }).join(' '); }
  };
}
Node.prototype.hasClass = function (name) { return this.className.split(/\s+/).indexOf(name) !== -1; };
Node.prototype.appendChild = function (el) { el.parentNode=this; this.children.push(el); return el; };
Node.prototype.addEventListener = function (type, cb) { this.events[type] = cb; };
Node.prototype.focus = function () { document.activeElement = this; };
Node.prototype.click = function () { if (this.events.click) this.events.click({target:this}); };
Node.prototype.setAttribute = function () {};
Node.prototype.scrollIntoView = function () {};
Node.prototype.querySelectorAll = function (tag) {
  var found = [];
  function walk(node) {
    node.children.forEach(function (x) {
      if (tag.split(/,\s*/).indexOf(x.tagName) !== -1) found.push(x);
      walk(x);
    });
  }
  walk(this);
  return found;
};
Node.prototype.querySelector = function (tag) { return this.querySelectorAll(tag)[0] || null; };
Object.defineProperty(Node.prototype,'offsetWidth',{get:function () {
  var p=this;
  while (p) { if (p.hasClass('hidden')) return 0; p=p.parentNode; }
  return 160;
}});
Object.defineProperty(Node.prototype,'offsetHeight',{get:function () { return this.offsetWidth ? 45 : 0; }});
Object.defineProperty(Node.prototype,'innerHTML',{
  get:function () { return ''; },
  set:function () { this.children=[]; }
});
function node(id,tag) { if (!ids[id]) ids[id]=new Node(tag||'div',id); return ids[id]; }
var document = {
  activeElement:null, body:node('body'),
  getElementById:function (id) { return node(id); },
  createElement:function (tag) { return new Node(tag); },
  addEventListener:function (type,cb) { docEvents[type]=cb; }
};
var panel=node('customizePanel'); panel.className='hidden';
['customizeClose','customizeStyleTab','customizeWeatherTab','customizeCalendarTab','customizeAppsTab','customizeAITab'].forEach(function (id) {
  panel.appendChild(node(id,'button'));
});
var groups = {
  customizeStyleView:['customizeThemes','customizeFonts','customizeLargeText',
    'customizeShowWeek','customizeMotion','customizeWallpaper','customizeResetStyle'],
  customizeWeatherView:['customizeWeatherChoice','customizeWeatherPresets',
    'customizeWeatherSearch','customizeWeatherSearchBtn','customizeWeatherResults',
    'customizeWeatherEnable','customizeWeatherUnit'],
  customizeCalendarView:['customizeSolar','customizeLunar','customizeCalendarNote'],
  customizeAppsView:['customizeAppList','customizeResetApps'],
  customizeAIView:['customizeAIToggle','customizeAIState']
};
Object.keys(groups).forEach(function (name) {
  var view=node(name); view.className='hidden'; panel.appendChild(view);
  groups[name].forEach(function (id) {
    view.appendChild(node(id,id==='customizeWeatherSearch'?'input':
      /Btn$|customizeLargeText|customizeShowWeek|customizeMotion|customizeWallpaper|customizeResetStyle|customizeSolar|customizeLunar|customizeWeatherEnable|customizeWeatherUnit|customizeResetApps|customizeAIToggle/.test(id)?'button':'div'));
  });
});
panel.appendChild(node('customizeStatus'));
var storage={};
var localStorage={
  getItem:function(k){return storage[k]||null;},
  setItem:function(k,v){storage[k]=v;}
};
var window={
  CONFIG:{hiddenApps:[],language:'vi',weather:{enabled:false,latitude:0,longitude:0}},
  TV_APPS:{apps:[]},
  INFINITI_WEATHER_RELOAD:function(){weatherCalls++;},
  INFINITI_LAUNCHER_LAYOUT_REFRESH:function(){}
};
function XMLHttpRequest() { lastXhr=this; this.status=200; }
XMLHttpRequest.prototype.open=function(method,url){this.url=url;};
XMLHttpRequest.prototype.send=function(){
  assert.ok(this.url.indexOf('geocoding-api.open-meteo.com')!==-1);
  this.responseText=JSON.stringify({results:[{name:'Nha Trang',country:'Việt Nam',
    latitude:12.2388,longitude:109.1967}]});
  if(this.onload)this.onload();
};
XMLHttpRequest.prototype.abort=function(){};
vm.runInNewContext(source,{window:window, document:document, localStorage:localStorage,
  XMLHttpRequest:XMLHttpRequest, module:{exports:{}},console:console});
assert.equal(typeof window.INFINITI_CUSTOMIZE_OPEN,'function');
window.INFINITI_CUSTOMIZE_OPEN();
assert.equal(window.INFINITI_CUSTOMIZE_IS_OPEN(),true);
assert.equal(document.activeElement.id,'customizeStyleTab','appearance page gets initial focus');
assert.equal(node('customizeStyleView').hasClass('hidden'),false);
assert.equal(node('customizeWeatherView').hasClass('hidden'),true);
node('customizeWeatherTab').click();
assert.equal(node('customizeWeatherView').hasClass('hidden'),false);
assert.equal(node('customizeStyleView').hasClass('hidden'),true);
var presets=node('customizeWeatherPresets').querySelectorAll('button');
assert.equal(presets.length,8,'offline presets should be visible');
presets[0].click();
assert.equal(window.INFINITI_PREFS.getWeather().place,'Hà Nội');
assert.equal(weatherCalls,1);
// A D-pad-only remote must be able to reach AND exit the weather search field.
var arrow={type:'keydown',keyCode:39,preventDefault:function(){},
  stopPropagation:function(){},stopImmediatePropagation:function(){}};
var down={type:'keydown',keyCode:40,preventDefault:function(){},
  stopPropagation:function(){},stopImmediatePropagation:function(){}};
node('customizeWeatherPresets').querySelectorAll('button')[7].focus();
docEvents.keydown(arrow);
assert.equal(document.activeElement.id,'customizeWeatherSearch','Right should focus search input');
var typed={type:'keydown',keyCode:78,stopped:false,prevented:false,
  preventDefault:function(){this.prevented=true;},
  stopPropagation:function(){this.stopped=true;},
  stopImmediatePropagation:function(){this.stopped=true;}};
docEvents.keydown(typed);
assert.equal(typed.prevented,false,'Typing must not be prevented');
assert.equal(typed.stopped,false,'LG keyboard input events must reach their input target');
docEvents.keydown(down);
assert.equal(document.activeElement.id,'customizeWeatherSearchBtn','Down should exit search input');
node('customizeWeatherSearch').value='Nha Trang';
node('customizeWeatherSearchBtn').click();
assert.equal(node('customizeWeatherResults').querySelectorAll('button').length,1);
node('customizeWeatherResults').querySelector('button').click();
assert.equal(window.INFINITI_PREFS.getWeather().place,'Nha Trang · Việt Nam');
assert.equal(weatherCalls,2);
node('customizeCalendarTab').click();
node('customizeSolar').click();
assert.equal(window.INFINITI_PREFS.getAppearance().showSolar,false);
assert.equal(document.body.hasClass('solar-hidden'),true);
node('customizeLunar').click();
assert.equal(window.INFINITI_PREFS.getAppearance().showLunar,false);
node('customizeAITab').click();
assert.equal(node('customizeAIView').hasClass('hidden'),false);
node('customizeAIToggle').click();
assert.equal(window.INFINITI_PREFS.getAIEnabled(),false,'AI off persists');
assert.equal(document.body.hasClass('ai-disabled'),true,'AI pill gets hidden');
node('customizeAIToggle').click();
assert.equal(window.INFINITI_PREFS.getAIEnabled(),true,'AI can be re-enabled');
node('customizeStyleTab').click();
node('customizeMotion').click();
assert.equal(window.INFINITI_PREFS.getAppearance().reduceMotion,true);
assert.equal(document.body.hasClass('motion-reduced'),true);
var back={type:'keydown',keyCode:461,preventDefault:function(){},
  stopPropagation:function(){},stopImmediatePropagation:function(){}};
docEvents.keydown(back);
assert.equal(window.INFINITI_CUSTOMIZE_IS_OPEN(),false,'Back closes settings');
console.log('Settings TV remote, weather region, search, appearance and calendar smoke tests passed.');
