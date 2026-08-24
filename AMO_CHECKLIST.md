# AMO Submission Checklist

## Ready in Repository
- [x] WebExtension Manifest V2 configured in `manifest.json` with Gecko ID (`intentional-yt@intentional-yt.local`).
- [x] No remote code loading or third-party network requests.
- [x] No eval or inline script execution.
- [x] Complete local storage privacy policy documented in `PRIVACY.md`.
- [x] Full icon set provided in `icons/` (16, 32, 48, 128, 512px).

## Submission Steps for addons.mozilla.org (AMO)
1. **Package the add-on**:
   - Run `./package-firefox.ps1` (or `zip -r intentional-yt-firefox.zip manifest.json background content icons styles ui utils`).
2. **Submit to AMO Developer Hub**:
   - Log into https://addons.mozilla.org/developers/
   - Click **Submit a New Add-on** and upload `intentional-yt-firefox.zip`.
3. **Store Listing Details**:
   - **Name**: Intentional YT
   - **Summary**: Distraction-free YouTube experience. Granular controls for feeds, Shorts, comments, and watch time limits.
   - **Category**: Privacy & Security / Photos, Music & Videos / Productivity.
   - **Reviewer notes**:
     - *Only executes on `youtube.com` and `m.youtube.com`, explicitly excluding `music.youtube.com`.*
     - *All user settings and daily watch-time metrics are stored strictly in `browser.storage.local` with zero telemetry or network calls.*