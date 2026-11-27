# v1.7.4 — isolated Native Lab exit fix

TV evidence from v1.7.3: synthetic Thumb replacement succeeded; both Home 773 and Volume 115 press/release were observed and pass-through returned expected results. The lab did not print LAB_PASS. Leader PID 6374 was zombie with two threads and PPid 1 after interruption. LG lginput2 PID 1870 had neither hook library mapped; key config remained {}.

Fix: ARM EABI exit_group instead of per-thread exit; BusyBox and GNU timeout detection; exclusive lab lock; cleanup and wait for owned child even if its leader is zombie. CI verifies exit_group under QEMU, not hardware injection.

Repeat pass test with newly built thumb-probe and checksum; use only isolated test. Ignore mode requires config exactly {"773":{"action":"ignore"}} and no installed/active system hook. The lab never writes config. Restore empty config after separate manual ignore test. No system process injection, no boot enable, no claim of physical Home blocking. V9.1 remains fallback.

See RELEASE_NOTES_v1.7.3.md for pinned upstream binaries and baseline procedure.
