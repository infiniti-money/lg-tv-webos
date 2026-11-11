# Infiniti TV Home v1.5.6 — Safe Troubleshooting and Dev Mode Forever Companion

## Upstream compatibility improvements and CI repair

- Studied **Simon34545/lginputhook (BSD-3-Clause)**: both `exec` and `launch` are supported. Infiniti keeps its logged, reversible Execute wrapper for Home 0305/773 but no longer incorrectly claims a legacy Launch App binding is universally invalid.
- Studied **ecklf/lg-luma (MIT)**: separates autostart from native takeover; Luma's takeover is documented for **webOS 5+**, so no bind mounts of the native Home or compositor modifications have been imported to **webOS 3.4**.
- Studied **simbasjungles/free-my-tv (MIT)**: its webOS 3 computer-side app-discovery fallback inspired improvements to Infiniti's `sync-apps.py`. On a TV without root, apps are now preserved when icons are missing or not reachable; icons only download from the TV's own host with a 2 MiB bound, and `app/apps.js` is written atomically. A transient empty Luna response no longer replaces a working app list.
- Added **read-only** `tv/integration-diagnostics.sh` (available via `home-control.sh diagnose`) to report other launcher installations, known boot hook conflicts, and redacted Home 773 mapping status. It never executes a Home takeover, changes a keymap, mounts, reboots or accesses Developer Mode tokens.
- Fixed the previous `v1.5.6` CI error by ensuring the Dev Mode Forever settings page explicitly warns users that opening the companion **may REBOOT** the TV. Added offline compatibility and no-root recovery regression tests.

Technical details, source links and license notes: [docs/upstream-webos3-compat.md](docs/upstream-webos3-compat.md). No code or third-party compiled binaries from these projects are bundled.
## What changed
- **Corrected the recovery guide:** an empty app dock (launcher still visible) is distinct from a completely black LG TV screen. Run `sync.js` only for an empty app list; use the separate `safe-recovery.sh` path when the TV panel/menus remain black but SSH is accessible.
- **Corrected the remote Home binding:** `0305` HEX = `773` decimal, using LG Input Hook's `exec` action and `/home/root/lg-tv-vibehack/golauncher.sh`. Old documentation incorrectly required a `homewatch` process and described the older `launch` JSON action. These are no longer the safe webOS 3.x defaults.
- **Clarified startup behavior:** Infiniti's optional one-shot trial starts at most once after 55 seconds on a **cold boot**, not on every standby/wake. The native LG Home may still appear; success requires observing the actual TV. Do not re-enable foreground Home Watcher loops or the experimental `97-homekey`.
- **New Customize → Dev Mode page:** recognizes an *already installed* separate **LG Dev Mode Forever** application (`com.lennylxx.devmodeforever`) and offers a user-confirmed way to open it. The UI requires **two confirmations**; a held OK key may not substitute for releasing and pressing again. Nothing auto-opens this external app.
- **Developer Mode service safety:** The companion's own watchdog can **reboot the TV** while handling the power-off counter/session, including a check at app launch. Infiniti never invokes `watchdogArm`, `watchdogToggle`, `setDevMode`, or any other privileged Developer Mode service method, does not install the companion automatically and does not modify the signed official Developer Mode scripts or token.
- **WebOS 3.x compatibility:** ES5 and remote/DOM tests include the new settings page and guard the user-confirmed companion launch; no new boot hooks or Home interceptors are introduced by this release.

## The separate companion project

Source: https://github.com/infiniti-money/lg-devmode-forever

This is a standalone, independently installed application. **There is no verified prebuilt Release asset from that repository at the time of this update.** Follow its own README (build with webOS CLI and install the companion IPK) and keep LG's **official Developer Mode** app installed. After it appears in the synced app list, go to **Infiniti TV Home → Tùy chỉnh → Dev Mode**.

Its watchdog is not part of Infiniti's update mechanism; installing only `infiniti-tv-home.ipk` does **not** install Dev Mode Forever or start its service. The companion is licensed separately.

## Important TV safety

The user's rooted LG webOS 3.4.0 TV previously experienced a black screen after Power/standby/wake. **Real-TV compatibility of the companion and resolution of the black-screen problem remain unverified.** Do not open/reboot via Dev Mode Forever while the TV is unstable. Preserve the original LG Home and the emergency SSH rollback.

To disarm Infiniti's custom startup if the TV is unresponsive but root SSH still works:

```sh
sh /home/root/lg-tv-vibehack/safe-recovery.sh
```

Review `RECOVERY_COMPLETE`, `RECOVERY_PARTIAL` and `RECOVERY_INCOMPLETE` carefully; only the first means the known recovery steps reported no errors. Do not modify the official `start-devmode.sh`, `start-devmode.sig` or `pub.pem` to bypass expiration.

## Assets
- `infiniti-tv-home.ipk`, `infiniti-tv-home.ipk.sha256`
- `infiniti-tv-home-root-tools-v1.5.6.zip`, `infiniti-tv-home-root-tools-v1.5.6.zip.sha256`

Installing the IPK alone does not update existing rooted boot scripts. The root tools ZIP remains independently available for recovery. No code or binary from Dev Mode Forever is bundled in these assets.

## Validation
GitHub Actions verifies ES5 syntax, DOM navigation and remote OK confirmation, Home 773 behavior, cold boot safety, black-screen rollback, package structure, and artifact hashes. These automated checks do **not** constitute acceptance testing on the physical TV.
