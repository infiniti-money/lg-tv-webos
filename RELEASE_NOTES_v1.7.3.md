# v1.7.3 — Native Thumb isolated lab (hardware unverified)

The lab is a synthetic process with an exported Thumb function using the observed
56-byte key record and 16-byte code offset. It never accesses real input devices.
The target PID is created by the lab itself, never supplied by the caller.
No automatic injection, startup hook, firmware modification or system process
injection is included. V9.1 remains the fallback.

Pinned upstream v1.5.1 binaries (not redistributed):
- https://raw.githubusercontent.com/Simon34545/lginputhook/v1.5.1/service/inputhook/ezinject
- https://raw.githubusercontent.com/Simon34545/lginputhook/v1.5.1/service/inputhook/libinputhookpp.so
SHA-256 checks in tv/native-lab.sh were derived from user-provided matching binaries.
Upstream inputhookpp GPL-3.0 and ezinject zlib; no upstream source or LG binaries bundled.

Static analysis on the supplied files: both ELF32 ARM EABI5 soft-float, injector
requires GLIBC_2.4, hook requires up to GLIBC_2.12 plus GLIBC_PRIVATE and GCC
versions. Runtime dependencies must still be verified; static ABI is not a
guarantee. Kernel ptrace, Thumb relocation and the exact real target remain
unverified. The synthetic harness is built with arm-linux-gnueabi and checked
for ARM32, soft-float, Thumb symbol, legacy loader and GLIBC <=2.19.

Copy thumb-probe, thumb-probe.sha256 and the two upstream binaries into an
owner-controlled directory on TV. Stop all watchers and native mappings.
Run sh /home/root/lg-tv-vibehack/native-lab.sh DIRECTORY pass .
The existing upstream config must be absent or empty; the script never writes
it. A separate ignore run requires the existing config to contain ONLY
{"773":{"action":"ignore"}} and no live Input Hook installation or startup.
Do not change a live config for this lab. No arbitrary commands are accepted
by the lab config validator. Keep the printed private log directory for review.
LAB_PASS means baseline plus post-injection synthetic calls matched and hook
logs show both keys; it is not evidence of physical Home interception.
A missing timeout utility, incompatible library, or failed log check refuses
the trial. Never run ezinject against LG processes based on lab results alone.

Prior release v1.7.2 remains a hardware-unverified verification candidate.
