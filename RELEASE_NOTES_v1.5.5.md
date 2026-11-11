# Infiniti TV Home v1.5.5 — Home 0305/773 and staged cold-boot default

## Remote Home
- Confirmed TV remote Home key: **HEX `0305` = decimal `773`**.
- Rooted webOS uses LG Input Hook's supported **Execute** action to run `/home/root/lg-tv-vibehack/golauncher.sh`, which opens **`com.infinitimoney.tvhome`**.
- LG Input Hook must be installed, opened once, and its mapping saved. The original binding is backed up by `keymap.js`. Other remote buttons remain unchanged.
- This remaps Home; it does **not** delete LG's native system launcher.

## Startup (opt-in and recoverable)

Because the affected LG TV previously went **black after Power → standby/wake**, background restart loops and automatic wake takeovers are explicitly prohibited.

- `sh install.sh --enable-home --start-home-on-boot` installs the launcher, safely maps Home 773, and **arms ONE trial for the next cold boot only**.
- The boot helper starts after a bounded 55-second delay, waits for applicationManager readiness, then issues at most **one** app launch. There is **no periodic foreground monitor, evdev read, wake watcher, launch retry, TV reboot or LG system file modification**.
- Trial is **consumed before execution**. If the TV goes black and must be restarted, subsequent cold boots leave LG Home in control.
- Only after the TV displays Infiniti correctly can the user run `sh /home/root/lg-tv-vibehack/home-control.sh boot-confirm`. It verifies that Infiniti is foreground and enables **one launch per subsequent cold boot**.
- Home 773 remapping and automatic cold-boot launch are independent: `boot-disable` disables auto-launch while retaining the Home key mapping. `safe-mode` restores the previous Home mapping and disables every managed boot flag.

**A short remote Power press often uses standby rather than cold boot.** This version deliberately does **not** force Infiniti again on waking from standby: repeated wake interception caused black-screen reports. For a TV in which standby and resume must always reopen Infiniti, hardware-specific validation is necessary before any implementation can be called safe.

## Installing and confirming

After verifying the TV's LG Home works normally, and after at least **two stable Power/standby/wake cycles**, sign in through root SSH on the TV:

```sh
curl -fsSL https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/install.sh -o /tmp/infiniti-install.sh
sh /tmp/infiniti-install.sh --enable-home --start-home-on-boot
```

Open LG Input Hook, **Save changes**, then press Home to check `773` works. Reboot **once** to test the one-shot cold-boot trial. Only if the TV image is visible, the app works, and the launch status looks healthy:

```sh
sh /home/root/lg-tv-vibehack/home-control.sh boot-confirm
sh /home/root/lg-tv-vibehack/home-control.sh status
```

Emergency recovery through root SSH:

```sh
sh /home/root/lg-tv-vibehack/safe-recovery.sh
```

If the recovery reports `RECOVERY_PARTIAL`, review the Input Hook mapping backup; do not assume the remote is restored. No factory reset is necessary to test software-only causes.

## Assets

- `infiniti-tv-home.ipk` and its SHA-256 manifest.
- `infiniti-tv-home-root-tools-v1.5.5.zip` and its SHA-256 manifest; includes new boot helper, safe rollback and the root installer.

**Installing the IPK alone does not register boot hooks or replace root scripts.** The updated root installer must be used for the optional cold-boot feature.

## Verification

GitHub Actions tests shell syntax, Node ES5 and webOS package structure, Home 773 mapping, and an offline cold-boot state machine (LG-safe default, one-shot trial, no second attempt without confirmation, controlled persistent mode, blocked legacy 97-homekey and recovery). **No on-device standby/wake acceptance has been completed yet.**
