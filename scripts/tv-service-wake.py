#!/usr/bin/env python3
"""Safely start installed Homebrew/Glasshouse services from a paired PC.

Uses the existing LG SSAP WebSocket pairing (lgtv.py); does not alter EIM,
LG Home, init.d, Homebrew packages, or the TV's foreground after launching
Homebrew Channel. Run from a Windows/Linux computer on the same LAN.
"""
import argparse
import asyncio
import ipaddress
from pathlib import Path
import socket
import sys

# lgtv.py is in the repository root and stores the pairing key in .lgtv-key.json.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
HOME_BREW_APP = "org.webosbrew.hbchannel"
WEBOS_PORT = 3001


def tcp_open(host, port, timeout=1):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (OSError, TimeoutError):
        return False


def service_state(host):
    return {"ssh": tcp_open(host, 22), "glasshouse": tcp_open(host, 8080)}


def should_launch(state):
    """Never interrupt the foreground if at least one root service is running."""
    return not state["ssh"] and not state["glasshouse"]


async def trigger_once(host):
    state = service_state(host)
    print("Before: SSH=%s Glasshouse=%s" % (state["ssh"], state["glasshouse"]))
    if not should_launch(state):
        print("At least one root service is available; refusing foreground app takeover.")
        return 0 if state["ssh"] and state["glasshouse"] else 2
    if not tcp_open(host, WEBOS_PORT, 2):
        print("TV remote WebSocket 3001 not ready. Nothing changed.")
        return 2

    # Lazy import avoids requiring pip packages for --status or offline tests.
    import lgtv
    ws = None
    try:
        ws = await lgtv.session(host)
        response = await lgtv.call(
            ws, "ssap://system.launcher/launch", {"id": HOME_BREW_APP}
        )
        if response.get("returnValue") is False:
            print("TV rejected Homebrew launch: %s" % response.get("errorText", "unknown"))
            return 3
        print("Homebrew launch accepted. No Live TV launch or EIM changes requested.")
    except (OSError, TimeoutError, ValueError, RuntimeError) as exc:
        print("WebSocket pairing/launch error: %s" % type(exc).__name__)
        return 3
    finally:
        if ws is not None:
            try:
                await ws.close()
            except Exception:
                pass

    # Wait for installed root services, not for a foreground app transition.
    for step in range(20):
        await asyncio.sleep(2)
        state = service_state(host)
        if state["ssh"] and state["glasshouse"]:
            print("Ready: SSH 22 and Glasshouse 8080. The TV app remains in user control.")
            return 0
        if state["ssh"] and step >= 5:
            print("SSH is running. Glasshouse 8080 not confirmed; inspect its init.d hook.")
            return 2
    print("Homebrew launch attempted but services were not confirmed. No retry loop.")
    return 2


async def watch(host, poll_seconds):
    """At most one launch per observed offline -> online edge."""
    armed = True
    print("Watching %s. Ctrl+C stops. TV app launches at most once per power cycle." % host)
    while True:
        online = tcp_open(host, WEBOS_PORT, 2)
        if not online:
            armed = True
        elif armed:
            armed = False
            try:
                await trigger_once(host)
            except Exception as exc:
                print("Watch attempt failed: %s" % type(exc).__name__)
        await asyncio.sleep(poll_seconds)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tv", default="192.168.2.154", help="TV IPv4 address")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--status", action="store_true", help="Read-only port check")
    group.add_argument("--watch", action="store_true",
                       help="Watch TV power cycles while this PC stays on")
    parser.add_argument("--interval", type=int, default=12, help="Watch polling seconds")
    args = parser.parse_args(argv)
    try:
        ipaddress.IPv4Address(args.tv)
    except ipaddress.AddressValueError:
        parser.error("--tv must be a valid IPv4 address")
    if args.interval < 10:
        parser.error("--interval must be at least 10 seconds")
    if args.status:
        state = service_state(args.tv)
        print("TV %s: SSH22=%s Glasshouse8080=%s Remote3001=%s" %
              (args.tv, state["ssh"], state["glasshouse"],
               tcp_open(args.tv, WEBOS_PORT)))
        return 0
    try:
        return asyncio.run(watch(args.tv, args.interval) if args.watch
                           else trigger_once(args.tv))
    except KeyboardInterrupt:
        print("Stopped.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
