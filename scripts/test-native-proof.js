'use strict';
var assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path');
var p=require('../tv/native-proof');
var b=Buffer.alloc(52);b[0]=127;b.write('ELF',1);b[4]=1;b[5]=1;b.writeUInt16LE(3,16);b.writeUInt16LE(40,18);assert.strictEqual(p.elf(b).type,3);
b[4]=2;assert.throws(function(){p.elf(b);});b[4]=1;b.writeUInt16LE(62,18);assert.throws(function(){p.elf(b);});
var accepted='HOME Execute invoked\nLaunch accepted: com.infinitimoney.tvhome\n', trace=accepted.repeat(3);
assert.strictEqual(p.assess(trace,'').candidate,true);
assert.strictEqual(p.assess(trace,'surface-manager-starfish [] LSM NL_HOME_SHOWN {}').candidate,false);
assert.strictEqual(p.assess(accepted,'').candidate,false);
assert.strictEqual(p.assess(trace+'Launch failed','').candidate,false);
var d=fs.mkdtempSync(path.join(os.tmpdir(),'native-proof-')), f=path.join(d,'log');
try{
 fs.writeFileSync(f,'old\n');var c=p.cursor(f);fs.appendFileSync(f,'new\n');assert.strictEqual(p.appended(f,c),'new\n');
 fs.truncateSync(f,0);assert.throws(function(){p.appended(f,c);});
 fs.writeFileSync(f,Buffer.alloc(262145));assert.throws(function(){p.appended(f,null);});
}finally{fs.rmSync(d,{recursive:true,force:true});}
console.log('Native ELF checks, fresh log evidence, ribbon rejection, truncation and bounded read passed.');
