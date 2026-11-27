#!/usr/bin/env python3
"""Host-side tests; no real TV, device or root changes."""
import importlib.util
import os
import pathlib
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("legacy", "tv/legacy-home-v8.py")
legacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy)

class LegacyTests(unittest.TestCase):
    def test_events(self):
        event = lambda code, value: legacy.EVENT.pack(0, 0, 1, code, value)
        self.assertTrue(legacy.home_down(event(773, 1)))
        self.assertFalse(legacy.home_down(event(773, 0)))
        self.assertFalse(legacy.home_down(event(773, 2)))
        self.assertFalse(legacy.home_down(event(272, 1)))
        self.assertFalse(legacy.home_down(b'bad'))

    def test_distinct_home_presses(self):
        event = lambda sec, usec, value: legacy.EVENT.pack(sec, usec, 1, 773, value)
        first = legacy.home_press_time(event(100, 0, 1))
        second = legacy.home_press_time(event(100, 500000, 1))
        duplicate = legacy.home_press_time(event(100, 30000, 1))
        self.assertTrue(legacy.distinct_home_press(first, None))
        self.assertFalse(legacy.distinct_home_press(duplicate, first))
        self.assertTrue(legacy.distinct_home_press(second, first))
        self.assertIsNone(legacy.home_press_time(event(100, 600000, 2)))
        self.assertFalse(legacy.distinct_home_press(None, second))
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        self.assertIn("queue.press(now)", source)

    def test_observer_recovers_select_failure(self):
        from unittest.mock import patch
        state = iter([True, True, True, False])
        with patch.object(legacy, 'allowed', side_effect=lambda mode: next(state, False)), \
             patch.object(legacy, 'input_paths', return_value=[]), \
             patch.object(legacy.select, 'select', side_effect=[OSError(9, 'bad fd'), ([], [], [])]), \
             patch.object(legacy.time, 'sleep'), \
             patch.object(legacy, 'log'):
            self.assertEqual(legacy.watch('watch'), 0)

    def test_100_home_presses_while_luna_busy(self):
        from unittest.mock import patch
        # Mixed 150ms, 530ms (real trace), 1s, 5s intervals.
        intervals = [15, 53, 100, 500]
        presses, tick = [], 0
        for i in range(100):
            tick += intervals[i % len(intervals)]
            presses.append(tick)
        children, starts, stopped = {}, [], []
        clock = [0]
        def spawn(action):
            self.assertFalse(children, 'only one Luna child allowed')
            pid = len(starts) + 1
            children[pid] = clock[0] + 200
            starts.append((clock[0], action))
            return pid
        def poll(pid):
            if clock[0] < children[pid]:
                return None
            del children[pid]
            return 0
        def stop(pid):
            stopped.append(pid)
            del children[pid]
        q = legacy.HomeQueue('enabled', spawn, poll, stop)
        with patch.object(legacy, 'log'):
            for t in range(presses[-1] + 500):
                clock[0] = t
                if t in presses:
                    q.press(t / 100.0)
                q.reap(t / 100.0)
                if q.pid is None and q.pending and t / 100.0 >= q.due:
                    self.assertTrue(q.start('home', t / 100.0))
                self.assertLessEqual(len(children), 1)
            self.assertEqual(q.received, 100)
            self.assertEqual(q.started + q.coalesced, 100)
            self.assertEqual(q.completed, q.started)
            self.assertGreater(q.coalesced, 0)
            self.assertFalse(q.pending)
            self.assertIsNone(q.pid)
            self.assertEqual(stopped, [])
            self.assertGreaterEqual(starts[-1][0], presses[-1])
            print('100 physical intents: %d dispatches, %d coalesced, %d completions' %
                  (q.started, q.coalesced, q.completed))

    def test_repeat_home_after_fast_completion(self):
        from unittest.mock import patch
        calls = []
        q = legacy.HomeQueue('enabled', lambda action: calls.append(action) or 7,
                             lambda pid: 0, lambda pid: None)
        with patch.object(legacy, 'log'):
            q.press(10)
            self.assertTrue(q.start('home', 10.15))
            self.assertEqual(q.reap(10.5), ('home', 0))
            q.press(10.8)
            self.assertTrue(q.repeat)
            self.assertAlmostEqual(q.due, 11.15)
            self.assertTrue(q.start('home', 11.15))
            self.assertEqual(q.reap(13), ('home', 0))
            q.press(15)
            self.assertFalse(q.repeat)
            self.assertTrue(q.start('home', 15.15))
        self.assertEqual(calls, ['redirect-enabled', 'redirect-repeat-enabled', 'redirect-enabled'])

    def test_repeat_home_burst_has_bounded_delay(self):
        from unittest.mock import patch
        calls = []
        q = legacy.HomeQueue('watch', lambda action: calls.append(action) or 7,
                             lambda pid: 0, lambda pid: None)
        with patch.object(legacy, 'log'):
            q.press(20)
            q.press(20.1)
            q.press(20.4)
            q.press(20.9)
            self.assertTrue(q.repeat)
            self.assertLessEqual(q.due, 21.0)
            self.assertEqual(q.coalesced, 3)
            self.assertTrue(q.start('home', 21))
            self.assertFalse(q.repeat)
            self.assertEqual(q.reap(23), ('home', 0))
        self.assertEqual(calls, ['redirect-repeat-watch'])

    def test_timeout_and_cancel(self):
        from unittest.mock import patch
        stopped = []
        q = legacy.HomeQueue('enabled', lambda action: 7, lambda pid: None, stopped.append)
        with patch.object(legacy, 'log'):
            q.press(0)
            self.assertTrue(q.start('home', 1))
            q.press(2)
            self.assertIsNone(q.reap(22))
            self.assertEqual(q.reap(23), ('home', 256))
            self.assertEqual(stopped, [7])
            self.assertTrue(q.pending)
            self.assertTrue(q.start('home', 24))
            q.close()
            self.assertEqual(stopped, [7, 7])
            self.assertFalse(q.pending)

    def test_no_optional_modules(self):
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        for name in ('json', 'fcntl', 'subprocess', 'glob'):
            self.assertNotIn('import ' + name, source)
        self.assertIn("self.spawn(action)", source)
        self.assertIn("os.WNOHANG", source)

    def test_boot_uses_readiness(self):
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        self.assertNotIn('time.sleep(45)', source)
        self.assertIn("helper('boot-' + mode)", source)

    def test_fast_home_and_sync(self):
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        self.assertIn('now + 0.15', source)
        self.assertIn('next_power = now + 2', source)
        self.assertIn('sync-enabled &', source)
        self.assertIn('foreground and render confirmed', source)

if __name__ == '__main__':
    unittest.main()
