#!/usr/bin/env node
/* Original read-only Home integration inventory for legacy Node 0.12.
 * No mount, process signals, Luna writes, key grabs or external program calls. */
'use strict';
var fs=require('fs'),path=require('path'),crypto=require('crypto');
var HOME='/usr/palm/applications/com.webos.app.home';
var QML=HOME+'/qml';
var TARGETS=[HOME,HOME+'/appinfo.json',QML+'/main.qml',QML+'/Controllers/UIController.qml',
 QML+'/UserInterfaceLayer/UIController.qml',QML+'/AppInitializer/SystemProperties.qml',
 QML+'/UserInterfaceLayer/Containers/MainView_WEE.qml','/usr/bin/com.webos.app.home',
 '/usr/palm/applications/com.webos.app.fullhome/appinfo.json',
 '/usr/bin/surface-manager','/usr/bin/surface-manager-starfish','/usr/bin/qml-runner'];
var FILTERS=['/etc/configd/layers/base/com.webos.surfacemanager.json',
 '/usr/lib/qml/KeyFilters','/usr/lib/qt5/qml/KeyFilters',
 '/usr/lib/qml/WebOS/KeyFilters','/usr/lib/qt5/qml/WebOS/KeyFilters'];
var CONFLICTS=['/tmp/inputhook','/tmp/infiniti-native-lab.lock','/tmp/infiniti-legacy-v8-lock',
 '/var/lib/webosbrew/init.d/inputhook','/var/lib/webosbrew/init.d/97-homekey',
 '/var/lib/webosbrew/init.d/64-luma-home','/var/lib/luma-home','/var/lib/webosbrew/rawin-launcher',
 '/var/lib/webosbrew/rawin-launcher-home','/var/lib/webosbrew/homechooser',
 '/media/developer/native-home','/var/lib/lightkeeper',
 '/home/root/lg-tv-vibehack/home-enabled','/home/root/lg-tv-vibehack/legacy-v8-enabled',
 '/home/root/lg-tv-vibehack/legacy-v8-session','/var/luna/preferences/webosbrew_failsafe'];
