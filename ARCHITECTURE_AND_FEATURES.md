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
  - **Daily Limit Overlay**: High-priority modal locking video playback when the daily watch threshold is exhausted (with options to finish the active video, stop watching, or dismiss for the rest of today).

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

---

## 4. Comprehensive Feature Catalog & Implementation Details

### 4.1. Feed & Discovery Controls

#### 1. Hide Home Feed (`blockHomeFeed`)
- **CSS Class**: `iyt-no-home-feed`
- **Target Surfaces**: `ytd-browse[page-subtype="home"] #contents`, `ytd-browse[page-subtype="home"] #primary`, `ytd-rich-grid-renderer` on the homepage.
- **Behavior**: Completely hides infinite homepage recommendations and displays a clean search interface, preventing dopamine-driven home feed scrolling.

#### 2. Hide Subscriptions Feed (`blockSubscriptionsFeed`)
- **CSS Class**: `iyt-no-subscriptions`
- **Target Surfaces**: `ytd-browse[page-subtype="subscriptions"] #contents`, `ytd-browse[page-subtype="subscriptions"] ytd-rich-grid-renderer`.
- **Behavior**: Hides the subscriptions feed grid when intentional search-only browsing is desired.

#### 3. Hide Explore & Trending (`blockExploreAndTrending`)
- **CSS Class**: `iyt-no-explore`
- **Target Surfaces**: Sidebar guide entry points for Trending, Explore, Gaming, Movies, and News (`ytd-guide-entry-renderer` with explore/trending endpoints).
- **Behavior**: Removes viral/trending distraction sections from navigation menus.

#### 4. Hide "More from YouTube" (`blockMoreFromYouTube`)
- **CSS Class**: `iyt-no-more-yt`
- **Target Surfaces**: `ytd-guide-section-renderer:has(#guide-section-title[title*="More from YouTube"])`, YouTube Studio, Kids, TV, and Premium promotional menu links.
- **Behavior**: Eliminates upsell and cross-promotion clutter from the left sidebar.

#### 5. Hide Top Masthead / Header (`blockTopHeader`)
- **CSS Class**: `iyt-no-top-header`
- **Target Surfaces**: `ytd-masthead#masthead`, `#background.ytd-masthead`, `#container.ytd-masthead`.
- **Behavior**: Hides the top navigation bar completely for an immersive, zero-distraction full-screen reading and viewing space.

#### 6. Hide Notification Bell (`blockNotificationBell`)
- **CSS Class**: `iyt-no-notif-bell`
- **Target Surfaces**: `ytd-notification-topbar-button-renderer`, notification counters, unread badge indicators.
- **Behavior**: Removes notification alerts and red badge numbers to reduce FOMO and check-in impulses.

---

### 4.2. Shorts Suppression Engine

#### 7. Universal Shorts Removal (`blockShorts`)
- **CSS Class**: `iyt-no-shorts`
- **Target Surfaces**:
  - Homepage: `ytd-rich-shelf-renderer[is-shorts]`, `ytd-reel-shelf-renderer`, `ytd-rich-section-renderer:has(ytd-reel-shelf-renderer)`.
  - Navigation Sidebar: `ytd-guide-entry-renderer:has(a[title="Shorts"])`, `ytd-mini-guide-entry-renderer[aria-label="Shorts"]`.
  - Search Results: `ytd-reel-shelf-renderer`, `ytd-video-renderer[is-shorts]`.
  - Channel Pages: `tp-yt-paper-tab:has(.tab-title[title="Shorts"])`, `yt-tab-shape[tab-title="Shorts"]`.
  - Watch Pages: `ytd-watch-next-secondary-results-renderer ytd-reel-shelf-renderer`.
- **Behavior**: Comprehensive multi-surface elimination of short-form algorithmic video loops across the entire platform.

---

### 4.3. Search Results Cleansing

