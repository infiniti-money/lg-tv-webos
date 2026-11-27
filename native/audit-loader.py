#!/usr/bin/env python3
"""Offline ARM ELF inventory. Never execute the audited files or use ldd."""
import argparse, collections, hashlib, json, os, pathlib, re, shutil, subprocess

READELF = None

def resolve_readelf(explicit=None):
    name = explicit or os.environ.get("READELF") or "readelf"
    found = shutil.which(name)
    if found: return found
    if pathlib.Path(name).is_file(): return str(pathlib.Path(name).resolve())
    raise SystemExit("GNU readelf not found; pass --readelf C:/msys64/ucrt64/bin/readelf.exe or set READELF")

def readelf(path, *args):
    return subprocess.check_output([READELF, *args, str(path)], text=True,
                                   encoding="utf-8", errors="replace",
                                   env=dict(os.environ, LC_ALL="C", LANG="C"))

def symbols(text):
    # GNU binutils on non-ARM hosts may print <OS specific>: 10 for STT_GNU_IFUNC.
    pattern = r"^\s*\d+:\s+([0-9a-fA-F]+)\s+\d+\s+(.*?)\s+(GLOBAL|WEAK|LOCAL|UNIQUE)\s+(\S+)\s+(\S+)\s+(\S+)(?:\s+\((\d+)\))?\s*$"
    for line in text.splitlines():
        m = re.match(pattern,line)
        if not m: continue
        value,kind,bind,vis,ndx,name,idx=m.groups()
        if kind in ("<OS specific>: 10","<OS specific>:10","GNU_IFUNC"): kind="IFUNC"
        yield value,kind,bind,vis,ndx,name,idx

def scan(path):
    h=readelf(path,"-h")
    if "ELF32" not in h or "ARM" not in h:
        raise ValueError("expected ARM ELF32: "+str(path))
    dynamic=readelf(path,"-dW")
    versions=readelf(path,"-V")
    exports={}
    export_info={}
    imports=[]
    provider=None
    providers={}
    for line in versions.split("Version needs section")[-1].splitlines():
        m=re.search(r"File: (\S+)",line)
        if m: provider=m[1]
        m=re.search(r"Name: (\S+).*Version: (\d+)",line)
        if m and provider: providers[int(m[2])]=provider
    for value,kind,bind,vis,ndx,name,idx in symbols(readelf(path,"--dyn-syms","--wide")):
        if ndx=="UND":
            imports.append({"name":name,"provider":providers.get(int(idx)) if idx else None,"weak":bind=="WEAK","type":kind})
        elif bind in ("GLOBAL","WEAK","UNIQUE") and vis in ("DEFAULT","PROTECTED"):
            keys=[name.replace("@@","@")]
            if "@@" in name: keys.append(name.split("@@")[0])
            for key in keys:
                exports[key]=value
                export_info[key]={"type":kind,"binding":bind,"visibility":vis,"name":name}
    soname=re.findall(r"Library soname: \[([^\]]+)\]",dynamic)
    relocations=[]
    for line in readelf(path,"-rW").splitlines():
        m=re.match(r"^\s*([0-9a-fA-F]+)\s+[0-9a-fA-F]+\s+(R_ARM_\S+)\s+[0-9a-fA-F]+\s+(\S+)",line)
        if m: relocations.append({"offset":m[1],"type":m[2],"symbol":m[3].replace("@@","@")})
    return {"file":path.name,"sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
        "soname":soname[0] if soname else path.name,
        "needed":re.findall(r"Shared library: \[([^\]]+)\]",dynamic),
        "loader":readelf(path,"-lW"),"init_tags":[line.strip() for line in dynamic.splitlines() if re.search(r"\((?:PREINIT_ARRAY|PREINIT_ARRAYSZ|INIT|INIT_ARRAY|INIT_ARRAYSZ|FINI|FINI_ARRAY|FINI_ARRAYSZ|FLAGS|FLAGS_1|RPATH|RUNPATH|TEXTREL|SYMBOLIC)\)",line)],
        "imports":imports,"exports":exports,"export_info":export_info,"relocations":relocations}

def inventory(directory):
    rows=[]
    hashes={}
    aliases={}
    for f in sorted(directory.iterdir()):
        if not f.is_file(): continue
        with f.open("rb") as fd:
            if fd.read(4)!=b"\x7fELF": continue
        digest=hashlib.sha256(f.read_bytes()).hexdigest()
        if digest not in hashes:
            row=scan(f); rows.append(row); hashes[digest]=row
            row["aliases"]=[]
        row=hashes[digest]
        row["aliases"].append(f.name)
        aliases[f.name]=row
    if not rows: raise SystemExit("No ARM ELF input files")
    by_name=dict(aliases)
    for row in rows:
        key=row["soname"]
        if key in by_name and by_name[key]["sha256"]!=row["sha256"]:
            raise SystemExit("Conflicting SONAME: "+key)
        by_name[key]=row
    for row in rows:
        row["missing_needed"]=[n for n in row["needed"] if n not in by_name]
        for item in row["imports"]:
            provider=item["provider"]
            name=item["name"]
            if provider:
                entry=by_name.get(provider)
                item["status"]="PROVIDER_NOT_SUPPLIED" if entry is None else "MATCH" if name in entry["exports"] else "MISSING"
                if entry and name in entry["export_info"]: item["resolved_type"]=entry["export_info"][name]["type"]
            else:
                direct=[n for n in row["needed"] if n in by_name and name in by_name[n]["exports"]]
                other=[x["soname"] for x in rows if x is not row and name in x["exports"]]
                item["candidates"]=direct
                item["other_candidates"]=sorted(set(other)-set(direct))
                item["status"]="UNVERSIONED_CANDIDATE" if direct else "UNVERSIONED_GLOBAL_CANDIDATE" if other else "WEAK_UNRESOLVED" if item["weak"] else "UNVERSIONED_UNRESOLVED"
        row["counts"]=dict(collections.Counter(x["status"] for x in row["imports"]))
    return rows,by_name

def overlaps(rows,by_name):
    hook=by_name.get("libinputhookpp.so")
    if not hook: return []
    rels=collections.defaultdict(list)
    for x in hook["relocations"]: rels[x["symbol"]].append(x)
    report=[]
    for row in rows:
        if row is hook: continue
        shared=sorted(set(hook["exports"]) & set(row["exports"]))
        # Exact lookup keys; versioned aliases are not counted as independent base symbols.
        shared=[n for n in shared if "@" not in n]
        if not shared: continue
        candidates=[{"name":n,"hook":hook["export_info"][n],"other":row["export_info"][n],
                     "hook_relocations":rels.get(n,[])} for n in shared]
        report.append({"provider":row["soname"],"count":len(shared),"with_hook_relocations":sum(bool(x["hook_relocations"]) for x in candidates),"symbols":candidates})
    return sorted(report,key=lambda x:-x["count"])

def main():
    global READELF
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("directory",type=pathlib.Path)
    p.add_argument("--readelf",help="GNU readelf executable (absolute Windows path supported)")
    args=p.parse_args()
    READELF=resolve_readelf(args.readelf)
    rows,by_name=inventory(args.directory)
    print(json.dumps({"scope":"static offline inventory; candidates are not actual loader binding or constructor proof",
        "file_count":sum(len(x["aliases"]) for x in rows),"unique_count":len(rows),
        "interposition_candidates":overlaps(rows,by_name),"files":rows},indent=2))

if __name__=="__main__": main()
