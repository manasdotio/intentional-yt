# AMO Submission Checklist

## Ready in repo

- Firefox-specific metadata added in `manifest.json` with a stable Gecko add-on ID and minimum Firefox version.
- No remote code loading or third-party network requests are present in the extension runtime.
- Extension pages avoid inline scripts by using external JS files for `ui/blocked.html` and `ui/modal.html`.
- Privacy policy added in `PRIVACY.md`.
- Existing icon asset is present at `icons/icon.png`.

## Manual submission items still required

- Create the AMO listing entry.
- Add store listing copy: summary, description, categories, and support details.
- Provide screenshots of the popup, blocked page, and a watch-page overlay.
- Upload the packaged extension zip or xpi with `manifest.json` at the archive root.
- Review the requested permissions text in AMO and confirm it matches the current feature set.

## Recommended reviewer notes

- The add-on only runs on `youtube.com` and `www.youtube.com` and explicitly excludes `music.youtube.com`.
- All settings and usage state are stored locally in `browser.storage.local`.
- The add-on does not communicate with remote services.
- The `tabs` permission is used to detect active YouTube tabs and redirect blocked tabs to the bundled blocked page.

## Pre-upload sanity check

- Load the extension in Firefox via `about:debugging`.
- Confirm the popup opens and saves settings.
- Confirm the blocked page renders correctly.
- Confirm no behavior runs on `music.youtube.com`.
- Confirm the packaged archive contains the same files as the workspace root.