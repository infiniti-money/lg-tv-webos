# Mount & Legacy Home discovery — webOS 3.4.3 (firmware 05.70.45)

## Findings from upstream (reviewed 2026-11-28)

- [Homebar probe.sh](https://github.com/rawinek/webos-homebar/blob/main/probe.sh): panel checks main.qml plus UIController.qml and then checks actual patch fit. webOS 3.x is untested. Its overlay helper requires Node >=8, so stock Node 0.12 is incompatible. Our probe reports structure only, not patch fit.
- [Luma tv/home.sh](https://github.com/ecklf/lg-luma/blob/main/tv/home.sh) and [README](https://github.com/ecklf/lg-luma): file/executable bind mount on 5/6/24, manifest mount on 25/26. Separate takeover and autostart. These depend on an independent Home executable or manifest and SAM behavior. No supported takeover on 3.4.
- [webos-home profile](https://github.com/Mr-Neutr0n/webos-home/blob/main/config.example.json) and [setup](https://github.com/Mr-Neutr0n/webos-home/blob/main/docs/setup.md): exact known stock QML view and executable hashes, known SSH host key, backups, reversible trial. Example profile is SDK 7.5.9, not 3.4.3; never import the profile's hashes or target assumption.
- [Home Chooser research](https://github.com/webosbrew/home-chooser/blob/main/docs/research/home-key-and-home-app.md) and [hook design](https://github.com/webosbrew/home-chooser/blob/main/docs/home-key-hook.md): configd and compositor filter chain are release-specific. The firmware research covers newer systems; cannot assume a keyFilters list or reload operation on 3.4.
- [Hearth watch.sh](https://github.com/rudra-avatar/Hearth/blob/main/src/homehook/watch.sh): legacy uses NL_HOME_SHOWN log rather than relying on foreground app ID; newer launcher versions use bounded verification and a plain foreground launch for a resident app. Our V9.1 already correlates an evdev intent to ribbon and uses render/foreground proof. A log-only redirect can react to an intentional LG Home open; do not enable it automatically. [Compatibility reports](https://rudra-avatar.github.io/Hearth/COMPATIBILITY/) include 55UH652T and 55UH750V firmware 05.70.45: launcher-as-input caused boot hangs; do not register Infiniti as EIM input on this firmware. Reports are other models, not certification of 49UH850T-TA.
- [Lightkeeper service](https://github.com/chiotas/lightkeeper/blob/main/app/service/server.js): webOS 2/3 nonexclusive evdev read, device reconnect handling, HomeKeyBridge attribution. It accepts codes 125/172/773; Infiniti has direct evidence only for 773 and must not treat every Meta/HomePage key as physical Home. Reading input without an exclusive grab does not suppress LG ribbon. The existing Python 2.7 select observer avoids blocking Node's old worker pool. No additional concurrent watcher installed.
- [Glasshouse research](https://rorygallagher2024.github.io/glasshouse/development/TV-RESEARCH/): legacy 3.9.3 lacks newer key filter paths; independent evidence, not a target firmware check. Do not grab devices or synthesize input.

All new implementation is original; no upstream source, proprietary LG binaries, or third-party app packages copied. Preserve original source/license notices if reuse is later proposed; this change references upstream only. Source branches can evolve.

## Phase 1 — read-only discovery on the actual TV

Run `/usr/bin/node /home/root/lg-tv-vibehack/home-discovery.js` over an existing trusted SSH session.
JSON reports exact app/QML/executable paths, SHA-256 for bounded files, base config keyFilters list shape (not values), exact/descendant Home mounts in current and visible compositor namespaces, known conflicting markers, named remote candidates and qrc main mention. It does not dump full process command lines or settings. Missing base configuration is not proof no filter exists anywhere. An unreadable file is unknown. A mapped RCC is only a candidate; compiled-in Qt resources may not appear as a file. No runtime API, QML patch fit or actual launch is verified.

Decision states:
- STRUCTURE_CANDIDATE: main.qml and UIController.qml files exist; investigate stock hashes and actual controller interface offline.
- TARGET_MISSING: required known path absent; do not invent or create a system Home app.
- CONFIG_LIST_PRESENT: nonempty array in known base config; still need active configuration and compositor compatibility.
- NO_NONEMPTY_LIST_IN_BASE_CONFIG / BASE_CONFIG_MISSING: known base config has no usable list or absent; not authorization to create one.
- DISABLED_RESEARCH_ONLY: always; this version has no system takeover command.

## Phase 2 — optional private scratch mount

Only if the system is otherwise clean, no competing Lab/watchers, and owner chooses:
`sh /home/root/lg-tv-vibehack/home-mount-lab.sh --scratch-only`

Creates two private files under a fresh /tmp directory, bind-mounts one over the other, checks visibility and restoration, removes only those private files after unmount. Requires root and existing kernel/tool support. A PASS tests basic file mount ability, not a QML target, compositor namespace or Home replacement. If cleanup conflict/incomplete is reported, retain directory and investigate; do not force-unmount, run repeatedly or reboot blindly. No mount of a system file, rootfs remount, startup hook or service restart. CI tests discovery fixtures and shell guards, not the TV kernel mount itself.

## Phase 3 — select a real path based on results

For a known QML candidate: obtain the exact file locally, compare controller/entry interface and hashes offline, then separately design rollback; no patch generated yet.
For a known filter candidate: verify active configd and read-only compositor evidence before any change. If absent, do not fabricate a filter chain.
For no usable target: keep V9.1 manual fallback and continue v1.8.0 synthetic Runtime Isolation; Home ribbon may appear. Do not enable two watchers or physical injection. No EIM registration on 05.70.45. Physical Home interception remains unverified.
