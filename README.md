# Designed by Tân Dev

Custom LG webOS launcher owned and maintained as a repository by [infiniti-money](https://github.com/infiniti-money).

[Tiếng Việt](README.vi.md) · [Official releases](https://github.com/infiniti-money/lg-tv-webos/releases) · [Owner guide (Vietnamese)](docs/owner-guide.vi.md) · [License](LICENSE)

**Stable: v1.6.2; published prerelease: v1.6.5.** The v1.6.6 repeat Home recovery candidate requires device retesting.

## Features in the v1.6.6 candidate

- Single app row, selected app title only, custom names/icons, five icon packs (105 icons), pinning and visibility.
- Clock, calendar, Vietnamese lunar calendar and weather.
- 14 foreground idle effects, random selection and manual preview.
- Idle album of up to 20 Full HD photos, 24 transitions, 12 slow photo motion styles and optional random order.
- Rotation from 15 seconds to seven days or on a new boot; standby resume detection requires testing.
- Eight TV settings sections; LAN settings at port 9090, protected by an owner-defined password of 8–64 characters.
- Reversible legacy Home integration, stock LG Home preserved.

## Installation and compatibility

Download matching IPK and Root Tools from this repository's Releases. Follow the [owner guide](docs/owner-guide.vi.md) for root SSH installation. Do not enable competing Home hooks. For non-root Developer Mode, use `install-noroot.sh`; root-managed LAN and legacy services are not available. See [Glasshouse integration](docs/GLASSHOUSE.md) for that optional integration.

v1.6.2 uses port 8090; v1.6.3 changes it to 9090. Use trusted LAN only, never expose the service to the internet. LG 49UH850T-TA / webOS 3.4.3 is the target; the v1.6.3 owner-reported acceptance was followed by a trace with unmatched Home presses; v1.6.6 requires retesting. Historical release notes and legacy technical docs are retained for diagnostics and rollback, not current instructions.

## Ownership and licensing

Product name and vendor: Designed by Tân Dev. Repository owner and release administrator: infiniti-money. Existing upstream copyright notices and licenses remain intact; see [LICENSE](LICENSE) and [attribution](docs/ATTRIBUTION.md). Repository control does not transfer third-party copyright.
