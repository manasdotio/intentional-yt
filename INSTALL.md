# Installation Guide

## Supported Browsers
- **Firefox** (desktop / Developer Edition / Nightly)
- **Chromium Browsers** (Google Chrome, Brave, Microsoft Edge, Opera, Arc, Vivaldi)

---

## 1. Load in Firefox (Temporary Add-on)

1. In Firefox, open a new tab and go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file in this directory.
4. Click the Intentional YT icon in your toolbar to configure settings.

---

## 2. Load in Chromium (Chrome / Brave / Edge / Arc)

1. Open your browser and navigate to the extensions page:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the `intentional-yt` project root folder.
5. Pin **Intentional YT** to your toolbar.


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