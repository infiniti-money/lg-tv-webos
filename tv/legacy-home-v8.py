#!/usr/bin/env python
# Python 2.7.3 / ARMv7. Non-exclusive input observer; no firmware writes.
from __future__ import print_function
import errno
import glob
import json
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

def luna(uri, payload, timeout=8, max_bytes=65536):
    """Keep stdin PIPE open until the reply; EOF broke V6/V7 on legacy TV.
    Unlike /dev/tty this also works in a detached service. Never use communicate()
    here: it closes stdin before waiting for the response.
    """
    # LG's stripped Python has no fcntl (subprocess imports it too).
    # Use POSIX pipes/fork/exec directly, keeping the writer of stdin open.
    in_r, in_w = os.pipe()
    out_r, out_w = os.pipe()
    try:
        pid = os.fork()
    except:
        for fd in (in_r, in_w, out_r, out_w):
            os.close(fd)
        raise
    if pid == 0:
        try:
            os.close(in_w)
            os.close(out_r)
            os.dup2(in_r, 0)
            os.dup2(out_w, 1)
            os.dup2(out_w, 2)
            os.close(in_r)
            os.close(out_w)
            os.execv(LUNA, [LUNA, '-n', '1', '-f', uri, json.dumps(payload)])
        except:
            os._exit(127)
    os.close(in_r)
    os.close(out_w)
    chunks = []
    size = 0
    end = time.time() + timeout
    try:
        while time.time() < end:
            ready, _, _ = select.select([out_r], [], [], min(0.2, max(0, end-time.time())))
            if not ready:
                continue
            data = os.read(out_r, 4096)
            if not data:
                break
            chunks.append(data)
            size += len(data)
            if size > max_bytes:
                raise RuntimeError('oversized Luna response')
            try:
                reply = json.loads(b''.join(chunks).decode('utf-8'))
            except ValueError:
                continue
            if isinstance(reply, dict):
                if reply.get('returnValue') is not True:
                    raise RuntimeError('Luna rejected: %s' % reply)
                return reply
        raise RuntimeError('missing/invalid Luna JSON: %r' % b''.join(chunks)[:240])
    finally:
        os.close(in_w)
        os.close(out_r)
        # Reap only our child. No broad process kills.
        if os.waitpid(pid, os.WNOHANG)[0] == 0:
            try:
                os.kill(pid, 9)
            except OSError as e:
                if e.errno != errno.ESRCH:
                    raise
            os.waitpid(pid, 0)


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
    if mode == 'probe':
        try:
            print(json.dumps(manager('getForegroundAppInfo', {})))
            return 0
        except Exception as e:
            log('probe failed: %s' % e)
            return 1
    if mode == 'catalog':
        if os.getuid() != 0:
            return 2
        try:
            reply = luna('luna://com.webos.applicationManager/listApps', {},
                         timeout=20, max_bytes=4 * 1024 * 1024)
            if not isinstance(reply.get('apps'), list):
                raise RuntimeError('listApps missing apps array')
            print(json.dumps(reply))
            return 0
        except Exception as e:
            sys.stderr.write('Legacy catalog: %s\n' % e)
            return 1
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
