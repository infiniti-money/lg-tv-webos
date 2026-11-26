#!/usr/bin/env python
# Python 2.7.3 / ARMv7. Non-exclusive input observer; no firmware writes.
from __future__ import print_function
import errno
import fcntl
import glob
import json
import os
import select
import struct
import subprocess
import sys
import time

DATA = '/home/root/lg-tv-vibehack'
APP = 'com.infinitimoney.tvhome'
FAILSAFE = '/var/luna/preferences/webosbrew_failsafe'
LEGACY_HOOK = '/var/lib/webosbrew/init.d/97-homekey'
LUNA = '/usr/bin/luna-send'
EVENT = struct.Struct('<IIHHi')
PROOF = '/tmp/infiniti-legacy-v8-trial-ok'
HOME = 773

def log(msg):
    print('%s %s' % (time.strftime('%Y-%m-%d %H:%M:%S'), msg))
    sys.stdout.flush()

def flag(name):
    return os.path.join(DATA, 'legacy-v8-' + name)

def exists(name):
    return os.path.isfile(flag(name))

def allowed(mode):
    if os.path.exists(FAILSAFE) or os.path.exists(LEGACY_HOOK):
        return False
    # Never compete with Input Hook's existing Home binding.
    if os.path.exists(os.path.join(DATA, 'home-enabled')):
        return False
    if not any(os.path.isdir(os.path.join(base, APP)) for base in (
            '/media/developer/apps/usr/palm/applications',
            '/media/cryptofs/apps/usr/palm/applications')):
        return False
    if mode == 'watch':
        return exists('session')
    if mode == 'trial':
        return exists('trial') and not exists('enabled')
    return exists('enabled')

def luna(uri, payload, timeout=8):
    """Keep stdin PIPE open until the reply; EOF broke V6/V7 on legacy TV.
    Unlike /dev/tty this also works in a detached service. Never use communicate()
    here: it closes stdin before waiting for the response.
    """
    p = subprocess.Popen([LUNA, '-n', '1', '-f', uri, json.dumps(payload)],
                         stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                         stderr=subprocess.STDOUT, close_fds=True)
    chunks = []
    end = time.time() + timeout
    try:
        while time.time() < end:
            ready, _, _ = select.select([p.stdout], [], [], min(0.2, max(0, end-time.time())))
            if ready:
                data = os.read(p.stdout.fileno(), 4096)
                if not data:
                    break
                chunks.append(data)
                if sum(len(x) for x in chunks) > 65536:
                    raise RuntimeError('oversized Luna response')
                try:
                    reply = json.loads(b''.join(chunks).decode('utf-8'))
                    if isinstance(reply, dict):
                        if reply.get('returnValue') is not True:
                            raise RuntimeError('Luna rejected: %s' % reply)
                        return reply
                except ValueError:
                    pass
            elif p.poll() is not None:
                break
        raise RuntimeError('missing/invalid Luna JSON: %r' % b''.join(chunks)[:240])
    finally:
        if p.poll() is None:
            p.kill()
        p.wait()
        p.stdin.close()
        p.stdout.close()

def manager(method, payload):
    return luna('luna://com.webos.applicationManager/' + method, payload)

def power():
    return luna('luna://com.webos.service.tvpower/power/getPowerState', {}).get('state')

def redirect(mode):
    if not allowed(mode):
        return False
    try:
        manager('closeByAppId', {'id': APP})
    except Exception as e:
        # Not running is normal; still require affirmative launch and foreground.
        log('close: %s' % e)
    time.sleep(1)
    if not allowed(mode):
        return False
    try:
        manager('launch', {'id': APP})
        time.sleep(3)
        if not allowed(mode):
            return False
        reply = manager('getForegroundAppInfo', {})
        log('foreground: %s' % reply.get('appId'))
        return reply.get('appId') == APP
    except Exception as e:
        log('redirect failed: %s' % e)
        return False

def home_down(data):
    if len(data) != EVENT.size:
        return False
    _, _, kind, code, value = EVENT.unpack(data)
    return kind == 1 and code == HOME and value == 1

def input_paths():
    # Device numbering can change on reconnect. Prefer the actual named remote.
    preferred = []
    fallback = []
    for path in sorted(glob.glob('/dev/input/event*')):
        namepath = '/sys/class/input/' + os.path.basename(path) + '/device/name'
        try:
            with open(namepath) as fp:
                name = fp.read().strip()
        except IOError:
            name = ''
        if name.startswith('LGE M-RCU') or name == 'LGE RCU' or name == 'LGE Simple Premium':
            preferred.append(path)
        elif not name and os.path.basename(path) in ('event1','event4','event5','event6'):
            fallback.append(path)
    return preferred + fallback

def watch(mode):
    fds = {}
    last = 0
    prev = None
    next_power = 0
    failures = 0
    refresh = 0
    try:
        while allowed(mode):
            now = time.time()
            if now >= refresh:
                refresh = now + 10
                for path in input_paths():
                    if path not in fds.values():
                        try:
                            fds[os.open(path, os.O_RDONLY | os.O_NONBLOCK)] = path
                        except OSError:
                            pass
            ready, _, _ = select.select(list(fds), [], [], 1)
            trigger = False
            for fd in ready:
                try:
                    data = os.read(fd, EVENT.size)
                    if not data:
                        os.close(fd)
                        del fds[fd]
                    elif home_down(data):
                        trigger = True
                except OSError as e:
                    if e.errno not in (errno.EAGAIN, errno.EINTR):
                        os.close(fd)
                        del fds[fd]
            now = time.time()
            if mode == 'enabled' and exists('wake') and now >= next_power:
                next_power = now + 5
                try:
                    state = power()
                    if prev in ('Standby','Active Standby','Suspend','Screen Off') and state == 'Active':
                        trigger = True
                    prev = state
                except Exception:
                    prev = None
            if trigger and now - last >= 5 and allowed(mode):
                log('Home/wake trigger')
                time.sleep(1)
                if redirect(mode):
                    failures = 0
                else:
                    failures += 1
                    if failures >= 3:
                        log('three failed foreground checks; observer stopped')
                        return 1
                last = time.time()
    finally:
        for fd in fds:
            os.close(fd)
    return 0

def main():
    mode = sys.argv[1] if len(sys.argv) == 2 else ''
    if mode not in ('watch','trial','enabled') or os.getuid() != 0:
        return 2
    # Separate persistent lock; kernel releases it on exit or reboot.
    lock = open(os.path.join(DATA, 'legacy-v8.lock'), 'a')
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except IOError:
        log('observer already running')
        return 1
    if mode != 'watch':
        time.sleep(45)  # Homebrew's own failsafe marker must be cleared first.
    if not allowed(mode):
        log('disabled, missing app, or conflicting Home configuration')
        return 1
    if mode != 'watch':
        if not redirect(mode):
            log('boot launch not confirmed; no retry')
            return 1
        if mode == 'trial':
            with open(PROOF, 'w') as fp:
                fp.write('foreground confirmed\n')
            # Trial exits after one launch. Confirm manually before persistent watch.
            return 0
    return watch(mode)

if __name__ == '__main__':
    sys.exit(main())
