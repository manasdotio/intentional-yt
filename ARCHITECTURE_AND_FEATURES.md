# Intentional YT — Architecture & Technical Design

This document details the internal architecture, component roles, state management, and lifecycle events of **Intentional YT**.

---

## 1. Architectural Overview

Intentional YT is built with a zero-overhead, CSS-first philosophy. Instead of heavy JavaScript MutationObservers continuously mutating YouTube's DOM, it uses CSS class names attached to the root `<html>` element combined with YouTube SPA navigation hooks.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Extension Architecture                           │
└─────────────────────────────────────────────────────────────────────────────┘

 [ Browser / Firefox ]
       │
       ├── background/background.js
       │     └─ Alarms API: schedules midnight daily stats reset
       │
       ├── utils/storage.js
       │     └─ Promise-based storage layer with sequential FIFO write queue
       │
       ├── ui/popup.html + ui/popup.js
       │     └─ Settings toggles, custom timer dropdowns, live daily stats meter
       │
       └── Content Scripts (Injected on youtube.com/*)
             ├── blocker.js
             │     └─ Applies/removes CSS classes on <html> based on settings
             │
             ├── youtubeObserver.js
             │     └─ Hooks YouTube SPA route transitions & lifecycle events
             │
             └── timerToast.js
                   ├─ Tracks HTML5 <video> play/pause events
                   ├─ Batches watch time writes to storage every 5s
                   ├─ Triggers soft reminder toast at configured intervals
                   └─ Intercepts playback with fullscreen limit overlay when daily cap is reached
```

---

## 2. Component Roles

### `utils/storage.js`
- **`StorageManager`**: Central configuration schema and helper methods.
- **Write Queue (`_writeQueue`)**: Chained promises ensure sequential execution of all `storage.local.set()` calls to eliminate race conditions when multiple content scripts or rapid UI interactions write simultaneously.
- **Auto Daily Reset**: Automatically verifies `stats.lastStatsReset === today` on fetch and resets metrics if the date has changed.

### `content/blocker.js`
- Runs at `document_start`.
- Maps setting keys (e.g., `blockHomeFeed`, `blockShorts`, `grayscaleMode`) to specific CSS classes (`iyt-no-home-feed`, `iyt-no-shorts`, etc.) on `document.documentElement`.
- Reacts instantly to setting updates via `browser.storage.onChanged`.
- Enforces autoplay disabling on active `<video>` elements and the YouTube player autoplay button (`.ytp-autonav-toggle-button`).

### `content/youtubeObserver.js`
- YouTube navigates via client-side routing without full page reloads.
- Listens to `yt-navigate-finish`, `yt-page-data-updated`, `yt-player-updated`, and `popstate`.
- Calls `IYT_Timer.attach()` when navigating to video pages (`/watch`, `/shorts`, `/live`, `/embed`), and `IYT_Timer.detach()` on non-video pages.

### `content/timerToast.js`
- Attaches event listeners directly to the active HTML5 `<video>` element (`play`, `playing`, `pause`, `timeupdate`, `ended`).
- Tracks session seconds during active playback and flushes watch time in 5-second batches to reduce storage I/O.
- Immediately flushes pending time on `beforeunload`, `pagehide`, and `visibilitychange (hidden)`.
- Renders:
  - **Soft Reminder Toast**: Non-intrusive floating toast notifying viewers of watch duration every *N* minutes.
  - **Daily Limit Overlay**: High-priority modal locking video playback when the daily watch threshold is exhausted (with options to stop watching or dismiss for the rest of today).

### `background/background.js`
- Lightweight event-driven background script (non-persistent).
- Configures midnight daily reset alarms using the WebExtension `alarms` API.

---

## 3. Storage Schema

```json
{
  "settings": {
    "extensionEnabled": true,

    "blockHomeFeed": true,
    "blockSidebar": true,
    "blockRecommended": true,
    "blockLiveChat": true,
    "blockPlaylist": false,
    "blockEndScreenVideowall": true,
    "blockEndScreenCards": true,
    "blockComments": false,
    "blockProfilePhotos": false,
    "blockMixPlaylists": true,
    "blockMerch": true,
    "blockVideoInfo": false,
    "blockVideoButtons": false,
    "blockChannelInfo": false,
    "blockVideoDescription": false,
    "blockTopHeader": false,
    "blockNotificationBell": true,
    "blockIrrelevantSearchResults": true,
    "blockExploreAndTrending": true,
    "blockMoreFromYouTube": true,
    "blockShorts": true,
    "blockSubscriptionsFeed": false,
    "disableAutoplay": true,
    "disableAnnotations": true,

    "hideThumbnails": false,
    "grayscaleMode": false,

    "softReminder": {
      "enabled": false,
      "intervalMinutes": 30
    },
    "dailyLimit": {
      "enabled": false,
      "limitMinutes": 60
    },

    "stats": {
      "todayWatchSeconds": 0,
      "limitDismissedToday": false,
      "lastStatsReset": "YYYY-MM-DD"
    }
  }
}
```
