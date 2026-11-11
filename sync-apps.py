#!/usr/bin/env python3
"""Sync visible webOS app launchpoints/icons for Developer Mode (no root).

    python3 sync-apps.py <TV IP>
    python3 sync-apps.py <TV IP> --list

App discovery requires the TV's pairing confirmation (SSAP) and a reachable
network. Unlike root-side sync.js this runs on the user's computer.
Compatibility fallback design: keep a launchable app when its icon is missing,
and never replace an existing app list with an empty transient Luna response.
"""
import asyncio
import json
import os
import re
import sys
import tempfile
import urllib.parse
import urllib.request

import lgtv

APP_DIR = os.path.join(lgtv.HERE, "app")
MAX_ICON_BYTES = 2 * 1024 * 1024


def local_icon_name(app_id):
    return re.sub(r"[^A-Za-z0-9._-]", "_", app_id[:160]) + ".png"


def safe_icon_url(raw_url, tv_host):
    """Only fetch icons from the TV itself, not arbitrary third-party hosts."""
    if not isinstance(raw_url, str):
        return ""
    parsed = urllib.parse.urlsplit(raw_url)
    if parsed.scheme not in ("http", "https") or parsed.hostname != tv_host:
        return ""
    if parsed.username is not None or parsed.password is not None:
        return ""
    return raw_url


def download_tv_icon(url, dest, context):
    """Bounded download + atomic replacement, preserving previous good icons."""
    req = urllib.request.Request(url, headers={"Accept": "image/*"})
    with urllib.request.urlopen(req, context=context, timeout=10) as response:
        content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if not content_type.startswith("image/"):
            raise ValueError("TV URL did not return an image")
        data = response.read(MAX_ICON_BYTES + 1)
        if len(data) > MAX_ICON_BYTES or not data:
            raise ValueError("TV icon missing or exceeds 2 MiB")
    temp = dest + ".tmp." + str(os.getpid())
    try:
        with open(temp, "wb") as out:
            out.write(data)
        os.replace(temp, dest)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def write_apps_atomically(target, content):
    os.makedirs(os.path.dirname(target), exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix=".infiniti-apps-", suffix=".js", dir=os.path.dirname(target))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as out:
            out.write(content)
        os.replace(temp, target)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


async def main(host, list_only):
    ws = await lgtv.session(host)
    try:
        points = (await lgtv.call(ws, "ssap://com.webos.applicationManager/listLaunchPoints")).get("launchPoints", [])
        inputs = (await lgtv.call(ws, "ssap://tv/getExternalInputList")).get("devices", [])
    finally:
        await ws.close()

    if list_only:
        for app in points:
            if app.get("id"):
                print(f'{app["id"]:45} {app.get("title") or app["id"]}')
        return

    # On older webOS TVs, launchpoint discovery may return [] shortly after
    # power-on. Never destroy a previously working app list on that result.
    if not isinstance(points, list) or not points:
        print("Warning: TV returned an empty app list. Keeping existing app/apps.js unchanged.", file=sys.stderr)
        return

    icon_dir = os.path.join(APP_DIR, "icons")
    os.makedirs(icon_dir, exist_ok=True)
    ctx = lgtv.insecure_ctx()
    apps = []
    for item in points:
        if not isinstance(item, dict):
            continue
        app_id = item.get("id")
        if not isinstance(app_id, str) or not app_id or len(app_id) > 160 or item.get("hidden"):
            continue
        name = local_icon_name(app_id)
        icon_path = os.path.join(icon_dir, name)
        icon = "icons/" + name if os.path.isfile(icon_path) else "icon.png"
        urls = (item.get("largeIcon"), item.get("icon"))
        for raw_url in urls:
            url = safe_icon_url(raw_url, host)
            if not url:
                continue
            try:
                download_tv_icon(url, icon_path, ctx)
                icon = "icons/" + name
                break
            except (OSError, ValueError, TimeoutError) as error:
                print(f"  icon unavailable for {app_id}: {error}")
        # Keep the app even without icon. icon.png is packaged with Infiniti.
        apps.append({
            "id": app_id,
            "title": str(item.get("title") or app_id)[:140],
            "icon": icon,
            "iconColor": item.get("iconColor") or item.get("bgColor") or "",
        })

    if not apps:
        print("Warning: no visible apps found; retaining previously generated app list.", file=sys.stderr)
        return

    data = {
        "apps": apps,
        "inputs": [
            {"appId": device["appId"], "label": device.get("label") or device.get("id") or device["appId"]}
            for device in inputs if isinstance(device, dict) and device.get("appId")
        ],
    }
    payload = "// Generated by sync-apps.py: the TV's apps and inputs.\n"
    payload += "window.TV_APPS = " + json.dumps(data, indent=1, ensure_ascii=False) + ";\n"
    write_apps_atomically(os.path.join(APP_DIR, "apps.js"), payload)
    print(f"Synced {len(apps)} apps and {len(data['inputs'])} inputs.")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    host = args[0] if args else os.environ.get("TV_HOST")
    if not host:
        sys.exit("usage: sync-apps.py <TV IP> [--list]")
    asyncio.run(main(host, "--list" in sys.argv))
