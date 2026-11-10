# Infiniti TV Home v1.5.4 — Larger Rounded Icons, Customize Wallpaper, Safe Auto-Updates

This is a UI and maintenance update for rooted LG webOS 3.x TVs. **The reported power/standby black-screen problem has not been validated as fixed on the affected physical TV.** GitHub Actions tests do not substitute for two successful on-TV power/wake cycles.

## Changes
- App icons on the transparent single-row dock are about 10–12% larger with softer 24px rounding and a matching glass focus frame. No extra app rows or opaque dock.
- Wallpaper setup is now in **Tùy chỉnh → Giao diện → Hình nền**. The phone/USB upload and remove controls remain on the authenticated TV-local QR page. The old redundant top-row image icon is gone, including its remote focus stop.
- Automatic app updates are available for rooted TVs via the **explicit opt-in** installer switch `--auto-update`. A background watcher begins checks **20 minutes after boot**, then every **12 hours**; it only acts when Infiniti is not foreground, no custom Home interception is active, and the latest stable GitHub Release is newer within the same major version.
- The updater verifies a **single-filename SHA-256 manifest** and IPK bytes before installation, waits for actual installer completion, preserves installed app data, and never invokes native LG Home or foreground app launch. Root sidecar scripts are *not* automatically replaced.
- A separate `--wallpaper-service` option enables only the rooted phone wallpaper service (without automatic updates). Status and QR availability appear within Customize.
- Black-screen recovery now also disables an enabled auto-update background watcher; the installer's safe default remains LG Home with zero startup hooks.

## Release assets
- `infiniti-tv-home.ipk`, `infiniti-tv-home.ipk.sha256`
- `infiniti-tv-home-root-tools-v1.5.4.zip`, `infiniti-tv-home-root-tools-v1.5.4.zip.sha256`

**Important:** Installing only the IPK does **not** upgrade root sidecars or activate automatic updates. Rooted TVs need to run the updated installer from GitHub after confirming the TV is stable.

## Root installation (only after two healthy power / standby / wake tests)
From an already authenticated *root SSH session on the TV*:

```sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh -o /tmp/infiniti-install.sh
sh /tmp/infiniti-install.sh --auto-update
```

If you only need wallpaper via phone (no background updates), use `--wallpaper-service`. These are background-only maintenance services; neither option enables Home remapping or automatically opens Infiniti Home.

Inspect current update state from root SSH:
```sh
sh /home/root/lg-tv-vibehack/auto-update.sh --status
```

Emergency disarm if the TV becomes unstable:
```sh
sh /home/root/lg-tv-vibehack/safe-recovery.sh
```

Read results carefully: `RECOVERY_COMPLETE` means no reported rollback problem; `RECOVERY_PARTIAL` means Input Hook mapping still needs manual review. Do not assume a partial recovery has fully restored LG Home.

## Compatibility notes
The app remains ES5 / Chromium 38 friendly. The updater is deliberately opt-in because previous boot/standby issues mean we cannot promise unattended installation is safe on every LG model without hardware acceptance. Major-version upgrades are intentionally deferred for review.
