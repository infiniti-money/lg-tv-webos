#!/usr/bin/env python
# Python 2.7.3 / ARMv7. Non-exclusive input observer; no firmware writes.
from __future__ import print_function
import errno
import os
import select
import signal
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
    if exists('ribbon') and (os.path.exists('/tmp/inputhook') or os.path.exists('/var/lib/webosbrew/init.d/inputhook')):
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

def spawn_helper(action):
    # No shell, optional subprocess module, or inherited input device ownership.
    pid = os.fork()
    if pid == 0:
        try:
            for name in os.listdir('/proc/self/fd'):
                if name.isdigit() and int(name) > 2:
                    try:
                        os.close(int(name))
                    except OSError:
                        pass
            os.execv('/usr/bin/node', ['/usr/bin/node', DATA + '/legacy-luna.js', action])
        finally:
            os._exit(127)
    return pid


def poll_helper(pid):
    try:
        child, status = os.waitpid(pid, os.WNOHANG)
        return status if child else None
    except OSError as e:
        if e.errno == errno.EINTR:
            return None
        if e.errno == errno.ECHILD:
            return 1 << 8
        raise


def stop_helper(pid):
    # Only our unreaped child; never signal a process found by name.
    try:
        os.kill(pid, signal.SIGKILL)
    except OSError as e:
        if e.errno != errno.ESRCH:
            raise
    while True:
        try:
            os.waitpid(pid, 0)
            return
        except OSError as e:
            if e.errno == errno.ECHILD:
                return
            if e.errno != errno.EINTR:
                raise


class HomeQueue(object):
    """One child + one coalesced Home intent. Never blocks on render."""
    def __init__(self, mode, spawn=spawn_helper, poll=poll_helper, stop=stop_helper):
        self.mode, self.spawn, self.poll, self.stop = mode, spawn, poll, stop
        self.pid, self.kind, self.deadline = None, None, 0
        self.pending, self.due = False, 0
        self.last_press, self.pending_since, self.repeat = None, 0, False
        self.received, self.coalesced, self.started, self.completed = 0, 0, 0, 0

    def press(self, now):
        repeated = self.last_press is not None and 0 <= now - self.last_press <= 3.0
        self.last_press = now
        self.received += 1
        if self.pending:
            self.coalesced += 1
        else:
            self.pending, self.due = True, now + 0.15
            self.pending_since = now
        if repeated:
            self.repeat = True
            # Wait briefly for the native Home animation, without starving a burst.
            self.due = min(self.pending_since + 1.0, max(self.due, now + 0.35))
        log('Home input #%d; pending=1; coalesced=%d' % (self.received, self.coalesced))

    def start(self, kind, now):
        if self.pid is not None:
            return False
        action = 'redirect-' + self.mode if kind == 'home' else ('wake-enabled' if kind == 'wake' else 'power')
        if kind == 'home' and self.repeat:
            action = 'redirect-repeat-' + self.mode
        try:
            self.pid = self.spawn(action)
        except OSError as e:
            log('helper spawn failed: %s' % e)
            self.pid = None
            return False
        self.kind, self.deadline = kind, now + (4 if kind == 'power' else 25)
        if kind == 'home':
            self.pending = False
            self.repeat = False
            self.started += 1
            log('Home trigger; dispatched=%d' % self.started)
        elif kind == 'wake':
            log('Wake trigger')
        return True

    def reap(self, now):
        if self.pid is None:
            return None
        status = self.poll(self.pid)
        if status is None and now < self.deadline:
            return None
        if status is None:
            self.stop(self.pid)
            status = 1 << 8
            log('helper timed out: ' + self.kind)
        kind = self.kind
        self.pid, self.kind = None, None
        if kind == 'home':
            self.completed += 1
            log('Home completion #%d status=%d' % (self.completed, status))
        return kind, status

    def close(self):
        self.pending = False
        self.repeat = False
        if self.pid is not None:
            self.stop(self.pid)
            self.pid, self.kind = None, None


def home_down(data):
    if len(data) != EVENT.size:
        return False
    _, _, kind, code, value = EVENT.unpack(data)
    return kind == 1 and code == HOME and value == 1

