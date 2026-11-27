#!/usr/bin/env node
/* Read-only ELF inspection and bounded fresh-log evidence. ES5 / Node 0.12. */
'use strict';
var fs=require('fs');
var TRACE='/tmp/infiniti-homekey.log', SYS='/var/log/messages';
var BASE='/tmp/infiniti-native-proof.json';
function elf(b) {
  if(b.length<52 || b[0]!==127 || b.toString('ascii',1,4)!=='ELF') throw Error('Not ELF');
  if(b[4]!==1 || b[5]!==1 || b.readUInt16LE(18)!==40) throw Error('Expected 32-bit little-endian ARM ELF');
  return {type:b.readUInt16LE(16),flags:b.readUInt32LE(36)};
}
function cursor(p) {
  try {var s=fs.statSync(p);return {dev:s.dev,ino:s.ino,size:s.size};}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
}
function appended(p,c) {
  var fd=fs.openSync(p,'r');
  try {
    var s=fs.fstatSync(fd), offset=c?c.size:0;
    if(c&&(s.dev!==c.dev||s.ino!==c.ino||s.size<offset))throw Error('Log rotated/truncated: '+p);
    if(s.size-offset>262144)throw Error('Log window too large: '+p);
    var b=new Buffer(s.size-offset);
    var n=fs.readSync(fd,b,0,b.length,offset);
    if(n!==b.length)throw Error('Log changed during read: '+p);
    return b.toString('utf8');
  }finally{fs.closeSync(fd);}
}
function assess(trace,sys) {
  var invoked=(trace.match(/HOME Execute invoked/g)||[]).length;
  var accepted=(trace.match(/Launch accepted: com\.infinitimoney\.tvhome/g)||[]).length;
  var shown=(sys.match(/surface-manager-starfish[^\n]* LSM NL_HOME_SHOWN /g)||[]).length;
  return {invoked:invoked,accepted:accepted,ribbonShown:shown,
    candidate:invoked===3&&accepted===3&&shown===0&&!/Launch failed|Inactive:|package missing/.test(trace)};
}
function bootId(){return fs.readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim();}
function run(args) {
  if(args[0]==='elf'){
    var fd=fs.openSync(args[1],'r'), b=new Buffer(52);
    try{if(fs.readSync(fd,b,0,52,0)!==52)throw Error('Short ELF header');var info=elf(b);console.log('ARM ELF32 LE, type='+info.type+', flags=0x'+info.flags.toString(16));}
    finally{fs.closeSync(fd);}
  }else if(args[0]==='begin'){
    var sys=cursor(SYS);if(!sys)throw Error('System log missing');
    var state={boot:bootId(),time:Date.now(),trace:cursor(TRACE),sys:sys};
    var tmp=BASE+'.'+process.pid;
    fs.writeFileSync(tmp,JSON.stringify(state),{mode:384,flag:'wx'});
    fs.renameSync(tmp,BASE);
    console.log('Baseline saved. Press physical Home exactly 3 times, 5s apart; observe screen. No manual launcher invocation.');
  }else if(args[0]==='check'){
    var state=JSON.parse(fs.readFileSync(BASE,'utf8'));
    if(state.boot!==bootId()||Date.now()<state.time||Date.now()-state.time>120000)throw Error('Baseline expired or rebooted; begin again');
    var result=assess(appended(TRACE,state.trace),appended(SYS,state.sys));
    console.log(JSON.stringify(result));
    if(!result.candidate)throw Error('Native Home evidence insufficient or ribbon detected');
    console.log('Candidate log evidence only; visually verify zero ribbon and remote keys. Not a hardware certification.');
  }else throw Error('Usage: native-proof.js elf FILE | begin | check');
}
if(require.main===module){try{run(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={elf:elf,assess:assess,appended:appended,cursor:cursor};
