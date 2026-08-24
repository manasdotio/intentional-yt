# Contributing to Intentional YT

Thank you for your interest in contributing to **Intentional YT**! We welcome bug fixes, performance improvements, new distraction-blocking toggles, and documentation improvements.

---

## 🧭 Core Principles

1. **Zero Tracking & Strict Privacy**: Absolutely no external network requests, telemetry, or analytics.
2. **Zero-Flash Execution**: Blocking is applied at `document_start` by injecting CSS classes onto `<html>`. Avoid polling DOM or heavy runtime mutation observers where pure CSS can do the job.
3. **Vanilla Web Standards**: No bundlers, compilers, or heavy frameworks. Pure JavaScript (ES6+), HTML, and CSS.

---

## 🛠️ Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/manasdotio/intentional-yt.git
cd intentional-yt
```

### 2. Load the extension in your browser

#### Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` from the repository directory.
4. When you make changes, click **Reload** next to the extension in `about:debugging`.

#### Chromium (Chrome / Brave / Edge / Arc)
1. Navigate to `chrome://extensions` (or `brave://extensions`).
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the repository root folder.
4. Click the refresh icon on the extension card whenever you make changes.

---

## 🧱 Architecture & Adding a New Toggle

When adding a new feature or blocking toggle, the changes typically span these areas:

1. **Storage Default** (`utils/storage.js`):
   - Add the default state (boolean or setting) to `DEFAULT_SETTINGS`.
2. **Popup UI** (`ui/popup.html` and `ui/popup.js`):
   - Add a toggle checkbox or control with a data attribute / ID matching the setting key.
3. **CSS Class Injection** (`content/blocker.js`):
   - Map the setting to a corresponding class on the `<html>` root (e.g. `yt-block-xyz`).
4. **CSS Selectors** (`styles/blocker.css`):
   - Define high-performance CSS selectors targeted under `html.yt-block-xyz`.
   - Always ensure hiding rules handle both desktop (`www.youtube.com`) and mobile (`m.youtube.com`) YouTube layouts if applicable.

---

## 📦 Packaging

To build the distributable zip package:

- **Linux / macOS**:
  ```bash
  ./package.sh
  ```
- **Windows (PowerShell)**:
  ```powershell
  ./package-firefox.ps1
  ```

---

## 📋 Pull Request Guidelines

1. **Branch naming**: Use descriptive branch names like `feat/hide-merch-shelf` or `fix/shorts-selector-update`.
2. **Commit messages**: Use [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: add toggle for live chat replay`, `fix: update watch page sidebar selector`).
3. **Testing**: Test your changes against both:
   - Modern YouTube desktop layout (dark and light theme).
   - In-video edge cases (fullscreen, theater mode, embedded players).
4. Submit your PR and fill out the provided checklist template.
