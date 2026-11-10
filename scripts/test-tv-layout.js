#!/usr/bin/env node
'use strict';
// Static geometry/DOM regression guard for legacy 1920x1080 LG TV layouts.
// This does not replace hardware or Chromium 38 visual screenshots.
var fs=require('fs'), assert=require('assert');
var css=fs.readFileSync('app/style.css','utf8');
var html=fs.readFileSync('app/index.html','utf8');
var app=fs.readFileSync('app/app.js','utf8');
var assistant=fs.readFileSync('app/assistant.js','utf8');
function block(selector) {
  var start=css.indexOf(selector+' {');
  assert.ok(start>=0,'Missing CSS block: '+selector);
  var open=css.indexOf('{',start);
  return css.slice(open+1,css.indexOf('}',open));
}
function px(selector,prop) {
  var match=new RegExp('(?:^|[;\\n])\\s*'+prop+'\\s*:\\s*(\\d+)(?:px)?').exec(block(selector));
  assert.ok(match,'Missing '+prop+' on '+selector);
  return +match[1];
}
assert.ok(html.indexOf('id="forecastArea"')!==-1,'Missing forecast area');
assert.ok(html.indexOf('id="weekWeather"')!==-1,'Missing forecast cards');
assert.ok(html.indexOf('id="customizeWeatherTab"')!==-1,'Missing weather settings tab');
assert.ok(html.indexOf('id="customizeCalendarTab"')!==-1,'Missing calendar settings tab');
assert.ok(html.indexOf('id="customizeSearchRow"')===-1,'Only class-based search row is expected');
assert.ok(html.indexOf('id="customizeWeatherSearch"')!==-1,'Missing region search field');
assert.ok(/overflow-y:\s*auto/.test(block('.customizeContent')),'Settings must scroll');
assert.ok(/flex-direction:\s*column/.test(block('.customizeDialog')),'Settings must keep header/footer visible');
assert.ok(/height:\s*100%/.test(block('.customizeDialog')),'Settings must fit TV height');
assert.ok(/max-width:\s*1640px/.test(block('.customizeDialog')),'Settings should fit safe TV width');
assert.ok(px('#forecastArea','top')+px('#forecastArea','height')<=532,
  'Forecast cards overlap the home hero title');
assert.ok(px('#forecastArea','left')>=80,'Forecast too close to left TV edge');
assert.ok(px('#customizePanel','top')===0,'Settings modal must fill screen');
assert.ok(/@media screen and \(max-width:1280px\)/.test(css),
  'Need 720p/browser viewport scaling');
assert.ok(/body\.motion-reduced #stage/.test(css),'Missing lightweight transition mode');
assert.ok(/cachedHeaderBottom/.test(app),'Remote navigation still forces layout per focus');
assert.ok(/lastArrowAt/.test(app),'Remote key repeat throttle missing');
assert.ok(/getFullYear\(\)/.test(app),'Solar date must contain the year');
assert.ok(/function resetDialogOk\(\)/.test(app),'Settings close must reset held OK state');
assert.ok(/INFINITI_AI_CLOSED/.test(assistant),'AI close must restore launcher focus');
assert.ok(/function rowOf\(i\) \{ return 0; \}/.test(app),
  'All Home apps must remain on exactly one horizontal row');
assert.ok(/translateX\(/.test(app),'Single app row must scroll horizontally');
assert.ok(/background:rgba\(12,22,33,\.13\)/.test(css),
  'Weather cards must remain translucent, not opaque');
assert.ok(/body\.ai-disabled #btnAI/.test(css),'AI must disappear from Home when disabled');
assert.ok(/var TILE_W = Math.max\(86, Math.min\(146,/.test(app),
  'App icons must use compact 86–146px sizing');
assert.ok(/var DOCK_TOP = 1030 - TILE_H - 34;/.test(app),
  'Single app row must be placed near bottom, above the TV overscan');
assert.ok(/band.style.display = 'none'/.test(app),
  'Opaque dock background must be hidden');
assert.ok(/item.card.style.background = 'transparent'/.test(app),
  'Per-app inline background must not obscure the wallpaper');
assert.ok(/#dockBand, body.theme-ocean #dockBand, body.theme-amber #dockBand/.test(css),
  'Transparent dock must also override theme backgrounds');
assert.ok(/\.item\.dock \.name \{[\s\S]*?display:block/.test(css),
  'Compact dock must still show readable app labels');
console.log('LG TV 1080p/720p: compact transparent dock near bottom, installed app row and AI settings passed.');
