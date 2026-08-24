# Intentional YT

A lightweight, distraction-free Firefox extension for YouTube. Granular control over feeds, recommendations, Shorts, comments, and watch time—with zero tracking and no remote dependencies.

---

## Why Intentional YT?

YouTube is built around recommendation algorithms designed to keep you watching. Intentional YT gives you back control:

- **No content flash**: Blocking rules are applied at `document_start` via CSS classes directly on `<html>`. No layout jumping, no flickers, and no sluggish DOM polling.
- **Granular toggles**: Don't want the home feed, but still want subscriptions? Want to hide comments, but keep the description? Every distraction surface is independently toggleable.
- **Dopamine reduction**: Optional thumbnail hiding (with duration badges preserved) and site-wide grayscale mode.
- **Mindful watch tracking**: Passive watch time tracking that resets at midnight, with optional session reminders and daily limits.
- **Zero data collection**: All settings and metrics stay strictly in your browser (`browser.storage.local`). No telemetry, no analytics, no external servers.

---

## Features

### 🎛️ Feed & Discovery
- **Hide Home Feed**: Replaces the algorithmic homepage feed with a clean, empty workspace.
- **Hide Subscriptions**: Suppresses the subscriptions feed when you only want search.
- **Hide Recommended Sidebar**: Removes the infinite video suggestions next to watch pages.
- **Hide Shorts**: Strips Shorts from sidebars, search results, home shelves, and channel tabs.
- **Hide Explore & Trending**: Cleans out trending sections and explore navigation.
- **Hide "More from YouTube"**: Removes promotional links in the navigation drawer.
- **Clean Search Results**: Strips out irrelevant algorithm shelves (*"People also watched"*, *"For you"*, etc.) in search results.

### 🎬 Video & Playback
- **Hide End Screens**: Blocks end-screen videowalls and overlay cards at the end of videos.
- **Hide Live Chat & Playlists**: Toggle off live chat streams and playlist side-drawers.
- **Disable Autoplay**: Prevents YouTube from auto-playing the next video.
- **Hide Annotations**: Suppresses interactive overlay boxes on video playback.
- **Granular Video Info**: Independently hide the video action buttons (like/share), channel info header, or description box.

### 🎨 Visual & Social
- **Hide Comments & Avatars**: Hide comments entirely or just remove user profile pictures to reduce noise.
- **Hide Thumbnails**: Replaces clickbait thumbnails with neutral placeholders while keeping video titles and duration badges visible.
- **Grayscale Mode**: Strips color across YouTube to make browsing noticeably less stimulating.

### ⏱️ Time Awareness & Limits
- **Daily Watch Tracker**: Real-time counter of total video playback today (resets at midnight).
- **Soft Reminders**: Gentle toast notification every *N* minutes of continuous viewing (e.g., 15m, 30m, 45m, or custom).
- **Daily Watch Limit**: Optional daily cap (e.g., 60 minutes). When reached, pauses video playback and shows an overlay prompt to stop watching.

---

## Installation
### Firefox
1. In Firefox, go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...** and select `manifest.json`.

### Chromium (Chrome / Brave / Edge / Arc)
1. Go to `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
2. Toggle on **Developer mode** (top right).
3. Click **Load unpacked** and select the `intentional-yt` project folder.

### Package Extension (.zip)
- **Windows (PowerShell)**: Run `./package-firefox.ps1`
- **Linux / macOS**: `zip -r intentional-yt.zip manifest.json background content icons styles ui utils`


---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                      manifest.json                      │
└───────────────────────────┬─────────────────────────────┘
                            │
       ┌────────────────────┴───────────────────┐
       ▼                                        ▼
┌───────────────────────┐            ┌───────────────────────┐
│   Content Scripts     │            │   Background Script   │
│ (Injected at Start)   │            │                       │
│                       │            │ background.js         │
│ blocker.js            │            │ - Alarms API          │
│ - Injects <html> CSS  │            │ - Midnight stats reset│
│                       │            └───────────────────────┘
│ youtubeObserver.js    │
│ - Hooks SPA navigation│
│                       │
│ timerToast.js         │
│ - HTML5 video events  │
│ - Real-time counter   │
│ - Toast & limit modal │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐            ┌───────────────────────┐
│ utils/storage.js      │ ◄────────► │ ui/popup.html + js    │
│ - browser.storage.local            │ - User settings UI    │
│ - Async write queue   │            │ - Live stats progress │
└───────────────────────┘            └───────────────────────┘
```

1. **`content/blocker.js`**: Injected at `document_start`. Reads settings from local storage and toggles high-specificity CSS classes on `document.documentElement` (`styles/blocker.css`).
2. **`content/youtubeObserver.js`**: Listens to YouTube SPA navigation events (`yt-navigate-finish`, `yt-page-data-updated`, `popstate`) to ensure timers and styles sync across route changes without page reloads.
3. **`content/timerToast.js`**: Observes video element `play`, `pause`, and `timeupdate` events to track active watch time and trigger soft reminder toasts or daily limit blockers.
4. **`utils/storage.js`**: Provides promise-based access to `browser.storage.local` with a FIFO write queue to prevent race conditions during rapid state updates.

---

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Stores your toggle preferences and local daily watch statistics. |
| `alarms` | Schedules the automatic daily stats reset at midnight. |
| `*://www.youtube.com/*`, `*://m.youtube.com/*` | Injects style rules and watch timer scripts onto YouTube pages. |

---

## Contributing & Issues

Bug reports and pull requests are welcome! If YouTube updates their DOM and breaks a selector:
1. Check `styles/blocker.css` for the relevant selector.
2. Submit a PR or open an issue with the broken element and URL context.

---

## License

MIT License. Free and open source for personal and educational use.
