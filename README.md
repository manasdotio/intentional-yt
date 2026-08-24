<div align="center">

<img src="icons/icon.svg" alt="Intentional YT Logo" width="100" height="100" />

# Intentional YT

**Take back your focus. Make YouTube an intentional tool, not an endless rabbit hole.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)
![Browsers](https://img.shields.io/badge/browsers-Firefox%20%7C%20Chromium-informational.svg)
![Manifest](https://img.shields.io/badge/manifest-v2-orange.svg)
![Privacy](https://img.shields.io/badge/telemetry-0%25%20(strictly%20local)-success.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<p align="center">
  <a href="#-why-intentional-yt">Why Intentional YT?</a> •
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-how-it-works">Architecture</a> •
  <a href="#-permissions">Permissions</a> •
  <a href="#-contributing">Contributing</a>
</p>

</div>

---

## 💡 Why Intentional YT?

Modern YouTube is engineered around hyper-optimized recommendation algorithms designed to capture and hold your attention. **Intentional YT** reclaims your headspace by turning YouTube into a clean, search-first, and intentional video utility.

| Principle | How We Achieve It |
|---|---|
| ⚡ **Zero Content Flash** | Injects high-specificity CSS rules onto `<html>` at `document_start` before the DOM renders. No layout jumps, no visual pop-in, and zero sluggish DOM polling. |
| 🎛️ **Granular Control** | No rigid "all-or-nothing" blockers. Want to hide the infinite home feed but keep your subscriptions? Want to remove recommendations but keep video descriptions? Every distraction surface is independently customizable. |
| 🧠 **Dopamine Reduction** | Clickbait thumbnail neutralization (with video duration tags preserved) and site-wide grayscale mode to reduce visual overstimulation. |
| ⏱️ **Mindful Time Tracking** | Built-in passive daily watch counter, custom continuous session toasts, and enforce-able daily watch limits. |
| 🔒 **100% Privacy & Local** | Zero telemetry, zero analytics, zero external network requests. All preferences and time metrics reside solely within `browser.storage.local`. |

---

## ✨ Features

### 🎛️ Feed & Algorithmic Discovery
- **Hide Home Feed**: Replaces the addictive infinite homepage recommendations with a clean, distraction-free search interface.
- **Hide Subscriptions Feed**: Suppresses subscription grid when you only want to search for specific topics.
- **Hide Recommended Sidebar**: Completely removes the "Up next" infinite scroll column on video watch pages.
- **Hide Shorts Everywhere**: Strips YouTube Shorts shelves, sidebar tabs, search result inserts, and channel Shorts tabs.
- **Clean Search Results**: Filters out intrusive algorithm shelves (*"People also watched"*, *"For you"*, *"Previously watched"*).
- **Hide Explore & Trending**: Cleans out trending hubs and promotional links in navigation menus.

### 🎬 Video Player & Playback Experience
- **Hide End Screens**: Suppresses fullscreen recommendation videowalls and interactive end cards when videos finish.
- **Hide Live Chat & Playlists**: Disables distracting live chat streams and playlist side drawers.
- **Disable Autoplay**: Prevents YouTube from automatically queuing and playing the next video.
- **Hide Annotations**: Strips video overlay cards and promotional popups during playback.
- **Granular Video Meta**: Independently hide like/share buttons, channel subscriber counters, or video description panels.

### 🎨 Visual De-stimulation & Social Noise
- **Hide Thumbnails**: Replaces clickbait thumbnails with neutral placeholders while retaining video titles and duration badges.
- **Site-Wide Grayscale Mode**: Strips saturated colors across YouTube to make the browsing experience calm and non-stimulative.
- **Hide Comments & Profile Avatars**: Hide comments completely or simply mask commenter avatars to keep conversations distraction-free.

### ⏱️ Time Awareness & Watch Limits
- **Real-Time Daily Counter**: Automatically tracks active video playback throughout the day (automatically resets at midnight).
- **Soft Interval Reminders**: Gentle floating toast reminders after continuous watch intervals (15m, 30m, 45m, or custom).
- **Daily Watch Limit**: Set a hard daily cap (e.g. 60 min). Once reached, playback pauses with a mindful stop-screen prompt.

---

## 🚀 Installation

### Firefox
1. In Firefox, navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Browse to the cloned directory and select [`manifest.json`](manifest.json).

### Chromium (Google Chrome, Brave, Microsoft Edge, Arc)
1. Navigate to `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
2. Enable **Developer mode** via the toggle in the top-right corner.
3. Click **Load unpacked** and select the root `intentional-yt` folder.

### 📦 Packaging for Release
To package the extension into a distributable `.zip` file:
- **Linux / macOS**:
  ```bash
  ./package.sh
  ```
- **Windows (PowerShell)**:
  ```powershell
  ./package-firefox.ps1
  ```

---

## 🏗️ Architecture & How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                        manifest.json                         │
└──────────────────────────────┬───────────────────────────────┘
                               │
         ┌─────────────────────┴─────────────────────┐
         ▼                                           ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│     Content Scripts     │             │    Background Script    │
│  (document_start hook)  │             │                         │
│                         │             │ background.js           │
│ blocker.js              │             │ - Alarms API            │
│ - Injects <html> CSS    │             │ - Midnight stats reset  │
│                         │             └─────────────────────────┘
│ youtubeObserver.js      │
│ - Hooks SPA navigation  │
│                         │
│ timerToast.js           │
│ - HTML5 video events    │
│ - Live playback metrics │
│ - Break reminder toasts │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│ utils/storage.js        │ ◄─────────► │ ui/popup.html + js      │
│ - browser.storage.local │             │ - User settings UI      │
│ - Async write queue     │             │ - Live daily progress   │
└─────────────────────────┘             └─────────────────────────┘
```

1. **`content/blocker.js`**: Executes at `document_start` to read stored configurations and inject corresponding CSS helper classes (e.g., `yt-block-home-feed`) onto `document.documentElement`.
2. **`styles/blocker.css`**: Contains pure CSS selectors targeting YouTube elements under these root classes, guaranteeing instant suppression with zero visual flicker.
3. **`content/youtubeObserver.js`**: Hooks YouTube SPA navigation lifecycle (`yt-navigate-finish`, `yt-page-data-updated`, `popstate`) to keep state perfectly synchronized across seamless page transitions.
4. **`content/timerToast.js`**: Tracks playback time via HTML5 video events (`play`, `pause`, `timeupdate`) and presents mindful reminder toasts or daily limit blockers.
5. **`utils/storage.js`**: Cross-browser unified storage interface with an asynchronous write queue to eliminate race conditions during rapid user adjustments.

---

## 🔒 Permissions & Privacy

We believe in maximum privacy. Intentional YT requires only the bare minimum permissions necessary to function:

| Permission | Purpose |
|---|---|
| `storage` | Persists your toggle preferences and local watch stats locally. |
| `alarms` | Triggers the local midnight reset for your daily watch time. |
| `*://www.youtube.com/*`, `*://m.youtube.com/*` | Injects CSS rules and time tracking scripts onto YouTube. |

Intentional YT contains **no tracking, no analytics, and makes zero external requests**.

---

## 🤝 Contributing

Contributions, feature suggestions, and selector updates are always welcome!

- Please read our [**Contributing Guide**](CONTRIBUTING.md) for local setup, architecture conventions, and PR instructions.
- Found a bug or broken YouTube selector? Open an issue using our [**Bug Report Template**](.github/ISSUE_TEMPLATE/bug_report.yml).
- Security concerns? Review our [**Security Policy**](SECURITY.md).

---

## 📄 License

Distributed under the [MIT License](LICENSE). Built for intentional, mindful internet use.
