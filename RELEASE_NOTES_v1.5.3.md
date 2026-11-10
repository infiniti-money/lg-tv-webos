# Infiniti TV Home v1.5.3 — Safe Boot & Emergency Recovery

**Status:** Automated source tests and IPK packaging are required before publication.
**Hardware validation:** NOT YET CONFIRMED on the LG webOS 3.4.0 TV reporting a black screen after Power/standby. This release must NOT be interpreted as successful physical-TV acceptance.

## What changed

- **LG Home is the safe default.** No automatic launch of Infiniti after 12, 25, or 45 seconds during boot, and no boot-time foreground takeover of Live TV, Homebrew Channel, or LG Input Hook.
- **Retired dangerous Home Watcher behavior.** Even if the legacy `homewatch.js --boot` process is launched manually, its source can no longer open the Infiniti app or redirect the current application. It remains only an app-catalog watcher.
- **Disabled direct `/dev/input/eventN` Home monitoring activation** via `home-control.sh evdev-enable` until physical hardware validation. Direct key reading did not suppress LG's Home ribbon and could duplicate input handling.
- **Reversible black-screen recovery:** `tv/safe-recovery.sh` archives installed boot scripts, the user's experimental `97-homekey`, log snapshots and keymap settings. It disables activators before attempting keymap rollback.
- **Clear recovery outcomes:** `RECOVERY_COMPLETE` (code 0) means the known startup files were disabled and keymap restoration had no reported problems; `RECOVERY_PARTIAL` (code 2) means autostart was disabled but an Input Hook binding or backup remains unverified; `RECOVERY_INCOMPLETE` (code 1) means at least one startup component could not be disarmed. Never treat PARTIAL as complete.
- **PowerShell 7 rescue script:** `scripts/recover-lg-tv.ps1` sends the shell script through SSH rather than parsing Linux `if/for` statements in Windows PowerShell.
- **Safer installer:** `install.sh` no longer takes control of the remote's Home button by default; it requires an explicit `--enable-home` and preserves native LG Home as a recovery path.

## Included assets

- `infiniti-tv-home.ipk` — webOS launcher application. **Installing this IPK alone does NOT replace root-sidecar boot scripts already on the TV.**
- `infiniti-tv-home.ipk.sha256` — checksum for the IPK.
- `infiniti-tv-home-root-tools-v1.5.3.zip` — `tv/` helper scripts, safe recovery, root installer, PowerShell SSH recovery and Vietnamese instructions.
- `infiniti-tv-home-root-tools-v1.5.3.zip.sha256` — checksum for the root tools.

## Safe recovery on an affected LG TV

If SSH is accessible and the TV had a black screen after pressing Power, first review the recovery script and **do not immediately re-enable Home replacement**. From PowerShell 7 on Windows (replace IP/key for another TV):

```powershell
$p = Join-Path $env:TEMP 'recover-lg-tv.ps1'; Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/scripts/recover-lg-tv.ps1' -OutFile $p; pwsh -NoProfile -File $p -TV 192.168.2.154
```

Do not reboot automatically. If you see `RECOVERY_PARTIAL` or `RECOVERY_INCOMPLETE`, inspect the warnings and the backup directory before deciding the next step.

If the result is `RECOVERY_COMPLETE` and no warnings remain, reboot via SSH once to terminate any legacy background loop, then verify normal LG Home and at least **two full power/standby/wake cycles** before intentionally installing or enabling Infiniti Home again.

**Never delete the LG system launcher, reset partitions, or use undocumented factory reset commands to recover a black screen.** If the TV remains black even without third-party boot scripts, check backlight/power and seek appropriate hardware assistance.

## Vietnamese documentation

[README.vi.md](README.vi.md) provides the updated installation and rollback procedure. Do not publish this version as "tested on LG hardware" until a real TV successfully completes the acceptance checks.
