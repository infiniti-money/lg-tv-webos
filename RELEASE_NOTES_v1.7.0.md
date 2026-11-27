# Infiniti Home V9 v1.7.0 — Designed by Tân Dev

Hardware-unverified candidate for webOS 3.4.3 / firmware 05.70.45.
- Opt-in ribbon correlation in the existing Legacy V8 engine: read only new complete surface-manager log lines, correlate NL_HOME_SHOWN to a pending physical Home intent, select bounded close/relaunch when Tân Dev is underneath. NL_HOME_HIDDEN is diagnostic only and not verified on hardware.
- No synthetic keys, rootfs writes, bind mounts or injection. No log-only launch. Preserve one active helper and one pending intent. V8 remains default.
- Input Hook PHP 1.4.0 failed with SIGILL/SIGSEGV on target TV; C++ 1.5.1 installed by owner but not verified. Never use alongside V9. Refuse active Input Hook marker/boot hook.
- Read-only ribbon-probe checks log, Home manifest and conflicts. No target Home manifest found on owner TV; native bind mount is not implemented.
- After installation and clean reboot without Input Hook: legacy-home.sh ribbon-probe, ribbon-on, watch. Ctrl+C then disable restores V8/default LG. Only arm and confirm after visual tests; disable clears ribbon flag. Old V8 paths retained for recovery.
- Render acknowledgement is not proof of hidden native ribbon. Require visible Home single/double, standby, cold boot, LAN and rollback tests before stable release.
- Research: https://github.com/rudra-avatar/Hearth/blob/main/src/homehook/watch.sh and https://github.com/rawinek/webos-homebar/blob/main/probe.sh. Independent implementation; preserve upstream notices.
