# v1.7.6 — Native diagnostics / multithread lab

v1.7.5 actual TV evidence: exact firmware and upstream fingerprints matched;
ezinject reached detach, lginput2 remained PID 1870, all seven observed threads
had TracerPid 0, and the pinned library was mapped. hook.log was empty although
fd 36 pointed to it. These facts do NOT prove library initialization or working
hooks. Exit code and elapsed time of that past invocation were not captured.
The main thread waiting on a futex is not proof of a deadlock.

Offline inspection of the owner's pinned binaries with readelf: 51/51 versioned
libc imports of ezinject and 230/230 of libinputhookpp.so matched supplied libc.
Hook additionally needs 51 versioned pthread imports, 30 GCC imports, two math,
one realtime, one loader import. Injector additionally needs four libdl imports.
Those provider binaries were not supplied. GLIBC_PRIVATE __libc_dlopen_mode is
present but not an ABI guarantee. INIT_ARRAY is 40 bytes in the hook. Constructors
and live loader state remain unverified. Use native/audit-symbols.py on the
computer with exact TV provider files named by SONAME, never host replacements.

This release suspends **all physical injection** in native-trial.sh; diagnose
is read-only, recover remains available and no automatic reinjection is added.
Retain old evidence before reboot/update; do not delete mapped binaries or
persistent backup. Diagnose reports mapping, initialization, Gum, replacement
message, successful lib_main and observed calls separately. Previous logs are
not authenticated proof of a working hook.

The isolated lab runs only its own synthetic child. The new observer captures
actual child exit code/signal, explicit 20s timeout and monotonic elapsedMs in
inject-result.json. diagnostics.json records mappings, threads and log evidence.
Use the new thumb-probe and its checksum; optional third argument multi starts
six idle pthread workers before injection. Compare pass and multi pass on a
clean boot with no mapped system hook and restored empty config. Multi is a
synthetic test of pre-existing threads, not a faithful replica of lginput2
loader locks, proprietary dependencies, signal handlers or input paths.
Do not retry physical injection based on this test alone. No autostart.

CI includes offline classification tests, ARM ABI and QEMU baseline plus
multithread startup/exit checks. Real TV multi lab is not yet verified.
V9.1 remains fallback after clean reboot without mapped hook.
