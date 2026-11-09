#!/usr/bin/env node
'use strict';
var assert = require('assert'), fs = require('fs'), vm = require('vm');
var code = fs.readFileSync('app/assistant.js', 'utf8');
var nodes = {}, domEvents = {}, calls = 0, requests = [];
function node(id) {
  if (!nodes[id]) {
    nodes[id] = {value:'', disabled:false, textContent:'', events:{},
      classList:{add:function(){},remove:function(){}},
      addEventListener:function(type,fn){this.events[type]=fn;},
      focus:function(){}};
  }
  return nodes[id];
}
function XHR() {
  requests.push(this);
  this.readyState = 0;
  this.status = 0;
  this.open = function(){};
  this.setRequestHeader = function(){};
  this.send = function(){calls++;};
  this.abort = function(){this.readyState=4;if(this.onreadystatechange)this.onreadystatechange();};
}
var ctx = {
  window:{CONFIG:{language:'vi',aiEndpoint:'https://example.workers.dev/api/chat'},setTimeout:function(){}},
  document:{getElementById:node,addEventListener:function(type,fn){domEvents[type]=fn;}},
  XMLHttpRequest:XHR,
  console:console
};
vm.runInNewContext(code,ctx,{filename:'app/assistant.js'});
assert.equal(typeof ctx.window.INFINITI_AI_OPEN,'function');
ctx.window.INFINITI_AI_OPEN();
function remote(type,key) {
  var e={type:type,keyCode:key,stopped:false,defaultPrevented:false,
    stopPropagation:function(){this.stopped=true;},
    stopImmediatePropagation:function(){this.stopped=true;},
    preventDefault:function(){this.defaultPrevented=true;}};
  domEvents[type](e);
  return e;
}
assert.equal(remote('keyup',13).stopped,true,'OK release must never reach launcher');
assert.equal(remote('keydown',37).stopped,true,'arrows must stay within assistant');
node('aiPrompt').value='Xin chào';
node('aiToken').value='0123456789abcdef0123456789abcdef';
node('aiSend').events.click();
assert.equal(calls,1,'one request');
assert.equal(node('aiSend').disabled,true,'disabled during request');
node('aiClose').events.click();
assert.equal(node('aiSend').disabled,false,'re-enabled after abort/close');
ctx.window.INFINITI_AI_OPEN();
node('aiSend').events.click();
assert.equal(calls,2,'can submit again after reopening');
console.log('AI dialog remote interception and abort/reopen tests passed.');