def home_press_time(data):
    if not home_down(data):
        return None
    sec, usec, _, _, _ = EVENT.unpack(data)
    return sec + usec / 1000000.0


def distinct_home_press(stamp, previous):
    # Deduplicate copies of one physical press, not time spent in Luna/render.
    return stamp is not None and (previous is None or abs(stamp - previous) >= 0.12)


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
        elif not name and os.path.basename(path) in ('event1','event3','event4','event5','event6'):
            fallback.append(path)
    return preferred + fallback

# V9: only consume new complete system-log lines, never replay old boot history.
class RibbonLog(object):
    def __init__(self, path='/var/log/messages'):
        self.path, self.identity, self.offset, self.partial = path, None, 0, b''
    def read(self):
        try:
            with open(self.path, 'rb') as fp:
                st = os.fstat(fp.fileno())
                identity = (st.st_dev, st.st_ino)
                if identity != self.identity or st.st_size < self.offset:
                    self.identity, self.offset, self.partial = identity, st.st_size, b''
                    return []
                fp.seek(self.offset)
                # After backlog, discard history instead of triggering stale recovery.
                if st.st_size - self.offset > 65536:
                    self.offset, self.partial = st.st_size, b''
                    return []
                data = fp.read(65536)
                self.offset = fp.tell()
        except (IOError, OSError):
            self.identity, self.partial = None, b''
            return []
        lines = (self.partial + data).split(b'\n')
        self.partial = lines.pop()[-4096:]
        events = []
        for line in lines:
            if b'surface-manager-starfish' not in line or b' LSM NL_HOME_' not in line:
                continue
            if b' LSM NL_HOME_SHOWN ' in line:
                events.append(('shown', b'"foregroundId":"com.infinitimoney.tvhome"' in line))
            elif b' LSM NL_HOME_HIDDEN ' in line:
                events.append(('hidden', False))
        return events

def ribbon_events(queue, events, now, fast=False):
    # Hidden is diagnostic only; this firmware has not yet confirmed that event.
    # Require a pending physical Home intent; no log-only launches or synthetic keys.
    for state, own in events:
        log('V9 ribbon %s; foreground_tan=%d' % (state, own))
        if state == 'shown' and queue.pending and queue.last_press is not None and 0 <= now - queue.last_press <= 1.5:
            if own:
                queue.repeat = True
            queue.due = min(queue.due, now + (0.025 if fast else 0.15))
            log('V9 correlated Home ribbon; bounded recovery requested')

