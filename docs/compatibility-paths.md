# Technical compatibility identifiers

These identifiers are deliberately unchanged for existing TV installations:
- App ID: com.infinitimoney.tvhome.
- Data directory: /home/root/lg-tv-vibehack.
- Historical boot hook and log identifiers: lg-tv-vibehack and /tmp/lg-tv-vibehack.log, where used.
- Existing localStorage keys, password file, app data and release asset names.

They are not a different download source. Renaming paths without a transactional migration can break Home hooks, rollback and persisted settings. The current product is Designed by Tân Dev, from infiniti-money/lg-tv-webos. The legacy identifiers are maintained until a separately tested migration is available. Archived release notes remain historical records.
