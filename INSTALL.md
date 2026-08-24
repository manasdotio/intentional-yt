# Installation Guide

## Requirements
- Firefox (desktop) or Firefox Developer Edition / Nightly

---

## 1. Load as a Temporary Add-on (Development / Testing)

1. Clone or download this repository to your machine.
2. In Firefox, open a new tab and go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**
4. Browse to this directory and select the `manifest.json` file.
5. The extension icon will appear in your Firefox toolbar. Click it to configure which YouTube elements to hide or set your watch limits.

> **Note**: Temporary add-ons stay installed until you restart Firefox. To reload code changes while developing, just click the **Reload** button on the `about:debugging` page.

---

## 2. Packaging the Extension

To generate a zip archive suitable for submitting to addons.mozilla.org (AMO) or testing with web-ext:

### On Linux / macOS
```bash
zip -r intentional-yt-firefox.zip manifest.json background content icons styles ui utils
```

### On Windows (PowerShell)
```powershell
.\package-firefox.ps1
```

---

## Troubleshooting

- **Toggles not taking effect immediately**: Refresh the open YouTube tab once after loading or updating settings for the first time.
- **Timer not counting**: The watch timer activates only when a video is actively playing (`play` / `playing` events on the HTML5 video element).
- **Selector changes**: If YouTube updates its UI and an element starts showing again, check `styles/blocker.css` to update the matching CSS selector.