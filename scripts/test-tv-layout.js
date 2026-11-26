#!/usr/bin/env node
'use strict';
// Static geometry/DOM regression guard for legacy 1920x1080 LG TV layouts.
// This does not replace hardware or Chromium 38 visual screenshots.
var fs=require('fs'), assert=require('assert');
var css=fs.readFileSync('app/style.css','utf8');
var html=fs.readFileSync('app/index.html','utf8');
var app=fs.readFileSync('app/app.js','utf8');
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
assert.ok(/overflow:hidden/.test(block('.customizeContent')),'Fixed settings must not scroll');
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
assert.ok(/function rowOf\(i\) \{ return 0; \}/.test(app),
  'All Home apps must remain on exactly one horizontal row');
assert.ok(/translateX\(/.test(app),'Single app row must scroll horizontally');
assert.ok(/background:rgba\(12,22,33,\.13\)/.test(css),
  'Weather cards must remain translucent, not opaque');
assert.ok(/var COLUMNS = 4,/.test(app),'Exactly four app slots');
assert.ok(/var TILE_W = 380, TILE_H = 214, CELL_W = 420/.test(app),'Landscape card dimensions');
assert.ok(/clip:rect\(0,1800px,1080px,100px\)/.test(css),'Clip adjacent cards');
assert.ok(/transform:scale\(1\.07\)/.test(css),'Focus zoom');
var vm=require('vm'), offsetFn=app.match(/function dockOffset\([^]*?\n  \}/)[0];
var scope={CELL_W:420,COLUMNS:4};vm.runInNewContext(offsetFn,scope);
assert.strictEqual(scope.dockOffset(3,0,18),0);
assert.strictEqual(scope.dockOffset(4,0,18),420);
assert.strictEqual(scope.dockOffset(17,420,18),14*420);
assert.strictEqual(scope.dockOffset(0,14*420,18),0);
assert.strictEqual(scope.dockOffset(1,420,2),0);
assert.ok(130+3*420+380*1.035+3<1800,'Fourth focused card fits');
assert.ok(130+4*420>=1800,'Fifth card clipped at rest');
assert.ok(/border-radius:24px!important/.test(css) &&
  /\.item \.card img \{[^}]*border-radius:24px/.test(css),
  'Icons must have more rounded corners in transparent dock');
assert.ok(html.indexOf('id="customizeWallQr"')>=0 &&
  html.indexOf('id="btnWall"')<0 && html.indexOf('id="customizeWallpaper"')>=0,
  'Wallpaper QR setup must be inside Customize rather than on the top bar');
assert.ok(html.indexOf('id="customizeUpdateState"')>=0,
  'Settings should explain automatic update availability');
assert.ok(app.indexOf("var pills = [")>=0 && app.indexOf("'btnWall'")<0,
  'Remote focus must not navigate to a removed wallpaper top button');
assert.ok(/var DOCK_TOP = 1030 - TILE_H - 46;/.test(app),
  'Single app row must be placed near bottom, above the TV overscan');
assert.ok(/band.style.display = 'none'/.test(app),
  'Opaque dock background must be hidden');
assert.ok(/item.card.style.background = ''/.test(app),
  'Default card background must reset before applying a safe edge colour');
assert.ok(/#dockBand, body.theme-ocean #dockBand, body.theme-amber #dockBand/.test(css),
  'Transparent dock must also override theme backgrounds');
assert.ok(/\.item\.dock \.name \{[\s\S]*?display:block/.test(css),
  'Compact dock must still show readable app labels');
console.log('LG TV 1080p/720p: larger rounded single-row dock, Customize wallpaper QR and updater status passed.');

var weatherRules=['weekLabel','weekDate','weekCondition','weekTemperature','weekRain'];
var weatherHeight=20+2;
weatherRules.forEach(function(name){
  var sel='#weekWeather .weekDay .'+name, rule=block(sel);
  weatherHeight+=px(sel,'line-height');
  if(/margin-top:/.test(rule))weatherHeight+=px(sel,'margin-top');
  assert.ok(px(sel,'font-size')<px(sel,'line-height'),'Weather line must fit '+name);
});
assert.ok(weatherHeight<=159,'Five forecast lines and padding must fit: '+weatherHeight);
assert.ok(/overflow:hidden/.test(block('#weekWeather .weekDay')),'No overflowing forecast text');
assert.ok(/text-overflow:ellipsis/.test(block('#weekWeather .weekDay > div')),'Long forecast labels stay contained');
console.log('Three-day forecast text height '+weatherHeight+'/159px: fits.');

assert.ok(/background:rgba\(3,7,15,\.12\)/.test(block('#customizePanel')),'Settings scrim must let wallpaper through');
assert.ok(/background:rgba\(12,21,33,\.62\)/.test(block('.customizeDialog')),'Settings glass must be translucent');
assert.ok(/background:#fff/.test(block('#customizeWallQr')),'QR keeps white quiet zone');
assert.ok(/body\.customize-open #viewport/.test(css),'Underlying widgets hidden during settings');
assert.ok(!/backdrop-filter/.test(block('.customizeDialog')),'Legacy GPU: no modal backdrop blur');

var iconFn=app.match(/function iconLayout\([^]*?\n  \}/)[0],iconScope={};
vm.runInNewContext(iconFn,iconScope);
var flat=[[12,35,80,255],[12,35,80,255],[12,35,80,255],[12,35,80,255]];
assert.equal(iconScope.iconLayout(256,256,flat).kind,'contained');
assert.equal(iconScope.iconLayout(256,256,flat).background,'rgb(12,35,80)');
assert.equal(iconScope.iconLayout(256,144,flat).kind,'landscape');
assert.equal(iconScope.iconLayout(256,144,flat).background,'');
assert.equal(iconScope.iconLayout(128,256,flat).kind,'contained');
assert.equal(iconScope.iconLayout(256,256,[]).background,'');
assert.equal(iconScope.iconLayout(256,256,[[12,35,80,0],flat[1],flat[2],flat[3]]).background,'');
assert.equal(iconScope.iconLayout(256,256,[[255,255,255,255],flat[1],flat[2],flat[3]]).background,'');
assert.ok(/object-fit:contain/.test(block('.item .card.icon-contained img')));
assert.ok(/width:100%; height:100%/.test(block('.item .card.icon-landscape img')));
console.log('Icon aspect ratio and solid-edge background tests passed.');

assert.ok(/flex-direction:column/.test(block('.customizeMain .customizeTabs')));
assert.ok(html.indexOf('id="customizeCheckUpdate"')>=0 && html.indexOf('id="customizeAppNext"')>=0);

// Idle rules hide only dock, controls and three-day forecast, never current weather or dates.
var idleHide=css.match(/body\.idle-home #topButtons,[^{}]+\{\s*visibility:hidden;\s*\}/);
assert.ok(idleHide,'Idle rule exists');
['#forecastArea','#viewport','#penBtn'].forEach(function(id){assert.ok(idleHide[0].indexOf(id)>=0,id+' hidden while idle');});
['header','#leftBlock','#clock','#date','#lunarDate','#weather'].forEach(function(id){assert.ok(idleHide[0].indexOf('body.idle-home '+id)<0,id+' stays visible');});
assert.ok(/body\.idle-home\.idle-rain:not\(\.launcher-covered\):not\(\.motion-reduced\)/.test(css));
console.log('Idle Home retains clock/calendar/current weather, hides forecast and dock.');

["snow","petals","stars","fireflies","bubbles","mist"].forEach(function(e){assert.ok(fs.existsSync('app/icons/idle-'+e+'.svg'));assert.ok(css.indexOf('body.idle-home.idle-'+e+':not(.launcher-covered):not(.motion-reduced)')>=0);});
assert.ok(app.indexOf('document.body.classList.remove(idleEffectClass)')>=0);
assert.ok(html.indexOf('id="customizeIdleEffect"')>=0);
console.log('Idle effect assets, lifecycle CSS guards and controls checked.');
