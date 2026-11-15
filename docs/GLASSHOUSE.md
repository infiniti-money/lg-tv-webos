# Infiniti TV Home inside Glasshouse (no LG Input Hook)

This integration is for a rooted LG TV using **Glasshouse to own Home** and
**Infiniti TV Home as Glasshouse's Custom launcher**. It is separate from the
legacy LG Input Hook integration; nothing in this procedure installs or starts
LG Input Hook, a Home watcher or an additional autostart service.

## What changes

Glasshouse injects `window.Glasshouse` into the uploaded web launcher.
The bundled `app/glasshouse.js` detects that API automatically and uses:

| Task | Glasshouse Custom | Normal Infiniti IPK |
| --- | --- | --- |
| List installed apps and inputs | `Glasshouse.catalogue()` | `apps.js` produced by `tv/sync.js` |
| Icons | The catalogue's icon URL | Synced local icons |
| Open an app | `Glasshouse.open('app', id)` | webOS Luna launch |
| Switch HDMI / tuner | `Glasshouse.open('input', id)` | Existing native input launch |
| Refresh catalogue | `Glasshouse.onChanged()` and foreground refresh | Existing `apps.js` reload |

The original Infiniti interface, Vietnamese text, weather and local Customize
preferences remain unchanged. Glasshouse hidden apps/inputs are respected.
Transient catalogue errors do not erase the last successful list.

**Important:** Glasshouse Custom runs the launcher **from a separate copy**
inside Glasshouse, not from the installed `com.infinitimoney.tvhome` IPK directory.
The source `apps.js` is deliberately an empty placeholder in release packages;
the Glasshouse bridge replaces it with real live data.

## Install / update safely

1. Keep your original working LG Home and your SSH recovery access. Back up
   any existing Glasshouse config before changing Home.
2. Build/download an Infiniti IPK **containing `app/glasshouse.js`** (the
   GitHub Actions artifact from this branch/PR can be used after CI succeeds).
3. In the Glasshouse dashboard, open **Home → Choose your launcher → Custom**
   and upload the new `.ipk` as the launcher. Do not point Custom at a
   separate public URL or use a forwarding HTML page.
4. Open Custom manually and test that the apps have icons, apps open, HDMI and
   Live TV work, settings remain responsive, and Home returns correctly.
5. Only after that, test standby/wake and cold boot. Enable **Open Home at
   power-on** in Glasshouse only if the physical TV passes those tests.
   Do not enable extra Infiniti boot launchers at the same time.

On webOS **3.x**, Glasshouse Custom Home is experimental and may require
`"allowExperimentalHome": true` in its `/var/lib/tvweb/config.json`.
Glasshouse documents that the original LG ribbon may appear briefly before
the new launcher overlays it; fully suppressing that ribbon is **not**
guaranteed on webOS 3.4.x.

Do **not** run `install.sh --enable-home`,
`install.sh --start-home-on-boot` or `home-control.sh enable` for this mode:
those are for the older LG Input Hook path.

## What still requires the original root installation

The Glasshouse Custom package can display the native Infiniti interface,
discover/open apps and inputs, and save its own local UI preferences. However,
the **phone/USB wallpaper QR service, periodic native `sync.js` writes,
Infiniti auto-updater and other root sidecars** are installed separately by
Infiniti's root installer; uploading an IPK to Glasshouse does not install
these services or make their private files appear in Glasshouse's app directory.

The launcher uses the Glasshouse API for catalogue and opening apps, not for
Infiniti-specific root sidecar services. Preferences stored by the Custom
launcher can also be separate from those of the ordinary installed IPK.

## Recovery

- In Glasshouse **Home**, choose **LG Home** to give Home back to LG.
- If its dashboard is not usable but SSH still works, run:

  ```sh
  /var/lib/tvweb/tvwebctl restore-glasshouse-home
  ```

This is Glasshouse's documented restoration command. Do not delete the stock
LG Home directory or alter read-only system partitions. If Glasshouse has
stopped answering, its documented fallback is to return to LG Home.

## Source and checks

- Glasshouse API contract:
  https://github.com/infiniti-money/glasshouse-lg/blob/main/docs/development/WRITING-LAUNCHERS.md
- Implementation: `app/glasshouse.js`, `app/app.js`, `app/index.html`.
- Regression test: `node scripts/test-glasshouse.js`.
- Legacy syntax gate: `node scripts/check-webos3.js`.
- This feature needs **real-TV validation** on webOS 3.4.3; CI cannot
  demonstrate cold boot, standby behavior or the physical Home key.