def watch(mode):
    fds = {}
    last = 0
    last_home = None
    queue = HomeQueue(mode)
    ribbon = RibbonLog() if exists('ribbon') else None
    fast = ribbon is not None and exists('fast')
    if fast:
        log('V9.1 fast recovery selected; native ribbon may remain visible')
    if ribbon is not None:
        ribbon.read()  # baseline before listening
        log('V9 ribbon correlation enabled; no injection or mounts')
    prev = None
    next_power = 0
    next_sync = time.time() + 10
    failures = 0
    refresh = 0
    previous_tick = time.time()
    log('READY: press Home 773; mode=' + mode)
    if mode == 'enabled' and exists('wallpaper'):
        os.system('/usr/bin/node ' + DATA + '/wallpaper-server.js --legacy-managed >> /tmp/infiniti-wallpaper.log 2>&1 </dev/null &')
    try:
        while allowed(mode):
            now = time.time()
            if now - previous_tick > 15:
                log('observer gap: %.1fs; power state must confirm wake' % (now-previous_tick))
            previous_tick = now
            if now >= refresh:
                refresh = now + 10
                try:
                    paths = input_paths()
                except OSError as e:
                    log('input scan unavailable: %s' % e)
                    paths = []
                for path in paths:
                    if path not in fds.values():
                        try:
                            fds[os.open(path, os.O_RDONLY | os.O_NONBLOCK)] = path
                            log('input: ' + path)
                        except OSError:
                            pass
            try:
                ready, _, _ = select.select(list(fds), [], [], 0.05 if fast else (0.15 if ribbon is not None or queue.pid is not None or queue.pending else 1))
            except (OSError, select.error) as e:
                if e.args and e.args[0] == errno.EINTR:
                    continue
                log('input select failed: %s; reopening devices' % e)
                for fd in list(fds):
                    try:
                        os.close(fd)
                    except OSError:
                        pass
                fds.clear()
                refresh = 0
                time.sleep(1)
                continue
            stamps = []
            wake_trigger = False
            for fd in ready:
                try:
                    data = os.read(fd, EVENT.size * 32)
                    if not data:
                        os.close(fd)
                        del fds[fd]
                    else:
                        for offset in range(0, len(data) - EVENT.size + 1, EVENT.size):
                            stamp = home_press_time(data[offset:offset + EVENT.size])
                            if stamp is not None:
                                stamps.append(stamp)
                except OSError as e:
                    if e.errno not in (errno.EAGAIN, errno.EINTR):
                        os.close(fd)
                        del fds[fd]
            now = time.time()
            for stamp in sorted(stamps):
                if distinct_home_press(stamp, last_home):
                    last_home = stamp
                    queue.press(now)
                    if ribbon is not None and not queue.repeat:
                        queue.due = max(queue.due, now + (0.25 if fast else 0.6))
            if ribbon is not None:
                ribbon_events(queue, ribbon.read(), now, fast)
            result = queue.reap(now)
            wake_enabled = mode == 'enabled' and exists('wake')
            if not wake_enabled:
                prev = None
            if result is not None:
                kind, status = result
                if kind == 'power':
                    state = 'Active' if status == 0 else ('Standby' if status == (3 << 8) else None)
                    if wake_enabled and state is not None:
                        wake_trigger = prev == 'Standby' and state == 'Active'
                        if wake_trigger:
                            try:
                                with open('/tmp/infiniti-idle-wake.new', 'w') as fp:
                                    fp.write(str(int(now * 1000)))
                                os.rename('/tmp/infiniti-idle-wake.new', '/tmp/infiniti-idle-wake')
                            except (IOError, OSError):
                                pass
                        if state != prev:
                            log('power: %s' % state)
                        prev = state
                else:
                    failures = 0 if status == 0 else failures + 1
                    last = now
            if not allowed(mode):
                break
            if queue.pid is None:
                if queue.pending and now >= queue.due:
                    if not queue.start('home', now):
                        failures += 1
                        queue.due = now + 1
                elif not queue.pending and wake_trigger and now - last >= 2:
                    if not queue.start('wake', now):
                        failures += 1
                elif not queue.pending and wake_enabled and now >= next_power:
                    next_power = now + 2
                    queue.start('power', now)
            if failures >= 3:
                log('three failed foreground checks; observer stopped')
                if mode == 'enabled':
                    disarm_enabled()
                return 1
            if mode == 'enabled' and now >= next_sync and allowed(mode):
                next_sync = now + 120
                if prev != 'Standby':
                    # Background catalog only; never blocks remote input.
                    os.system('/usr/bin/node ' + DATA + '/legacy-luna.js sync-enabled &')
    finally:
        queue.close()
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
    if mode == 'watch' and not allowed(mode):
        log('disabled, missing app, or conflicting Home configuration')
        return 1
    if mode != 'watch':
        try:
            with open('/proc/sys/kernel/random/boot_id') as fp:
                log('boot id: ' + fp.read().strip())
        except IOError:
            pass
        # Node polls read-only readiness and respects Homebrew failsafe.
        # A cold boot never closes the app and attempts at most one launch.
        log('adaptive boot readiness started')
        if helper('boot-' + mode) != 0 or not allowed(mode):
            log('boot launch not confirmed; no retry')
            if mode == 'enabled':
                disarm_enabled()
            return 1
        if mode == 'trial':
            with open(PROOF, 'w') as fp:
                fp.write('foreground and render confirmed\n')
            # Trial exits after one launch. Confirm manually before persistent watch.
            return 0
    return watch(mode)

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log('watch stopped by user')
        sys.exit(130)
