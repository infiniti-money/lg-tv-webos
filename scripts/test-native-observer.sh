#!/bin/sh
# Host-only observer integration test. No ptrace; fake injector exits 7.
set -eu
work=$(mktemp -d /tmp/infiniti-native-lab.XXXXXX)
child=
cleanup(){
  if [ -n "$child" ]; then kill "$child" 2>/dev/null || true; wait "$child" 2>/dev/null || true; fi
  rm -rf "$work"
}
trap cleanup 0
cat > "$work/probe.c" <<'C'
#include <unistd.h>
int main(void) { for (;;) pause(); return 0; }
C
cc "$work/probe.c" -o "$work/thumb-probe"
printf '%s\n' '#!/bin/sh' 'exit 7' > "$work/ezinject"
chmod 700 "$work/ezinject"
"$work/thumb-probe" 30 &
child=$!
n=0
while [ "$(readlink "/proc/$child/exe" 2>/dev/null || true)" != "$work/thumb-probe" ]; do
  [ "$n" -lt 5 ] || exit 1
  n=$((n+1)); sleep 1
done
rc=0
node tv/native-inject-observe.js "$work" "$child" "$$" || rc=$?
test "$rc" = 1
node -e 'var x=require(process.argv[1]);if(x.exitCode!==7||x.signal!==null||x.timedOut||x.elapsedMs<0)process.exit(1)' "$work/inject-result.json"
echo 'Observer captured actual fake-injector exit 7'
