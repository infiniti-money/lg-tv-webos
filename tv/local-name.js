/* Small IPv4 mDNS A-record responder for tan-dev.local only.
 * No hostname changes, DNS forwarding, service discovery of other hosts or dependencies.
 * ES5 / Node 0.12. Fail closed on name conflict; IP URL remains available.
 */
'use strict';
var dgram=require('dgram'),HOST='tan-dev.local',GROUP='224.0.0.251',PORT=5353;
function ipBytes(ip){var a=String(ip||'').split('.');if(a.length!==4||a.some(function(x){return !/^\d{1,3}$/.test(x)||Number(x)>255;}))return null;return new Buffer(a.map(Number));}
function name(s){var labels=s.split('.'),parts=[];labels.forEach(function(l){parts.push(new Buffer([l.length]));parts.push(new Buffer(l,'ascii'));});parts.push(new Buffer([0]));return Buffer.concat(parts);}
function readName(b,start){var p=start,end=-1,out=[],jumps=0,seen={};while(p<b.length&&jumps++<128){if(seen[p])throw Error('loop');seen[p]=true;var n=b[p++];if(!n)return {name:out.join('.').toLowerCase(),next:end<0?p:end};if((n&192)===192){if(p>=b.length)throw Error('pointer');var x=((n&63)<<8)|b[p++];if(end<0)end=p;p=x;continue;}if(n>63||p+n>b.length)throw Error('label');out.push(b.toString('ascii',p,p+n));p+=n;}throw Error('name');}
function parse(b){if(b.length<12||b.length>9000)throw Error('size');var f=b.readUInt16BE(2),qn=b.readUInt16BE(4),an=b.readUInt16BE(6),ns=b.readUInt16BE(8),ar=b.readUInt16BE(10),p=12,q=[],rr=[];if(qn+an+ns+ar>128)throw Error('count');for(var i=0;i<qn;i++){var n=readName(b,p);p=n.next;if(p+4>b.length)throw Error('question');q.push({name:n.name,type:b.readUInt16BE(p),cls:b.readUInt16BE(p+2)});p+=4;}for(i=0;i<an+ns+ar;i++){n=readName(b,p);p=n.next;if(p+10>b.length)throw Error('rr');var type=b.readUInt16BE(p),cls=b.readUInt16BE(p+2),ttl=b.readUInt32BE(p+4),len=b.readUInt16BE(p+8);p+=10;if(p+len>b.length)throw Error('rdata');if(n.name===HOST&&type===1&&(cls&32767)===1&&len===4)rr.push({ip:Array.prototype.join.call(b.slice(p,p+4),'.'),ttl:ttl,section:i<an?'answer':i<an+ns?'authority':'additional'});p+=len;}return {id:b.readUInt16BE(0),flags:f,questions:q,records:rr};}
function question(q){var b=new Buffer(4);b.writeUInt16BE(q.type,0);b.writeUInt16BE(q.cls&32767,2);return Buffer.concat([name(q.name),b]);}
function record(ip,ttl,flush){var a=ipBytes(ip),b=new Buffer(10);if(!a)throw Error('ip');b.writeUInt16BE(1,0);b.writeUInt16BE(flush?32769:1,2);b.writeUInt32BE(ttl,4);b.writeUInt16BE(4,8);return Buffer.concat([name(HOST),b,a]);}
function packet(ip,ttl,query,probe){var h=new Buffer(12);h.fill(0);var q=probe?[{name:HOST,type:255,cls:1}]:query?query.questions:[];h.writeUInt16BE(query?query.id:0,0);h.writeUInt16BE(probe?0:33792,2);h.writeUInt16BE(q.length,4);h.writeUInt16BE(probe?0:1,6);h.writeUInt16BE(probe?1:0,8);return Buffer.concat([h].concat(q.map(question),[record(ip,ttl,!probe&&!query)]));}
function matches(q){return q.name===HOST&&(q.type===1||q.type===255)&&(q.cls&32767)===1;}
function create(getIP,allowed,log){var sock=null,ip='',state='offline',timer=null,second=null,generation=0,lastSend=0;
 function clear(){if(timer!==null)clearTimeout(timer);if(second!==null)clearTimeout(second);timer=second=null;}
 function send(buf,port,addr){try{if(sock)sock.send(buf,0,buf.length,port,addr,function(){});}catch(e){}}
 function announce(ttl){if(ip)send(packet(ip,ttl,null,false),PORT,GROUP);}
 function close(goodbye){generation++;clear();if(sock){if(goodbye&&state==='ready')announce(0);try{sock.close();}catch(e){}sock=null;}state='offline';}
 function fail(reason){close(false);state=reason;log('mDNS '+reason+'; use IP URL');}
 function start(next){close(true);ip=next;if(!ipBytes(ip)){state='offline';return;}state='probing';var n=generation,s;try{s=dgram.createSocket({type:'udp4',reuseAddr:true});sock=s;}catch(e){fail('unavailable');return;}
 s.on('error',function(){if(n===generation)fail('unavailable');});
 s.on('message',function(buf,info){if(n!==generation||!allowed()||!sock)return;var p;try{p=parse(buf);}catch(e){return;}if((p.flags&30720)!==0)return;
 if(p.records.some(function(a){return a.ttl>0&&a.ip!==ip&&((p.flags&32768)!==0||a.section==='authority');})){fail('conflict');return;}
 if(state!=='ready'||(p.flags&32768)!==0||!p.questions.some(matches))return;
 if(info.port!==PORT){send(packet(ip,10,p,false),info.port,info.address);return;}
 if(p.records.some(function(a){return a.ip===ip&&a.ttl>=60;}))return;
 if(Date.now()-lastSend<1000)return;lastSend=Date.now();announce(120);
 });
 s.bind(PORT,function(){if(n!==generation)return;try{s.addMembership(GROUP,ip);s.setMulticastTTL(255);if(typeof s.setMulticastInterface==='function')s.setMulticastInterface(ip);}catch(e){fail('unavailable');return;}
 var count=0;function probe(){timer=null;if(n!==generation||!allowed())return;if(count<3){count++;send(packet(ip,120,null,true),PORT,GROUP);timer=setTimeout(probe,250);return;}state='ready';announce(120);second=setTimeout(function(){second=null;if(n===generation&&allowed()&&state==='ready')announce(120);},1000);log('mDNS ready: '+HOST);}
 timer=setTimeout(probe,Math.floor(Math.random()*250));});
 }
 return {refresh:function(){if(!allowed()){close(true);ip='';return;}var next=getIP();if(next!==ip)start(next);},stop:function(){close(true);ip='';},status:function(){return state;}};
}
module.exports={create:create,parse:parse,packet:packet,matches:matches};
