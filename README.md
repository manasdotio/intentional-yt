<div align="center">

<img src="icons/icon.svg" alt="Intentional YT Logo" width="100" height="100" />

# Intentional YT

**Take back your focus. Make YouTube an intentional tool, not an endless rabbit hole.**

[![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-Install%20Extension-FF7139?logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-2.1.0-brightgreen.svg)
![Browsers](https://img.shields.io/badge/browsers-Firefox%20%7C%20Chromium-informational.svg)
![Manifest](https://img.shields.io/badge/manifest-v2-orange.svg)
![Privacy](https://img.shields.io/badge/telemetry-0%25%20(strictly%20local)-success.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<p align="center">
  <a href="https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/"><strong>🦊 Install for Firefox</strong></a> •
  <a href="https://manasdotio.github.io/intentional-yt/"><strong>🌐 Live Website</strong></a> •
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

### 🎛️ Feed & Homepage Discovery
- **Hide Home Feed (`blockHomeFeed`)**: Replaces the addictive infinite homepage recommendations with a clean, distraction-free search interface.
- **Hide Subscriptions Feed (`blockSubscriptionsFeed`)**: Suppresses the subscription grid when you want to look up specific topics without inbox-style pressure.
- **Hide Explore & Trending (`blockExploreAndTrending`)**: Cleans out trending hubs, gaming, movies, and promotional navigation sections.
- **Hide "More from YouTube" (`blockMoreFromYouTube`)**: Removes YouTube Premium, Studio, Kids, TV, and Music cross-promotions from the sidebar.
- **Hide Top Masthead / Header (`blockTopHeader`)**: Completely hides the top navigation bar for an ultra-clean, full-focus reading/viewing environment.
- **Hide Notification Bell (`blockNotificationBell`)**: Eliminates red unread notification badges and alert popups.

### ⚡ Deep Shorts Suppression
- **Universal Shorts Removal (`blockShorts`)**: Deep multi-surface suppression of YouTube Shorts across:
  - Homepage Shorts shelves and carousel drawers.
  - Left navigation sidebar Shorts links.
  - Search result Shorts inserts and vertical video carousels.
  - Channel page "Shorts" tabs.
  - Watch page recommendation Shorts rows.

### 🔍 Search Results Cleansing
- **Clean Search Results (`blockIrrelevantSearchResults`)**: Strips disruptive algorithmic injection rows from search results:
  - *"People also watched"*
  - *"For you"*
  - *"Previously watched"*
  - *"Related to your search"*
  - *"Latest from channel"* shelves

### 🎬 Watch Page & Playback Control
- **Hide Recommended Sidebar (`blockSidebar` & `blockRecommended`)**: Completely removes the "Up next" infinite recommendation column and centers the video player.
- **Suppress Algorithmic Mixes (`blockMixPlaylists`)**: Hides endless automated "Mix" and "Radio" station playlists.
- **Hide Playlist Drawers (`blockPlaylist`)**: Collapses playlist side panels during active viewing.
- **Hide End Screen Videowalls (`blockEndScreenVideowall`)**: Prevents grids of suggested video tiles from taking over the screen at video completion.
- **Hide End Screen Cards (`blockEndScreenCards`)**: Blocks floating thumbnail cards and channel subscribe overlays during the final seconds of a video.
- **Disable Autoplay (`disableAutoplay`)**: Removes the autoplay video attribute and unchecks YouTube's native autonav toggle button.
- **Hide Annotations (`disableAnnotations`)**: Blocks creator cards, promotional popups, and banner overlays during playback.

### 🏷️ Granular Video Meta & Social Distractions
- **Hide Video Info Block (`blockVideoInfo`)**: Hides the video title and primary metadata container below the player.
- **Hide Interaction Buttons (`blockVideoButtons`)**: Strips Like, Dislike, Share, Download, Clip, and Save buttons.
- **Hide Channel Info (`blockChannelInfo`)**: Hides channel avatar, channel name, and subscriber count badges.
- **Hide Video Description (`blockVideoDescription`)**: Suppresses the expandable video description panel and show-more details.
- **Hide Comments Section (`blockComments`)**: Completely removes the entire comments thread.
- **Mask Profile Avatars (`blockProfilePhotos`)**: Replaces user comment avatars with blank circles to reduce visual stimulation while keeping discussion readable.
- **Hide Live Chat (`blockLiveChat`)**: Disables live streaming chat drawers and replay streams.
- **Hide Merch & Shopping (`blockMerch`)**: Suppresses product carousels, store shelves, and shopping tags.

### 🎨 Visual De-stimulation & Dopamine Reducers
- **Clickbait Thumbnail Neutralization (`hideThumbnails`)**: Replaces saturated, shouting video thumbnails with clean, calming placeholders while preserving video titles and exact duration stamps.
- **Site-Wide Grayscale Mode (`grayscaleMode`)**: Applies a native hardware-accelerated grayscale filter across the entire YouTube interface to eliminate visual overstimulation.

### ⏱️ Time Awareness & Mindful Watch Limits
- **Passive Active Watch Meter**: Accurately tracks active `<video>` playback seconds (ignoring paused time), writing in 5-second batches to protect storage.
- **Automatic Midnight Reset**: Alarms API ensures daily watch time counters seamlessly reset at 00:00 local time every night.
- **Soft Break Reminder Toasts**: Gentle, floating notification toasts at customizable intervals (e.g. every 15, 30, or 45 minutes of continuous watching).
- **Hard Daily Playback Ceilings**: Optional daily watch quota (e.g. 45 or 60 minutes). When exceeded, video playback locks with a mindful pause overlay.

---

### 📋 Full Feature Matrix & CSS Class Tokens

| Feature Name | Storage Key | Injected Class on `<html>` | Default |
| :--- | :--- | :--- | :---: |
| **Hide Home Feed** | `blockHomeFeed` | `iyt-no-home-feed` | `true` |
| **Hide Recommended Sidebar** | `blockRecommended` | `iyt-no-recommended` | `true` |
| **Hide Left Sidebar** | `blockSidebar` | `iyt-no-sidebar` | `true` |
| **Hide Shorts Everywhere** | `blockShorts` | `iyt-no-shorts` | `true` |
| **Clean Search Algorithmic Shelves** | `blockIrrelevantSearchResults` | `iyt-no-irrelevant-search` | `true` |
| **Hide Explore & Trending** | `blockExploreAndTrending` | `iyt-no-explore` | `true` |
| **Hide More From YouTube** | `blockMoreFromYouTube` | `iyt-no-more-yt` | `true` |
| **Hide Notification Bell** | `blockNotificationBell` | `iyt-no-notif-bell` | `true` |
| **Hide End Screen Videowall** | `blockEndScreenVideowall` | `iyt-no-endscreen-wall` | `true` |
| **Hide End Screen Cards** | `blockEndScreenCards` | `iyt-no-endscreen-cards` | `true` |
| **Hide Mix / Radio Playlists** | `blockMixPlaylists` | `iyt-no-mix-playlists` | `true` |
| **Hide Merch & Shopping Shelves** | `blockMerch` | `iyt-no-merch` | `true` |
| **Disable Autoplay** | `disableAutoplay` | *(player script action)* | `true` |
| **Disable Annotations** | `disableAnnotations` | `iyt-no-annotations` | `true` |
| **Hide Comments** | `blockComments` | `iyt-no-comments` | `false` |
| **Hide Profile Avatars** | `blockProfilePhotos` | `iyt-no-profile-photos` | `false` |
| **Hide Live Chat** | `blockLiveChat` | `iyt-no-live-chat` | `true` |
| **Hide Playlist Panel** | `blockPlaylist` | `iyt-no-playlist` | `false` |
| **Hide Video Info (Title/Views)** | `blockVideoInfo` | `iyt-no-video-info` | `false` |
| **Hide Like/Share Buttons** | `blockVideoButtons` | `iyt-no-video-buttons` | `false` |
| **Hide Channel Info & Subs** | `blockChannelInfo` | `iyt-no-channel-info` | `false` |
| **Hide Video Description** | `blockVideoDescription` | `iyt-no-video-desc` | `false` |
| **Hide Top Header** | `blockTopHeader` | `iyt-no-top-header` | `false` |
| **Hide Subscriptions Feed** | `blockSubscriptionsFeed` | `iyt-no-subscriptions` | `false` |
| **Neutralize Thumbnails** | `hideThumbnails` | `iyt-no-thumbnails` | `false` |
| **Site-Wide Grayscale** | `grayscaleMode` | `iyt-grayscale` | `false` |
| **Soft Interval Reminder** | `softReminder.enabled` | *(timerToast)* | `false` |
| **Daily Watch Limit** | `dailyLimit.enabled` | *(timerToast)* | `false` |


---

## 🚀 Installation

### Firefox
- **Official Store (Recommended)**: Install directly from [**Firefox Add-ons (AMO)**](https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/).
- **From Source**:
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

## ⭐ Support & Feedback

If Intentional YT helps you reclaim your time and focus:
- ⭐ **[Leave a 5-Star Review on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/)** — Every review helps more people discover mindful internet use.
- 🌟 **Star this repository** on GitHub to support open-source development.
- 💬 Have ideas or selector updates? Open a discussion or feature request!

---

## 🤝 Contributing

Contributions, feature suggestions, and selector updates are always welcome!

- Please read our [**Contributing Guide**](CONTRIBUTING.md) for local setup, architecture conventions, and PR instructions.
- Found a bug or broken YouTube selector? Open an issue using our [**Bug Report Template**](.github/ISSUE_TEMPLATE/bug_report.yml).
- Security concerns? Review our [**Security Policy**](SECURITY.md).

---

## 📄 License

Distributed under the [MIT License](LICENSE). Built for intentional, mindful internet use.
