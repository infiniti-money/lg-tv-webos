# v1.7.9 — Loader and symbol interposition investigation

The v1.7.8 mixed and dynamic cycle passed on the owner's TV, including 20 observed synthetic calls, one mock launch and exit 0. The actual lginput2 failure from v1.7.5 remains unexplained. Static ELF overlap and relocation references are hypotheses, not proof of a runtime binding failure.

New manual lab variant: preloaded. It uses exact SHA256-matched LG GLib and libstdc++ files from the owner's firmware, only in the private synthetic thumb-probe environment. No system library replaced. The lab saves before/after maps, stages and per-process LD_DEBUG=libs,bindings evidence, plus a filtered loader summary. A missing trace is not proof of constructor failure: injection uses a custom loader path and may not appear in glibc debugging. The custom startup probe still differs from lginput2 in startup, dependencies and locks. Compare mixed vs preloaded; if either fails, keep evidence and do not retry against physical processes. Physical injection remains disabled.

A separate original two-DSO toy fixture tests constructor order and interposition with the legacy glibc 2.19 loader in QEMU. This proves the mechanism in the fixture, not an LG failure. No proprietary binaries in repository or release.

audit-loader.py now supports --readelf and READELF on Windows, locale-stable parsing, IFUNC including GNU binutils OS-specific 10 representation, alias deduplication, versioned-provider resolution, weak/global candidates, visibility/type and relocation-backed name overlaps. Static name matches are not actual runtime binding; no ABI equivalence guaranteed.

Example Windows: python audit-loader.py elf --readelf C:/msys64/ucrt64/bin/readelf.exe > loader-audit.json
Example TV (clean system, no mapped LG hooks): sh native-lab.sh /home/root/native-lab pass preloaded
Only after pass: sh native-lab.sh /home/root/native-lab cycle preloaded
