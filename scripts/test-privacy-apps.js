#!/usr/bin/env node
'use strict';
// No root, network, TV APIs, native Home or DNS mutation in these tests.
var assert=require('assert'),fs=require('fs'),vm=require('vm');
var html=fs.readFileSync('app/index.html','utf8');
var css=fs.readFileSync('app/style.css','utf8');
var code=fs.readFileSync('app/customize.js','utf8');
var storage={};
var localStorage={
  getItem:function(k){return Object.prototype.hasOwnProperty.call(storage,k)?storage[k]:null;},
  setItem:function(k,v){storage[k]=v;}
};
var root={
  CONFIG:{hiddenApps:[]},
  TV_APPS:{apps:[
    {id:'com.webos.app.browser',title:'LG Browser'},
    {id:'com.palm.app.settings',title:'LG Settings'},
    {id:'com.lge.lgchannels',title:'LG Channels'},
    {id:'tv.amasian.webos.vn1.channels',title:'LG Channels VN'},
    {id:'com.webos.app.livetv',title:'Live TV'},
    {id:'com.webos.app.hdmi1',title:'HDMI 1'},
    {id:'org.webosbrew.hbchannel',title:'Homebrew Channel'},
    {id:'org.webosbrew.inputhook',title:'Input Hook'},
    {id:'com.infinitimoney.tvhome',title:'Infiniti TV Home'},
    {id:'netflix',title:'Netflix'},
    {id:'youtube.leanback.v4',title:'YouTube'}
  ]}
};
vm.runInNewContext(code,{window:root,localStorage:localStorage,console:console});
var prefs=root.INFINITI_PREFS;
assert.equal(typeof prefs.hideLGDefaultApps,'function','Bulk hide API must be present');
assert.equal(prefs.isLGDefaultApp('com.webos.app.browser'),true);
assert.equal(prefs.isLGDefaultApp('com.palm.app.settings'),true);
assert.equal(prefs.isLGDefaultApp('com.lge.lgchannels'),true);
assert.equal(prefs.isLGDefaultApp('org.webosbrew.hbchannel'),false);
assert.equal(prefs.isLGDefaultApp('org.webosbrew.inputhook'),false);
assert.equal(prefs.isLGDefaultApp('netflix'),false);
assert.equal(prefs.isLGDefaultApp('com.webos.app.hdmi1'),false);
assert.equal(prefs.hideLGDefaultApps(),4);
['com.webos.app.browser','com.palm.app.settings','com.lge.lgchannels',
  'tv.amasian.webos.vn1.channels'].forEach(function(id) {
  assert.equal(prefs.isVisible(id,[]),false,'LG icon must be hidden locally: '+id);
});
['org.webosbrew.hbchannel','org.webosbrew.inputhook','netflix',
  'youtube.leanback.v4'].forEach(function(id) {
  assert.equal(prefs.isVisible(id,[]),true,'Must keep user/Homebrew icon: '+id);
});
assert.equal(prefs.hideLGDefaultApps(),0,'Bulk hide should be idempotent');
assert.equal(prefs.setVisible('com.webos.app.browser',true),true,'Users can restore a single app');
assert.equal(prefs.isVisible('com.webos.app.browser',[]),true);
assert.equal(prefs.hideLGDefaultApps(),1);
prefs.resetVisible();
assert.equal(prefs.isVisible('com.webos.app.browser',[]),true,'Reset restores default visibility');
assert.equal(prefs.setVisible('com.webos.app.livetv',true),false,'Protected Live TV cannot be changed');
assert.equal(prefs.setVisible('org.webosbrew.hbchannel',false),true,
  'Manual per-app hiding remains reversible, even for Homebrew');
assert.equal(prefs.setVisible('org.webosbrew.hbchannel',true),true);
assert.ok(html.indexOf('id="customizeHideLGApps"')>=0);
assert.ok(html.indexOf('id="customizePrivacyTab"')>=0 &&
  html.indexOf('id="customizePrivacyView"')>=0);
assert.ok(css.indexOf('#customizePrivacyView.hidden')>=0 &&
  css.indexOf('#customizeDevModeView.hidden')>=0,
  'Inactive pages should not leak controls into remote navigation');
assert.ok(html.indexOf('94.140.14.14')>=0 && html.indexOf('94.140.15.15')>=0,
  'Use AdGuard published DNS IPv4 pair');
assert.ok(html.indexOf('DNS thủ công')>=0 && html.indexOf('khôi phục DNS tự động')>=0,
  'UI must clearly say DNS is manual and reversible');
['iptables','mount -o','/etc/hosts','init.d','reboot','dd if='].forEach(function(danger){
  assert.strictEqual(code.indexOf(danger),-1,'Customize must not mutate root/network state: '+danger);
});
console.log('webOS3 app privacy passed: bulk reversible LG icon hiding, Homebrew-safe, manual AdGuard DNS and no root modification.');
