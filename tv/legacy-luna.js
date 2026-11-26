#!/usr/bin/env node
/* Node 0.12 / ES5. Python on LG lacks json and fcntl. */
'use strict';
var fs = require('fs'), cp = require('child_process');
var DATA = '/home/root/lg-tv-vibehack', APP = 'com.infinitimoney.tvhome';
var M = 'luna://com.webos.applicationManager/';
function luna(uri, payload, callback, binary, timeout) {
  var p, done = false, timer, chunks = [], size = 0, errText = '';
  function finish(err, reply) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    if (p) { try { p.kill(); } catch(e) {} }
    callback(err, reply);
  }
  try {
    p = cp.spawn(binary || '/usr/bin/luna-send', ['-n','1','-f',uri,JSON.stringify(payload)]);
  } catch(e) { finish(e); return; }
  // Keep p.stdin open. EOF causes the legacy luna-send to exit before reply.
  p.stdin.on('error', function(){});
  p.on('error', function(e){finish(e);});
  p.stderr.on('data', function(d){errText = (errText + String(d)).slice(-500);});
  p.stdout.on('data', function(d){
    size += d.length;
    if (size > 4*1024*1024) { finish(new Error('oversized Luna reply')); return; }
    chunks.push(d);
    var reply;
    try { reply = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch(e) { return; }
    if (!reply || reply.returnValue !== true) {
      finish(new Error('Luna rejected: ' + JSON.stringify(reply).slice(0,500))); return;
    }
    finish(null, reply);
  });
  p.on('close', function(){finish(new Error('Luna exited without affirmative JSON: ' + errText));});
  timer = setTimeout(function(){finish(new Error('Luna timeout'));}, timeout || 8000);
}
function exists(p){return fs.existsSync(p);}
function allowed(mode) {
  if (exists('/var/luna/preferences/webosbrew_failsafe') ||
      exists('/var/lib/webosbrew/init.d/97-homekey') || exists(DATA+'/home-enabled')) return false;
  if (!exists('/media/developer/apps/usr/palm/applications/'+APP) &&
      !exists('/media/cryptofs/apps/usr/palm/applications/'+APP)) return false;
  if(mode==='watch') return exists(DATA+'/legacy-v8-session');
  if(mode==='trial') return exists(DATA+'/legacy-v8-trial') && !exists(DATA+'/legacy-v8-enabled');
  return mode==='enabled' && exists(DATA+'/legacy-v8-enabled');
}
function fail(e){console.error(String(e));process.exitCode=1;}
function run(action) {
  if(action==='probe' || action==='catalog'){
    luna(M+(action==='probe'?'getForegroundAppInfo':'listApps'),{},function(e,r){
      if(e) return fail(e);
      if(action==='catalog' && !Array.isArray(r.apps)) return fail('listApps missing apps array');
      console.log(JSON.stringify(r));
    },null,action==='catalog'?20000:8000);
  } else if(action==='power'){
    luna('luna://com.webos.service.tvpower/power/getPowerState',{},function(e,r){
      if(e) return fail(e);
      var state=r.state;
      process.exitCode=state==='Active'?0:(
        ['Standby','Active Standby','Suspend','Screen Off'].indexOf(state)!==-1?3:1);
    });
  } else if(/^redirect-(watch|trial|enabled)$/.test(action)){
    var mode=action.slice(9);
    if(!allowed(mode)) return fail('V8 disabled or conflicting hook');
    luna(M+'closeByAppId',{id:APP},function(e){
      if(e) console.error('close: '+e.message);
      setTimeout(function(){
        if(!allowed(mode)) return fail('V8 disabled before launch');
        luna(M+'launch',{id:APP},function(e){
          if(e) return fail(e);
          setTimeout(function(){
            if(!allowed(mode)) return fail('V8 disabled before foreground check');
            luna(M+'getForegroundAppInfo',{},function(e,r){
              if(e) return fail(e);
              console.log('foreground: '+r.appId);
              if(r.appId!==APP) fail('foreground mismatch');
            });
          },3000);
        });
      },1000);
    });
  } else { fail('Unknown V8 helper action'); }
}
if(require.main===module) run(process.argv[2]||'');
module.exports={luna:luna};
