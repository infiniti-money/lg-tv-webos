#!/usr/bin/env python3
"""Read-only offline inventory of actual LG ELF files; no execution or ldd."""
import argparse, hashlib, json, pathlib, re, subprocess

def readelf(path, *args):
    return subprocess.check_output(["readelf", *args, str(path)], text=True, errors="replace")

def scan(path):
    h=readelf(path,"-h")
    if "ELF32" not in h or "ARM" not in h:
        raise ValueError("expected ARM ELF32: "+str(path))
    dynamic=readelf(path,"-dW")
    sym=readelf(path,"--dyn-syms","--wide")
    versions=readelf(path,"-V")
    exports={}
    imports=[]
    provider=None
    providers={}
    for line in versions.split("Version needs section")[-1].splitlines():
        m=re.search(r"File: (\S+)",line)
        if m: provider=m[1]
        m=re.search(r"Name: (\S+).*Version: (\d+)",line)
        if m and provider: providers[int(m[2])]=provider
    for line in sym.splitlines():
        m=re.match(r"\s*\d+:\s+(\S+)\s+\d+\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)(?:\s+\((\d+)\))?",line)
        if not m: continue
        value,kind,bind,vis,ndx,name,idx=m.groups()
        if ndx=="UND":
            imports.append({"name":name,"provider":providers.get(int(idx)) if idx else None,"weak":bind=="WEAK"})
        elif bind in ("GLOBAL","WEAK","UNIQUE") and vis in ("DEFAULT","PROTECTED"):
            exports[name.replace("@@","@")]=value
            if "@@" in name: exports[name.split("@@")[0]]=value
    soname=re.findall(r"Library soname: \[([^\]]+)\]",dynamic)
    return {"file":path.name,"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
        "soname":soname[0] if soname else path.name,
        "needed":re.findall(r"Shared library: \[([^\]]+)\]",dynamic),
        "loader":readelf(path,"-lW"),"init_tags":[line.strip() for line in dynamic.splitlines() if re.search(r"\((?:PREINIT_ARRAY|PREINIT_ARRAYSZ|INIT|INIT_ARRAY|INIT_ARRAYSZ|FINI|FINI_ARRAY|FINI_ARRAYSZ|FLAGS|FLAGS_1|RPATH|RUNPATH)\)",line)],
        "imports":imports,"exports":exports}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("directory",type=pathlib.Path)
    args=p.parse_args()
    inventory=[]
    for f in sorted(args.directory.iterdir()):
        if f.is_file():
            with f.open("rb") as fd:
                if fd.read(4)!=b"\x7fELF": continue
            inventory.append(scan(f))
    if not inventory: raise SystemExit("No ARM ELF input files")
    by_name={}
    for row in inventory:
        key=row["soname"]
        if key in by_name and by_name[key]["sha256"]!=row["sha256"]:
            raise SystemExit("Conflicting SONAME: "+key)
        by_name[key]=row
    for row in inventory:
        row["missing_needed"]=[n for n in row["needed"] if n not in by_name]
        for item in row["imports"]:
            provider=item["provider"]
            name=item["name"]
            if provider:
                entry=by_name.get(provider)
                item["status"]="PROVIDER_NOT_SUPPLIED" if entry is None else "MATCH" if name in entry["exports"] else "MISSING"
            else:
                candidates=[n for n in row["needed"] if n in by_name and name in by_name[n]["exports"]]
                item["candidates"]=candidates
                item["status"]="UNVERSIONED_CANDIDATE" if candidates else "UNVERSIONED_UNRESOLVED"
        row["counts"]={status:sum(x["status"]==status for x in row["imports"]) for status in sorted({x["status"] for x in row["imports"]})}
    print(json.dumps({"scope":"static offline inventory; no live binding/constructor guarantee","files":inventory},indent=2))
if __name__=="__main__": main()
