#!/usr/bin/env python3
"""Network-free regression tests for the Developer Mode (no-root) app list."""
import asyncio
import importlib.util
import json
import os
import pathlib
import sys
import tempfile
import types
from unittest import mock


class DummySession:
    async def close(self):
        return None


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    with tempfile.TemporaryDirectory() as tmp:
        fake = types.ModuleType("lgtv")
        fake.HERE = tmp
        fake.insecure_ctx = lambda: None
        fake.session = lambda host: connect(host)
        state = {"points": [], "inputs": []}

        async def query(ws, uri):
            if uri.endswith("listLaunchPoints"):
                return {"launchPoints": state["points"]}
            return {"devices": state["inputs"]}

        async def connect(host):
            assert host == "192.0.2.50"
            return DummySession()

        fake.call = query
        with mock.patch.dict(sys.modules, {"lgtv": fake}):
            spec = importlib.util.spec_from_file_location("infiniti_sync_apps", root / "sync-apps.py")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

        folder = os.path.join(tmp, "app")
        os.makedirs(folder)
        existing = os.path.join(folder, "apps.js")
        with open(existing, "w", encoding="utf-8") as stream:
            stream.write("previous working apps")
        module.APP_DIR = folder

        # A transient empty Luna response must never wipe the working list.
        asyncio.run(module.main("192.0.2.50", False))
        assert pathlib.Path(existing).read_text(encoding="utf-8") == "previous working apps"

        state["points"] = [
            {"id": "com.example.netflix", "title": "Netflix", "icon": "https://cdn.other.example/icon.png"},
            {"id": "com.example.video", "title": "Video", "largeIcon": "http://192.0.2.50:3000/icon.png"},
            {"id": "com.example.hidden", "title": "Not visible", "hidden": True},
        ]
        state["inputs"] = [{"appId": "com.webos.app.hdmi1", "id": "HDMI 1"}]

        class ImageResponse:
            headers = {"Content-Type": "image/png; charset=binary"}
            def __init__(self):
                self.payload = b"fake-png"
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
            def read(self, n):
                assert n == module.MAX_ICON_BYTES + 1
                return self.payload

        def open_image(req, **kwargs):
            assert req.full_url == "http://192.0.2.50:3000/icon.png"
            return ImageResponse()

        with mock.patch.object(module.urllib.request, "urlopen", side_effect=open_image) as api:
            asyncio.run(module.main("192.0.2.50", False))
            assert api.call_count == 1, "External CDN images must not be downloaded"

        text = pathlib.Path(existing).read_text(encoding="utf-8")
        data = json.loads(text.split("window.TV_APPS = ", 1)[1].rstrip(" ;\n"))
        assert len(data["apps"]) == 2
        assert data["apps"][0]["id"] == "com.example.netflix"
        assert data["apps"][0]["icon"] == "icon.png", "Missing remote icon must preserve app"
        assert data["apps"][1]["icon"] == "icons/com.example.video.png"
        assert data["inputs"][0]["label"] == "HDMI 1"
        assert pathlib.Path(folder, "icons", "com.example.video.png").read_bytes() == b"fake-png"

        # Later failed icon retrieval must retain the last-known good local icon.
        with mock.patch.object(module.urllib.request, "urlopen", side_effect=OSError("network down")):
            asyncio.run(module.main("192.0.2.50", False))
        text = pathlib.Path(existing).read_text(encoding="utf-8")
        data = json.loads(text.split("window.TV_APPS = ", 1)[1].rstrip(" ;\n"))
        assert data["apps"][1]["icon"] == "icons/com.example.video.png"

        assert not module.safe_icon_url("https://example.org/icon.png", "192.0.2.50")
        assert not module.safe_icon_url("file:///etc/passwd", "192.0.2.50")
        assert module.safe_icon_url("http://192.0.2.50:3000/image.png", "192.0.2.50")
        print("No-root webOS 3 sync: missing icons, empty list preservation, TV-only fetch, atomic output passed.")


if __name__ == "__main__":
    main()
