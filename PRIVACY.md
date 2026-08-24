# Privacy Policy

Intentional YT is built to be completely private and offline-first.

## Data Storage
All preferences and watch-time counters are stored exclusively on your device using Firefox's local extension storage API (`browser.storage.local`).

The data stored includes:
- Your UI toggle preferences (e.g., whether the home feed, comments, or thumbnails are hidden).
- Your timer preferences (soft reminder interval and daily limit minutes).
- Daily accumulated watch seconds and the date of the last daily reset.

## Data Access
- The extension executes content scripts on `youtube.com` and `m.youtube.com` solely to inject stylesheet hiding rules and monitor HTML5 video play/pause events.
- It explicitly excludes `music.youtube.com`.

## What We Do Not Do
- **Zero Network Requests**: The extension makes no network calls to external servers or APIs.
- **Zero Telemetry / Analytics**: No tracking pixels, analytics scripts, crash reporters, or usage beacons are included.
- **Zero Third-Party Code**: No third-party tracking scripts or CDNs are loaded.
- **Zero User Identification**: We do not collect cookies, search queries, account details, or browsing history.

## Data Removal
All stored data is wiped automatically when you uninstall the extension from Firefox. You can also manually reset today's watch statistics at any time by clicking the "reset" button in the extension popup.