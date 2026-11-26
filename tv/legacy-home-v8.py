#!/usr/bin/env python
# Python 2.7.3 / ARMv7. Non-exclusive input observer; no firmware writes.
from __future__ import print_function
import errno
import os
import select
import struct
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

def disarm_enabled():
    for name in ('enabled', 'wake'):
        try:
            os.unlink(flag(name))
        except OSError as e:
            if e.errno != errno.ENOENT:
                raise

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

def helper(action):
    # Only fixed action names, no user input or shell expansion.
    return os.system('/usr/bin/node ' + DATA + '/legacy-luna.js ' + action)

def power():
    result = helper('power')
    if result == 0:
        return 'Active'
    if result == (3 << 8):
        return 'Standby'
    return None

def redirect(mode):
    if not allowed(mode):
        return False
    return helper('redirect-' + mode) == 0 and allowed(mode)

def home_down(data):
    if len(data) != EVENT.size:
        return False
    _, _, kind, code, value = EVENT.unpack(data)
    return kind == 1 and code == HOME and value == 1

def input_paths():
    # Device numbering can change on reconnect. Prefer the actual named remote.
    preferred = []
    fallback = []
    for entry in sorted(os.listdir('/dev/input')):
        if not entry.startswith('event') or not entry[5:].isdigit():
            continue
        path = '/dev/input/' + entry
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
    log('READY: press Home 773; mode=' + mode)
    try:
        while allowed(mode):
            now = time.time()
            if now >= refresh:
                refresh = now + 10
                for path in input_paths():
                    if path not in fds.values():
                        try:
                            fds[os.open(path, os.O_RDONLY | os.O_NONBLOCK)] = path
                            log('input: ' + path)
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
                        if mode == 'enabled':
                            disarm_enabled()
                        return 1
                last = time.time()
    finally:
        for fd in fds:
            os.close(fd)
    return 0

def main():
    mode = sys.argv[1] if len(sys.argv) == 2 else ''
    if mode in ('probe','catalog'):
        return 0 if helper(mode) == 0 else 1
    if mode not in ('watch','trial','enabled') or os.getuid() != 0:
        return 2
    # Atomic directory lock, no fcntl dependency. Stale locks fail closed;
    # /tmp normally clears on reboot. Never remove an unverified active lock.
    lock = '/tmp/infiniti-legacy-v8-lock'
    try:
        os.mkdir(lock, 448)
    except OSError as e:
        log('observer lock unavailable: %s; check for another process' % e)
        return 1
    try:
        with open(os.path.join(lock, 'pid'), 'w') as fp:
            fp.write(str(os.getpid()) + '\n')
        return run_mode(mode)
    finally:
        try:
            os.unlink(os.path.join(lock, 'pid'))
        except OSError:
            pass
        os.rmdir(lock)

def run_mode(mode):
    if mode != 'watch':
        time.sleep(45)  # Homebrew's own failsafe marker must be cleared first.
    if not allowed(mode):
        log('disabled, missing app, or conflicting Home configuration')
        return 1
    if mode != 'watch':
        if not redirect(mode):
            log('boot launch not confirmed; no retry')
            if mode == 'enabled':
                disarm_enabled()
            return 1
        if mode == 'trial':
            with open(PROOF, 'w') as fp:
                fp.write('foreground confirmed\n')
            # Trial exits after one launch. Confirm manually before persistent watch.
            return 0
    return watch(mode)

if __name__ == '__main__':
    sys.exit(main())
