'use strict';
var fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert');
var d=require('../tv/home-discovery.js');
var root=fs.mkdtempSync(path.join(os.tmpdir(),'infiniti-discovery-'));
function put(p,body){var target=root+p;fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);}
try{
 var home='/usr/palm/applications/com.webos.app.home';
 var conf='/etc/configd/layers/base/com.webos.surfacemanager.json';
 put('/proc/self/mountinfo','1 0 8:1 / / rw - ext4 /dev/root rw\n');
 var a=d.inventory(root);
 assert.strictEqual(a.decisions.qmlPanel,'TARGET_MISSING');
 assert.strictEqual(a.decisions.keyFilters,'BASE_CONFIG_MISSING');
 assert.strictEqual(a.decisions.mount,'DISABLED_RESEARCH_ONLY');
 put(home+'/qml/main.qml','import QtQuick 2.0');
 put(home+'/qml/Controllers/UIController.qml','Item {}');
 put(conf,JSON.stringify({keyFilters:[]}));
 a=d.inventory(root);
 assert.strictEqual(a.decisions.qmlPanel,'STRUCTURE_CANDIDATE');
 assert.strictEqual(a.decisions.keyFilters,'NO_NONEMPTY_LIST_IN_BASE_CONFIG');
 assert.ok(a.targets.some(function(x){return x.path===home+'/qml/main.qml'&&/^[a-f0-9]{64}$/.test(x.sha256);}));
 put(conf,JSON.stringify({'com.webos.surfacemanager.keyFilters':['/test.js']}));
 put('/proc/self/mountinfo','1 0 8:1 / / rw - ext4 /dev/root rw\n2 1 0:2 /scratch '+home+'/qml/main.qml rw - tmpfs tmpfs rw\n');
 put('/tmp/inputhook','marker');
 put('/sys/class/input/event3/device/name','LGE M-RCU - Builtin [0]\n');
 a=d.inventory(root);
 assert.strictEqual(a.decisions.keyFilters,'CONFIG_LIST_PRESENT');
 assert.strictEqual(a.mounts.homeTargets.length,1);
 assert.strictEqual(a.conflicts.length,1);
 assert.strictEqual(a.remoteCandidates[0].event,'event3');
 assert.strictEqual(a.decisions.mount,'DISABLED_RESEARCH_ONLY');
 put(conf,'{broken');
 assert.strictEqual(d.inventory(root).decisions.keyFilters,'UNVERIFIED');
 assert.strictEqual(d.mountRows('1 0 0:1 / /a\\040b rw - tmpfs tmpfs rw')[0].target,'/a b');
 var lab=fs.readFileSync('tv/home-mount-lab.sh','utf8');
 assert.ok(lab.indexOf('mount -o bind "$src" "$dst"')>=0);
 assert.ok(lab.indexOf('--scratch-only')>=0);
 assert.ok(lab.indexOf('/usr/palm')<0 && lab.indexOf('surface-manager')<0);
 console.log('Home discovery: missing/candidate/conflict/config/mount parsing and scratch-only guards passed');
}finally{fs.rmSync(root,{recursive:true,force:true});}
