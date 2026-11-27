#!/usr/bin/env python3
"""Offline symbol audit. Do not execute or redistribute the supplied binaries."""
import argparse
import json
import pathlib
import re
import subprocess

def readelf(file, *opts):
    return subprocess.check_output(["readelf", *opts, str(file)], text=True)

def imports(file):
    needs = {}
    provider = None
    text = readelf(file, "-V").split("Version needs section")[-1]
    for line in text.splitlines():
        m = re.search(r"File: (\S+)", line)
        if m:
            provider = m[1]
        m = re.search(r"Name: (\S+).*Version: (\d+)", line)
        if m and provider:
            needs[int(m[2])] = provider
    groups = {}
    for line in readelf(file, "--dyn-syms", "--wide").splitlines():
        m = re.search(r"\bUND\s+(\S+@\S+)\s+\((\d+)\)", line)
        if m:
            groups.setdefault(needs[int(m[2])], set()).add(m[1])
    return groups

def exports(file):
    result = set()
    for line in readelf(file, "--dyn-syms", "--wide").splitlines():
        if " UND " not in line:
            m = re.search(r"\s(\S+@\S+)(?:\s|$)", line)
            if m:
                result.add(m[1].replace("@@", "@"))
    return result

def audit(file, directory):
    report = {}
    for provider, symbols in sorted(imports(file).items()):
        candidate = directory / provider
        if provider == "libc.so.6" and not candidate.is_file():
            candidate = directory / "libc-2.19.so"
        if not candidate.is_file():
            report[provider] = {"required": len(symbols), "status": "PROVIDER_NOT_SUPPLIED"}
            continue
        missing = sorted(symbols - exports(candidate))
        report[provider] = {"required": len(symbols), "matched": len(symbols)-len(missing),
                            "missing": missing, "status": "MISSING" if missing else "MATCH"}
    return report

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("directory", type=pathlib.Path)
    a = p.parse_args()
    result = {f: audit(a.directory/f, a.directory) for f in ("ezinject", "libinputhookpp.so")}
    print(json.dumps(result, indent=2))
    print("Versioned-symbol audit only: no runtime/constructor/relocation guarantee.")
    return 1 if any(x["status"] != "MATCH" for g in result.values() for x in g.values()) else 0

if __name__ == "__main__":
    raise SystemExit(main())
