#!/usr/bin/env node
/* Node 0.12 / ES5. Python on LG lacks json and fcntl. */
'use strict';
var fs = require('fs'), cp = require('child_process'), http = require('http'), crypto = require('crypto');
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
// Read-only boot readiness: wait for Homebrew to finish, active TV power,
// and a meaningful application-manager foreground response twice in succession.
function bootGuard(mode) {
  if (exists('/var/lib/webosbrew/init.d/97-homekey') || exists(DATA+'/home-enabled')) return 'cancel';
  if (mode==='trial' && (!exists(DATA+'/legacy-v8-trial') || exists(DATA+'/legacy-v8-enabled'))) return 'cancel';
  if (mode==='enabled' && !exists(DATA+'/legacy-v8-enabled')) return 'cancel';
  return allowed(mode) ? 'ready' : 'pending';
}
function sampleReady(callback) {
  luna('luna://com.webos.service.tvpower/power/getPowerState',{},function(e,r){
    if(e || r.state!=='Active') return callback(false,'power '+(e?e.message:r.state));
    luna(M+'getForegroundAppInfo',{},function(e,r){
      if(e || typeof r.appId!=='string' || !r.appId.trim()) return callback(false,'foreground unavailable');
      callback(true,r.appId);
    },null,2000);
  },null,2000);
}
function waitReady(guard,sample,callback,options) {
  options=options||{};
  var deadline=process.uptime()+(options.seconds||90), consecutive=0, previous='';
  var interval=typeof options.interval==='number'?options.interval:1000;
  function report(message){
    if(message!==previous){previous=message;if(options.log)options.log(message);}
  }
  function again(){setTimeout(step,interval);}
  function step(){
    if(process.uptime()>=deadline) return callback(new Error('boot readiness timeout; no launch'));
    var state=guard();
    if(state==='cancel') return callback(new Error('boot canceled; no launch'));
    if(state!=='ready'){consecutive=0;report('waiting: Homebrew guard or app path');return again();}
    sample(function(ok,detail){
      if(process.uptime()>=deadline) return callback(new Error('boot readiness timeout; no launch'));
      var current=guard();
      if(current==='cancel') return callback(new Error('boot canceled; no launch'));
      if(!ok || current!=='ready'){
        consecutive=0;report('waiting: '+detail);return again();
      }
      consecutive++;
      report('Luna ready sample '+consecutive+'/2: '+detail);
      if(consecutive>=2) return callback(null,detail);
      again();
    });
  }
  step();
}
// A per-launch challenge, available only on the TV loopback interface.
function renderSession(mode, closeFirst, callback) {
  var token=crypto.randomBytes(24).toString('hex'), server, timer, poll, done=false;
  var rendered=false, foreground=false, launchOK=false, checking=false, start=process.uptime();
  function finish(e){
    if(done)return;done=true;clearTimeout(timer);clearInterval(poll);
    if(server){try{server.close();}catch(x){}}
    callback(e);
  }
  function complete(){
    if(rendered && foreground && launchOK){
      console.log('RENDER OK; foreground: '+APP+'; '+(process.uptime()-start).toFixed(1)+'s');
      finish(null);
    }
  }
  function check(){
    if(done || checking)return;
    if(!allowed(mode))return finish(new Error('launch canceled'));
    checking=true;
    luna(M+'getForegroundAppInfo',{},function(e,r){
      checking=false;if(done)return;
      foreground=!e && r.appId===APP;complete();
    },null,1200);
  }
  server=http.createServer(function(req,res){
    // No CORS grant, no filesystem, no commands, no arbitrary URL.
    var match=/^\/render\/([a-f0-9]{48})\/([0-9]{1,4})$/.exec(req.url||'');
    if(req.method!=='GET' || !match || match[1]!==token || !allowed(mode)){
      res.writeHead(404,{'Connection':'close'});res.end();return;
    }
    rendered=true;
    console.log('UI render acknowledgement: '+match[2]+' visible tiles');
    res.writeHead(204,{'Connection':'close','Cache-Control':'no-store'});res.end();
    complete();
  });
  server.on('error',finish);
  server.on('connection',function(socket){socket.setTimeout(2500,function(){socket.destroy();});});
  timer=setTimeout(function(){finish(new Error('render/foreground timeout; no automatic retry'));},18000);
  server.listen(0,'127.0.0.1',function(){
    if(done)return;
    function launch(){
      if(done || !allowed(mode))return finish(new Error('launch canceled'));
      luna(M+'launch',{id:APP,params:{infinitiRenderToken:token,infinitiRenderPort:server.address().port}},function(e){
        if(done)return;
        if(e)return finish(e);
        launchOK=true;check();complete();
        if(!done)poll=setInterval(check,350);
      },null,4000);
    }
    if(closeFirst){
      // Keep the known-working close/relaunch on physical Home, but shorten the delay.
      luna(M+'closeByAppId',{id:APP},function(e){
        if(done)return;
        if(e)console.log('close: '+e.message);
        setTimeout(launch,150);
      },null,1500);
    }else launch();
  });
}
function boot(mode) {
  var start=process.uptime();
  console.log('BOOT: adaptive Luna readiness (90s limit)');
  waitReady(function(){return bootGuard(mode);},sampleReady,function(e){
    if(e)return fail(e);
    if(!allowed(mode))return fail('boot canceled before launch');
    console.log('BOOT READY after '+(process.uptime()-start).toFixed(1)+'s');
    // One launch or relaunch with a fresh challenge, never close on boot.
    renderSession(mode,false,function(err){if(err)fail(err);});
  },{log:function(s){console.log(s);}});
}
function syncCatalog(mode) {
  if(!allowed(mode))return;
  var lock='/tmp/infiniti-v8-sync.lock';
  try{fs.mkdirSync(lock,448);}catch(e){return;}
  var child,timer,done=false;
  function finish(){
    if(done)return;done=true;clearTimeout(timer);
    try{fs.rmdirSync(lock);}catch(e){}
  }
  try{
    child=cp.spawn('/usr/bin/node',[DATA+'/sync.js','--catalog-only'],{stdio:'inherit',env:process.env});
    child.on('error',finish);
    child.on('close',finish);
    timer=setTimeout(function(){try{child.kill();}catch(e){}},50000);
  }catch(e){finish();}
}
function fail(e){console.error(String(e));process.exitCode=1;}
function run(action) {
  if(/^boot-(trial|enabled)$/.test(action)){
    boot(action.slice(5));
  } else if(action==='probe' || action==='catalog'){
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
    },null,1200);
  } else if(/^sync-(watch|trial|enabled)$/.test(action)){
    syncCatalog(action.slice(5));
  } else if(/^redirect-(watch|trial|enabled)$/.test(action)){
    var mode=action.slice(9);
    if(!allowed(mode))return fail('V8 disabled or conflicting hook');
    renderSession(mode,true,function(e){if(e)fail(e);});
  } else if(action==='wake-enabled'){
    if(!allowed('enabled') || !exists(DATA+'/legacy-v8-wake'))return fail('wake disabled');
    renderSession('enabled',false,function(e){if(e)fail(e);});
  } else { fail('Unknown V8 helper action'); }
}
if(require.main===module) run(process.argv[2]||'');
module.exports={luna:luna,waitReady:waitReady};
