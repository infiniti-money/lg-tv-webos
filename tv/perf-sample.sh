#!/bin/sh
# Read-only CPU/RSS sampling on webOS; writes private report only.
set -eu
umask 077
DURATION=${1:-1800}
case "$DURATION" in ''|*[!0-9]*) echo 'Usage: perf-sample.sh [60..3600 seconds]'; exit 2;; esac
[ "$DURATION" -ge 60 ] && [ "$DURATION" -le 3600 ] || exit 2
OUT=$(mktemp /tmp/infiniti-perf.XXXXXX)
echo 'epoch,system_cpu_pct,mem_free_kib,mem_available_kib,watcher_rss_kib,webapp_rss_kib,webapp_count' > "$OUT"
python -u - "$DURATION" "$OUT" <<'PY'
from __future__ import print_function
import os,time,sys
duration=int(sys.argv[1])
def cpu():
    with open('/proc/stat') as f:
        a=list(map(int,f.readline().split()[1:9]))
    return sum(a),a[3]+a[4]
def memory():
    m={}
    with open('/proc/meminfo') as f:
        for line in f:
            a=line.split()
            if len(a)>1: m[a[0].rstrip(':')]=int(a[1])
    return m.get('MemFree',-1),m.get('MemAvailable',-1)
def rss():
    watcher=web=count=0
    for p in os.listdir('/proc'):
        if not p.isdigit(): continue
        try:
            with open('/proc/'+p+'/cmdline','rb') as f: cmd=f.read()
            if not isinstance(cmd,str): cmd=cmd.decode('utf-8','replace')
            if 'legacy-home-v8.py' not in cmd and 'com.infinitimoney.tvhome' not in cmd: continue
            with open('/proc/'+p+'/status') as f:
                size=next((int(x.split()[1]) for x in f if x.startswith('VmRSS:')),0)
            if 'legacy-home-v8.py' in cmd: watcher+=size
            else: web+=size;count+=1
        except (IOError,OSError,ValueError): pass
    return watcher,web,count
end=time.time()+duration
last=cpu()
with open(sys.argv[2],'a') as out:
    while time.time()<end:
        time.sleep(min(5,max(0,end-time.time())))
        now=cpu();delta=now[0]-last[0]
        pct=100.0*(delta-(now[1]-last[1]))/delta if delta>0 else -1
        last=now
        free,avail=memory();w,r,n=rss()
        out.write('%d,%.2f,%d,%d,%d,%d,%d\n'%(time.time(),pct,free,avail,w,r,n))
        out.flush()
PY
echo "Report: $OUT"
echo 'CPU is system-wide. Webapp RSS is a cmdline match only; count 0 means attribution unavailable, not zero memory.'
