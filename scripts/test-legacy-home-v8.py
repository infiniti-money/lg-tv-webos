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
        self.assertIn("trigger or (wake_trigger and now - last >= 2)", source)

    def test_no_optional_modules(self):
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        for name in ('json', 'fcntl', 'subprocess', 'glob'):
            self.assertNotIn('import ' + name, source)
        self.assertIn("helper('redirect-' + mode)", source)

    def test_boot_uses_readiness(self):
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        self.assertNotIn('time.sleep(45)', source)
        self.assertIn("helper('boot-' + mode)", source)

    def test_fast_home_and_sync(self):
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        self.assertIn('time.sleep(0.15)', source)
        self.assertIn('next_power = now + 2', source)
        self.assertIn('sync-enabled &', source)
        self.assertIn('foreground and render confirmed', source)

if __name__ == '__main__':
    unittest.main()
