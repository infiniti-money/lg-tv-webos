/* Read only glibc LD_DEBUG logs from an isolated lab; ES5/Node 0.12. */
'use strict';
var fs=require('fs'),path=require('path');
function parse(text){
 var groups=Object.create(null),inits=[],finis=[],errors=[],hookBindings=0;
 text.split(/\r?\n/).forEach(function(line){
  var m=line.match(/binding file (.+?) \[\d+\] to (.+?) \[\d+\]:.*?symbol [\x60']([^\x27\x60]+)[\x27\x60]/);
  if(m && /\/libinputhookpp\.so$/.test(m[1])){
   hookBindings++;
   var name=path.basename(m[2]),g=groups[name]||(groups[name]={events:0,symbols:Object.create(null)});
   g.events++;g.symbols[m[3]]=true;
  }
  m=line.match(/calling (init|fini):\s*(.+)/);
  if(m){(m[1]==='init'?inits:finis).push(m[2]);}
  if(/symbol lookup error|undefined symbol|relocation error/i.test(line))errors.push(line.trim());
 });
 var providers=Object.keys(groups).sort().map(function(n){
  return {provider:n,events:groups[n].events,symbols:Object.keys(groups[n].symbols).sort()};
 });
 return {hookBindingEvents:hookBindings,providers:providers,initEntered:inits,finiEntered:finis,loaderErrors:errors,
  hookInitEntered:inits.some(function(x){return /\/libinputhookpp\.so$/.test(x);}),
  note:'calling init is entry evidence, not constructor completion; provider binding does not prove ABI failure'};
}
module.exports=parse;
if(require.main===module){
 var dir=process.argv[2];
 if(!/^\/tmp\/infiniti-native-lab\.[A-Za-z0-9]+$/.test(dir||''))throw Error('not private lab directory');
 var logs=fs.readdirSync(dir).filter(function(n){return /^loader\.[0-9]+$/.test(n);}).sort();
 var result=logs.map(function(n){
  var p=path.join(dir,n),st=fs.lstatSync(p);
  if(!st.isFile()||st.size>32*1024*1024)return {file:n,status:'SKIPPED_NONREGULAR_OR_OVERSIZE'};
  return {file:n,status:'PARSED',report:parse(fs.readFileSync(p,'utf8'))};
 });
 console.log(JSON.stringify({traceFiles:result,traceAvailable:logs.length>0},null,2));
}
