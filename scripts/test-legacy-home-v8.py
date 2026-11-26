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

    def test_pipe_held_open(self):
        # Fake old luna-send: exits with no JSON on EOF, replies otherwise.
        with tempfile.TemporaryDirectory() as d:
            f = pathlib.Path(d) / "luna-send"
            f.write_text("#!/usr/bin/env python3\nimport select,sys,json\n"
                         "if select.select([sys.stdin],[],[],0.15)[0]: sys.exit(0)\n"
                         "print(json.dumps({'returnValue':True,'appId':'com.infinitimoney.tvhome'}),flush=True)\n")
            f.chmod(0o700)
            old = legacy.LUNA
            try:
                legacy.LUNA = str(f)
                self.assertEqual(legacy.manager('getForegroundAppInfo', {})['appId'], legacy.APP)
                f.write_text("#!/bin/sh\nexit 0\n")
                with self.assertRaises(RuntimeError):
                    legacy.manager('launch', {})
                f.write_text("#!/bin/sh\nprintf '%s\\n' '{\"returnValue\":false}'\n")
                with self.assertRaises(RuntimeError):
                    legacy.manager('launch', {})
            finally:
                legacy.LUNA = old

if __name__ == '__main__':
    unittest.main()