#### 8. Clean Search Results (`blockIrrelevantSearchResults`)
- **CSS Class**: `iyt-no-irrelevant-search`
- **Target Surfaces**:
  - `ytd-shelf-renderer:has(#title-text:has-text("People also watched"))`
  - `ytd-shelf-renderer:has(#title-text:has-text("For you"))`
  - `ytd-shelf-renderer:has(#title-text:has-text("Previously watched"))`
  - `ytd-shelf-renderer:has(#title-text:has-text("Related to your search"))`
  - `ytd-horizontal-card-list-renderer`
- **Behavior**: Filters out algorithmic recommendations inserted into search results, leaving only direct search keyword matches.

---

### 4.4. Watch Page & Playback Control

#### 9. Hide Recommended Sidebar (`blockSidebar` & `blockRecommended`)
- **CSS Classes**: `iyt-no-sidebar`, `iyt-no-recommended`
- **Target Surfaces**: `#secondary.ytd-watch-flexy`, `ytd-watch-next-secondary-results-renderer`, `#related`.
- **Behavior**: Strips the "Up next" infinite scroll column on video pages and re-centers the video player for deep focus.

#### 10. Suppress Mix / Radio Playlists (`blockMixPlaylists`)
- **CSS Class**: `iyt-no-mix-playlists`
- **Target Surfaces**: `ytd-radio-renderer`, `ytd-compact-radio-renderer`, mix cards in search and recommendations.
- **Behavior**: Hides infinite automated radio and mix playlists.

#### 11. Hide Playlist Drawer (`blockPlaylist`)
- **CSS Class**: `iyt-no-playlist`
- **Target Surfaces**: `ytd-playlist-panel-renderer#playlist`, `ytd-watch-flexy[playlist] #playlist`.
- **Behavior**: Collapses the playlist side drawer during video playback.

#### 12. Hide End Screen Videowalls (`blockEndScreenVideowall`)
- **CSS Class**: `iyt-no-endscreen-wall`
- **Target Surfaces**: `.html5-endscreen.ytp-show-videowall`, `.ytp-videowall-still`.
- **Behavior**: Prevents grids of suggested video tiles from appearing over the video when it ends.

#### 13. Hide End Screen Cards (`blockEndScreenCards`)
- **CSS Class**: `iyt-no-endscreen-cards`
- **Target Surfaces**: `.ytp-ce-element`, `.ytp-ce-video`, `.ytp-ce-channel`, `.ytp-ce-covering-overlay`.
- **Behavior**: Blocks creator thumbnail cards and subscribe bubbles that float over the last 20 seconds of video playback.

#### 14. Disable Autoplay (`disableAutoplay`)
- **Implementation**: Programmatic player hook in `content/blocker.js`.
- **Behavior**: Removes the `autoplay` attribute from all `<video>` elements and clicks the `.ytp-autonav-toggle-button` if active to ensure no automatic subsequent playback.

#### 15. Hide Annotations & Overlays (`disableAnnotations`)
- **CSS Class**: `iyt-no-annotations`
- **Target Surfaces**: `.iv-branding`, `.ytp-cards-teaser`, `.ytp-cards-button`, `.ytp-suggested-action`.
- **Behavior**: Suppresses interactive overlay cards, channel watermark buttons, and promotional teasers during video playback.

---

### 4.5. Granular Metadata & Social Distractions

#### 16. Hide Video Info (`blockVideoInfo`)
- **CSS Class**: `iyt-no-video-info`
- **Target Surfaces**: `ytd-watch-metadata #title`, `#info.ytd-watch-flexy`.
- **Behavior**: Hides the video title and view count container below the video player.

#### 17. Hide Video Interaction Buttons (`blockVideoButtons`)
- **CSS Class**: `iyt-no-video-buttons`
- **Target Surfaces**: `ytd-menu-renderer.ytd-watch-metadata`, Like/Dislike pill, Share, Download, Clip, and Save buttons.
- **Behavior**: Eliminates social validation metrics and action buttons.

