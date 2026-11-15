#!/usr/bin/env python3
"""Pure/offline tests: never connect to an actual LG television."""
import importlib.util
from pathlib import Path
import unittest

PATH = Path(__file__).with_name("tv-service-wake.py")
spec = importlib.util.spec_from_file_location("tv_service_wake", PATH)
wake = importlib.util.module_from_spec(spec)
spec.loader.exec_module(wake)


class SafeWakeTests(unittest.TestCase):
    def test_launch_only_if_both_services_down(self):
        self.assertTrue(wake.should_launch({"ssh": False, "glasshouse": False}))
        for state in [
            {"ssh": True, "glasshouse": False},
            {"ssh": False, "glasshouse": True},
            {"ssh": True, "glasshouse": True}
        ]:
            self.assertFalse(wake.should_launch(state))

    def test_status_does_not_require_websocket_package(self):
        old = wake.service_state
        old_tcp = wake.tcp_open
        try:
            wake.service_state = lambda host: {"ssh": True, "glasshouse": True}
            wake.tcp_open = lambda host, port, timeout=1: False
            self.assertEqual(wake.main(["--tv", "192.168.2.154", "--status"]), 0)
        finally:
            wake.service_state = old
            wake.tcp_open = old_tcp

    def test_no_system_mutations_or_forced_input(self):
        code = PATH.read_text("utf-8")
        for forbidden in [
            "mount --bind", "umount ", "deleteDevice", "addDevice",
            "ssap://tv/switchInput", 'com.webos.app.livetv',
            "subprocess.run(", "os.system(", "sudo ", "rm -rf "
        ]:
            self.assertNotIn(forbidden, code)
        self.assertIn('ssap://system.launcher/launch', code)
        self.assertIn('org.webosbrew.hbchannel', code)

if __name__ == "__main__":
    unittest.main()