function read(p,max){
 var fd=fs.openSync(p,'r'),buf=new Buffer(max+1),n=0,k;
 try{while(n<buf.length && (k=fs.readSync(fd,buf,n,buf.length-n,null))>0)n+=k;}
 finally{fs.closeSync(fd);}
 return {text:buf.slice(0,Math.min(n,max)).toString('utf8'),truncated:n>max};
}
function decode(s){return s.replace(/\\([0-7]{3})/g,function(_,n){return String.fromCharCode(parseInt(n,8));});}
function mountRows(t){
 return t.split('\n').map(function(l){
  var v=l.split(' '),i=v.indexOf('-');
  if(i<6||v.length<i+4)return null;
  return {id:v[0],parent:v[1],root:decode(v[3]),target:decode(v[4]),options:v[5],fstype:v[i+1]};
 }).filter(function(x){return x!==null;});
}
function filterShape(o){
 var counts=[],seen=0;
 function walk(x,d){
  if(!x||typeof x!=='object'||d>12||seen++>10000)return;
  Object.keys(x).forEach(function(k){
   if(k==='keyFilters'||k==='com.webos.surfacemanager.keyFilters')
    counts.push({type:Array.isArray(x[k])?'array':typeof x[k],count:Array.isArray(x[k])?x[k].length:null});
   else walk(x[k],d+1);
  });
 }
 walk(o,0);return counts;
}
function inventory(root){
 function full(p){return root+p;}
 function inspect(p,hash){
  var x={path:p,status:'unknown'};
  try{
   var st=fs.statSync(full(p));
   x.status=st.isFile()?'file':st.isDirectory()?'directory':'other';
   x.size=st.size;
   if(hash&&st.isFile()&&st.size<=16*1024*1024){
    x.sha256=crypto.createHash('sha256').update(fs.readFileSync(full(p))).digest('hex');
   }
  }catch(e){x.status=e.code==='ENOENT'||e.code==='ENOTDIR'?'absent':'unreadable';}
  return x;
 }
 var targets=TARGETS.map(function(p){return inspect(p,true);});
 var filters=FILTERS.map(function(p){return inspect(p,true);});
 var config=filters[0],configShape=[];
 if(config.status==='file'){
  try{var b=read(full(config.path),1024*1024);if(b.truncated)throw Error('oversize');configShape=filterShape(JSON.parse(b.text));config.parse='ok';}
  catch(e){config.parse='unverified';}
 }
 var mountInfo=null,mountError=null;
 try{var m=read(full('/proc/self/mountinfo'),1024*1024);if(m.truncated)throw Error('truncated');mountInfo=mountRows(m.text);if(!mountInfo.length)throw Error('empty');}
 catch(e){mountInfo=null;mountError='mountinfo unavailable or incomplete';}
 var exact=mountInfo?mountInfo.filter(function(m){return TARGETS.indexOf(m.target)>=0||m.target.indexOf(HOME+'/')===0;}):[];
 var conflicts=CONFLICTS.map(function(p){return inspect(p,false);}).filter(function(x){return x.status!=='absent';});
 var remotes=[];
 try{fs.readdirSync(full('/sys/class/input')).filter(function(n){return /^event\d+$/.test(n);}).sort().forEach(function(n){
  try{var b=read(full('/sys/class/input/'+n+'/device/name'),256);if(!b.truncated&&/^LGE (M-RCU|RCU|Simple Premium)/.test(b.text))remotes.push({event:n,name:b.text.trim()});}catch(e){}
 });}catch(e){}
 var version=null;
 try{version=read(full('/etc/starfish-release'),4096).text.match(/\brelease\s+([0-9.]+)/i);version=version?version[1]:null;}catch(e){}
 function status(p){return targets.filter(function(x){return x.path===p;})[0].status;}
 var main=status(QML+'/main.qml'),ctrl=status(QML+'/Controllers/UIController.qml'),ctrl2=status(QML+'/UserInterfaceLayer/UIController.qml');
 var panel=main==='file'&&(ctrl==='file'||ctrl2==='file')?'STRUCTURE_CANDIDATE':
  main==='absent'||(ctrl==='absent'&&ctrl2==='absent')?'TARGET_MISSING':'UNVERIFIED';
 var key= config.parse==='ok'&&configShape.some(function(x){return x.type==='array'&&x.count>0;})?'CONFIG_LIST_PRESENT':
  config.parse==='ok'?'NO_NONEMPTY_LIST_IN_BASE_CONFIG':config.status==='absent'?'BASE_CONFIG_MISSING':'UNVERIFIED';
 return {scope:'read-only; file presence is not runtime compatibility or mount authorization',version:version,
  node:process.version,targets:targets,filterPaths:filters,filterShape:configShape,
  mounts:{available:mountInfo!==null,error:mountError,homeTargets:exact},
  conflicts:conflicts,remoteCandidates:remotes,
  decisions:{qmlPanel:panel,keyFilters:key,executable:status('/usr/bin/com.webos.app.home')==='file'?'FILE_PRESENT_ONLY':'NO_VERIFIED_TARGET',
   mount:'DISABLED_RESEARCH_ONLY',physicalInjection:'DISABLED',legacyObserver:'EXISTING_V9_1_ONLY'},
  limitations:['No QML patch compatibility checked','No active configd or compositor API verified','No mount or launch attempted','No proof remote candidates carry Home 773']};
}
module.exports={inventory:inventory,mountRows:mountRows,filterShape:filterShape};
if(require.main===module){
 if(process.argv.length!==2){console.error('Usage: node home-discovery.js');process.exit(2);}
 console.log(JSON.stringify(inventory(''),null,2));
}