#### 18. Hide Channel Info (`blockChannelInfo`)
- **CSS Class**: `iyt-no-channel-info`
- **Target Surfaces**: `ytd-video-owner-renderer`, channel avatar, channel name link, and subscriber count badges.
- **Behavior**: Strips creator identity and subscriber metrics for purely content-focused viewing.

#### 19. Hide Video Description (`blockVideoDescription`)
- **CSS Class**: `iyt-no-video-desc`
- **Target Surfaces**: `#description.ytd-watch-metadata`, `ytd-text-inline-expander`.
- **Behavior**: Collapses the video description panel and promotional links below the player.

#### 20. Hide Comments Section (`blockComments`)
- **CSS Class**: `iyt-no-comments`
- **Target Surfaces**: `ytd-comments#comments`, `#comments.ytd-watch-flexy`.
- **Behavior**: Completely removes the comments section to eliminate debate rabbit holes and opinion noise.

#### 21. Mask Profile Photos (`blockProfilePhotos`)
- **CSS Class**: `iyt-no-profile-photos`
- **Target Surfaces**: `#author-thumbnail.ytd-comment-view-model yt-img-shadow`, `#author-thumbnail yt-image`.
- **Behavior**: Masks colorful user avatar photos with blank neutral circles, allowing text discussion reading without visual clutter.

#### 22. Hide Live Chat (`blockLiveChat`)
- **CSS Class**: `iyt-no-live-chat`
- **Target Surfaces**: `ytd-live-chat-frame#chat`, `#chat-container`.
- **Behavior**: Removes live streaming chat sidebars and replay stream logs.

#### 23. Hide Merch & Shopping Shelves (`blockMerch`)
- **CSS Class**: `iyt-no-merch`
- **Target Surfaces**: `ytd-merch-shelf-renderer`, `ytd-shopping-drawer-renderer`, product recommendation tiles.
- **Behavior**: Blocks e-commerce products, merchandise carousels, and sponsor store links.

---

### 4.6. Visual De-stimulation & Dopamine Reducers

#### 24. Clickbait Thumbnail Neutralization (`hideThumbnails`)
- **CSS Class**: `iyt-no-thumbnails`
- **Target Surfaces**: `ytd-thumbnail #thumbnail img`, `yt-image img`, `yt-img-shadow img`.
- **Behavior**: Replaces high-saturation thumbnail images with calm, neutral placeholders while preserving video titles and duration stamps (`ytd-thumbnail-overlay-time-status-renderer`).

#### 25. Site-Wide Grayscale Mode (`grayscaleMode`)
- **CSS Class**: `iyt-grayscale`
- **Target Surfaces**: `html.iyt-grayscale` (`filter: grayscale(100%) !important`).
- **Behavior**: Applies native hardware-accelerated grayscale rendering across YouTube, de-stimulating the brain and reducing binge-watching triggers.

---

### 4.7. Mindful Time Awareness & Limits

#### 26. Active Playback Tracking Meter
- **Component**: `content/timerToast.js`
- **Behavior**: Listens directly to HTML5 `<video>` events (`play`, `pause`, `timeupdate`, `ended`). Accumulates active watching seconds (excluding paused background tabs), flushing in 5-second batches to `browser.storage.local`.
- **Auto Midnight Reset**: `background.js` leverages the WebExtensions `alarms` API to automatically zero daily stats at 00:00 local time.

#### 27. Soft Break Reminder Toasts
- **Configuration**: `softReminder.enabled` (Boolean), `softReminder.intervalMinutes` (Integer).
- **Behavior**: Renders a floating, non-blocking toast notification across the video player every *N* minutes of continuous viewing (e.g., 15m, 30m, 45m) with current total watch time.

