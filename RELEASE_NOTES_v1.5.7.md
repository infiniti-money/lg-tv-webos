# Infiniti TV Home v1.5.7 — Hide LG Icons & DNS Ad Blocking Guide (webOS 3.4)

## New features

- **Customize → Apps → Hide default LG apps** hides recognized LG system **icons only inside Infiniti TV Home**. The action persists in the launcher local preferences and is reversible per app or with **Restore default apps**. HDMI, Live TV, Input Hook, Homebrew, and user-installed apps are not targeted by bulk hide.
- **Customize → Ad blocking** explains a **manual** DNS-based ad/tracker blocking setup on LG webOS 3.4. The documented AdGuard public filtered IPv4 resolvers are `94.140.14.14` and `94.140.15.15`. Record old DNS settings first; restore automatic DNS if LG account login, Content Store, streaming apps or updates stop working.
- Seven Customize tabs remain keyboard/remote navigable; fixed previously hidden Dev Mode panel CSS not being fully hidden while other tabs are selected.
- CI now covers reversible app hiding, protection of Live TV/Homebrew, manual privacy UI, ES5 syntax, root safety and IPK packaging.

## Important limits

- **These changes DO NOT hide apps inside the native LG Home ribbon**, uninstall system apps, or mutate system app manifests. There is no verified safe root-level system Home app hiding procedure on the affected webOS 3.4 TV.
- **Installing this IPK does NOT automatically turn on ad blocking.** DNS filtering requires the owner to change DNS in the LG Network settings or configure a router-side blocker (AdGuard Home / Pi-hole). DNS filtering cannot guarantee removal of in-video YouTube ads or requests using hardcoded resolvers.
- Infiniti makes **no automatic edits** to `/etc/hosts`, firewall, mounted filesystems, Homebrew hooks, default LG Home, Developer Mode, or root state for this feature.
- The user's TV previously displayed a black screen after standby/wake and intermittently refused SSH. **No physical TV acceptance** has been performed. Keep the original LG Home and Failsafe recovery path.

## Package files

- `infiniti-tv-home.ipk` and `infiniti-tv-home.ipk.sha256`
- `infiniti-tv-home-root-tools-v1.5.7.zip` and `infiniti-tv-home-root-tools-v1.5.7.zip.sha256`

The root tools bundle contains the previous explicit-only recovery and root/Failsafe diagnostic improvements. **IPK-only installation is the safe choice** when no Home remapping/root maintenance changes are needed.

## Documentation

- [Vietnamese instructions](README.vi.md)
- [English instructions](README.md)
- DNS service: https://adguard-dns.io/en/public-dns.html
- Conservative community LG DNS list: https://github.com/samsapti/LG-webOS-Blocklist

**Compatibility:** ES5 / Chromium 38 syntax for webOS 3.x. Automatic release checks must not be interpreted as permission to replace root startup scripts.
