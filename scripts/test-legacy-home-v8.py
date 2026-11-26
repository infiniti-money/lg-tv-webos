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

    def test_no_optional_modules(self):
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        for name in ('json', 'fcntl', 'subprocess', 'glob'):
            self.assertNotIn('import ' + name, source)
        self.assertIn("helper('redirect-' + mode)", source)

    def test_boot_uses_readiness(self):
        source = pathlib.Path("tv/legacy-home-v8.py").read_text()
        self.assertNotIn('time.sleep(45)', source)
        self.assertIn("helper('boot-' + mode)", source)

if __name__ == '__main__':
    unittest.main()