#### 28. Hard Daily Playback Ceiling
- **Configuration**: `dailyLimit.enabled` (Boolean), `dailyLimit.limitMinutes` (Integer).
- **Behavior**: When daily accumulated watch time exceeds the configured threshold, a high-priority fullscreen modal pauses the video and presents a mindful break screen with options to finish the current video (allowing completion without enabling further autoplay/videos), stop watching, or dismiss for the rest of today.

---

## 5. Feature & Token Reference Matrix

| # | Feature Name | Setting Key | Injected Class on `<html>` | Default State |
| :-: | :--- | :--- | :--- | :-: |
| 1 | **Hide Home Feed** | `blockHomeFeed` | `iyt-no-home-feed` | `true` |
| 2 | **Hide Recommended Column** | `blockRecommended` | `iyt-no-recommended` | `true` |
| 3 | **Hide Left Sidebar** | `blockSidebar` | `iyt-no-sidebar` | `true` |
| 4 | **Universal Shorts Suppression** | `blockShorts` | `iyt-no-shorts` | `true` |
| 5 | **Clean Search Algorithmic Shelves** | `blockIrrelevantSearchResults` | `iyt-no-irrelevant-search` | `true` |
| 6 | **Hide Explore & Trending** | `blockExploreAndTrending` | `iyt-no-explore` | `true` |
| 7 | **Hide More From YouTube** | `blockMoreFromYouTube` | `iyt-no-more-yt` | `true` |
| 8 | **Hide Notification Bell** | `blockNotificationBell` | `iyt-no-notif-bell` | `true` |
| 9 | **Hide End Screen Videowalls** | `blockEndScreenVideowall` | `iyt-no-endscreen-wall` | `true` |
| 10 | **Hide End Screen Cards** | `blockEndScreenCards` | `iyt-no-endscreen-cards` | `true` |
| 11 | **Hide Mix / Radio Playlists** | `blockMixPlaylists` | `iyt-no-mix-playlists` | `true` |
| 12 | **Hide Merch & Shopping Shelves** | `blockMerch` | `iyt-no-merch` | `true` |
| 13 | **Disable Autoplay** | `disableAutoplay` | *(Programmatic Player Action)* | `true` |
| 14 | **Disable Annotations & Overlays** | `disableAnnotations` | `iyt-no-annotations` | `true` |
| 15 | **Hide Comments Section** | `blockComments` | `iyt-no-comments` | `false` |
| 16 | **Mask User Profile Avatars** | `blockProfilePhotos` | `iyt-no-profile-photos` | `false` |
| 17 | **Hide Live Chat** | `blockLiveChat` | `iyt-no-live-chat` | `true` |
| 18 | **Hide Playlist Drawers** | `blockPlaylist` | `iyt-no-playlist` | `false` |
| 19 | **Hide Video Info & Title** | `blockVideoInfo` | `iyt-no-video-info` | `false` |
| 20 | **Hide Action / Like Buttons** | `blockVideoButtons` | `iyt-no-video-buttons` | `false` |
| 21 | **Hide Channel Info & Subs** | `blockChannelInfo` | `iyt-no-channel-info` | `false` |
| 22 | **Hide Video Description** | `blockVideoDescription` | `iyt-no-video-desc` | `false` |
| 23 | **Hide Top Header Bar** | `blockTopHeader` | `iyt-no-top-header` | `false` |
| 24 | **Hide Subscriptions Grid** | `blockSubscriptionsFeed` | `iyt-no-subscriptions` | `false` |
| 25 | **Clickbait Thumbnail Masking** | `hideThumbnails` | `iyt-no-thumbnails` | `false` |
| 26 | **Site-Wide Grayscale Filter** | `grayscaleMode` | `iyt-grayscale` | `false` |
| 27 | **Soft Interval Break Toast** | `softReminder.enabled` | *(timerToast)* | `false` |
| 28 | **Daily Playback Limit Modal** | `dailyLimit.enabled` | *(timerToast)* | `false` |

