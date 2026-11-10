#!/usr/bin/env node
'use strict';
var assert=require('assert'), fs=require('fs'), vm=require('vm');
var source=fs.readFileSync('app/extras.js','utf8');
var forecast=require('../app/forecast.js');
function FakeElement(id) {
  this.id=id; this.className=id==='forecastArea'?'hidden':'';
  this.textContent=''; this.children=[]; this.style={};
  var self=this;
  this.classList={
    add:function(name){if(!self.className.split(' ').includes(name))self.className+=' '+name;},
    remove:function(name){self.className=self.className.split(' ').filter(function(x){return x!==name;}).join(' ');}
  };
}
FakeElement.prototype.appendChild=function(el){this.children.push(el);};
Object.defineProperty(FakeElement.prototype,'innerHTML',{
  set:function(){this.children=[];},get:function(){return '';}
});
var nodes={};
function get(id){return nodes[id]||(nodes[id]=new FakeElement(id));}
var document={
  hidden:false,documentElement:{style:{}},body:get('body'),
  getElementById:get,createElement:function(){return new FakeElement('cell');}
};
var calls=[], weather={
  enabled:false,latitude:0,longitude:0,place:'',unit:'celsius'
};
var window={
  CONFIG:{language:'vi',wallpaper:'',ambientGlow:true,weather:{enabled:false}},
  INFINITI_PREFS:{getWeather:function(){return weather;}},
  INFINITI_FORECAST:forecast
};
function XMLHttpRequest(){this.status=200;calls.push(this);}
XMLHttpRequest.prototype.open=function(method,url){this.url=url;};
XMLHttpRequest.prototype.abort=function(){};
XMLHttpRequest.prototype.send=function(){
  this.responseText=JSON.stringify({
    current:{temperature_2m:26,weather_code:1},
    daily:{time:['2026-11-10','2026-11-11','2026-11-12','2026-11-13'],
      temperature_2m_max:[29,30,31,32],temperature_2m_min:[22,23,24,25],
      weather_code:[1,61,0,3],precipitation_probability_max:[10,40,0,30]}
  });
  if(this.onload)this.onload();
};
vm.runInNewContext(source,{window:window,document:document,
  XMLHttpRequest:XMLHttpRequest,setInterval:function(){},console:console});
assert.equal(typeof window.INFINITI_WEATHER_RELOAD,'function');
assert.equal(calls.length,0,'Disabled weather must never fetch');
assert.ok(get('forecastArea').className.indexOf('hidden')!==-1);
weather={enabled:true,latitude:21.0285,longitude:105.8542,place:'Hà Nội',unit:'celsius'};
window.INFINITI_WEATHER_RELOAD();
assert.equal(calls.length,1);
assert.ok(calls[0].url.indexOf('forecast_days=3')!==-1,'Request exactly 3 days');
assert.equal(get('weekWeather').children.length,3,'Exactly 3 forecast cards');
assert.equal(get('weekWeather').children[0].children[0].textContent,'Hôm nay');
assert.ok(get('weather').textContent.indexOf('Hà Nội')!==-1);
weather={enabled:true,latitude:10.8231,longitude:106.6297,place:'TP. Hồ Chí Minh',unit:'fahrenheit'};
window.INFINITI_WEATHER_RELOAD();
assert.equal(calls.length,2);
assert.ok(calls[1].url.indexOf('temperature_unit=fahrenheit')!==-1);
assert.equal(get('weekWeather').children.length,3,'City change must not duplicate cards');
assert.ok(get('weather').textContent.indexOf('Hồ Chí Minh')!==-1);
weather={enabled:false,latitude:10.8231,longitude:106.6297,place:'TP. Hồ Chí Minh',unit:'celsius'};
window.INFINITI_WEATHER_RELOAD();
assert.equal(calls.length,2,'Turning weather off never performs a request');
assert.equal(get('weekWeather').children.length,0);
assert.ok(get('forecastArea').className.indexOf('hidden')!==-1);
console.log('Dynamic three-day weather loading, location switching and disabled-state tests passed.');
