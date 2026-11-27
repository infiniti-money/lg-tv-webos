# v1.8.0 — Runtime Isolation (prerelease candidate)

## Hardware evidence from v1.7.9 (2026-11-28 local time)

Owner's isolated preloaded lab pKh8DH: verified original GLib and libstdc++ hashes, baseline pass, both libraries mapped before injection, injector exit 1 in 174 ms (no timeout, no reported signal), hook mapped, 7 threads, zero hook log bytes despite open FD. Loader log shows hook bindings to LG GLib (glib__private__, g_variant_type_info_element, g_datalist_clear, etc.) and LG libstdc++ (e.g. _ZNSt5ctypeIwED2Ev). Last observed loader event: calling init: libinputhookpp.so. Constructor completion and exact cause not established. Probe exit 137 is cleanup SIGKILL, not evidence of a spontaneous fault. After cleanup: no lab lock or probe, config {}, lginput2 NOT_MAPPED with seven threads. This is evidence of actual interposition in a synthetic process, not proof that it caused the original physical failure.

## Six fresh pass-only trials, each using a separate probe

| Variant | Requested preload order | LD_DEBUG |
|---|---|---|
| baseline-trace | none | libs,bindings |
| glib-only | GLib | libs,bindings |
| cxx-only | libstdc++ | libs,bindings |
| preloaded | GLib:libstdc++ | libs,bindings |
| cxx-first | libstdc++:GLib | libs,bindings |
| preloaded-quiet | GLib:libstdc++ | off |

All use mixed workers. Requested preload order is not necessarily constructor order; transitive dependencies can load both runtimes. Inspect maps and runtime-before.txt. Compare preloaded vs preloaded-quiet for tracing effect, and baseline-trace against previous mixed result. Run only one case at a time after verifying clean system; a failed case is useful evidence, not a reason to reinject a mapped process. No automatic matrix against system services. Keep physical injection disabled.

Evidence: maps-before/after-inject/after-hook, raw loader.PID, loader-summary.log and loader-report.json even on failure, stage log, actual injector result, probe-exit-code and lab-exit-code. Loader report counts binding events and distinct names per provider; init entry is not init completion. Quiet mode intentionally has no trace. Missing trace is unknown, not success. No proprietary binaries included.

## Constructor and symbol isolation research

Toy ARM DSOs test ordinary interposition versus local function binding (-Bsymbolic-functions) with glibc 2.19 in QEMU. The original hook is unchanged. Function-local linking does not isolate data symbols, TLS, C++ RTTI, exceptions, memory ownership or private GLib interfaces. An eventual upstream-compatible build needs audited source revision, hidden visibility / explicit export list, dependency provenance, and tests for cross-boundary objects; avoid blanket deep binding, patched proprietary libraries, or physical injection. No claim that isolation fixes actual InputHook. V9.1 fallback unchanged, autostart remains off by default.

CI must pass before merge; actual six TV trials pending. Use pinned release IPK and probe with checksums, existing safe recovery, and inspect residual process/lock/config after every trial.
