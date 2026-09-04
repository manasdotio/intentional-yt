# Intentional YT — AI Context & Knowledge Base

> **Use this file as a ready-to-use context prompt for any LLM / AI tool to write social posts, Reddit threads, Product Hunt listings, release notes, documentation, or code contributions.**

---

## 📌 Executive Summary
- **Name**: Intentional YT
- **Version**: 2.0.1
- **License**: MIT (100% Free & Open Source)
- **Tagline**: Take back your focus. Make YouTube an intentional tool, not an endless rabbit hole.
- **One-Liner**: A zero-flash, privacy-first browser extension and modern React web app that turns YouTube into a distraction-free, search-first utility by stripping algorithmic rabbit holes, Shorts carousels, clickbait thumbnails, and infinite feeds.

---

## 🎯 Core Value Proposition
Traditional YouTube blockers either rely on rigid "all-or-nothing" settings or sluggish JavaScript DOM mutations that briefly flash distracting clickbait content before hiding it. 

**Intentional YT solves this with:**
1. **Zero-Flash DOM Ingestion**: Injects high-specificity CSS rules onto `<html>` at `document_start` before the browser renders the first pixel (0ms render lag, 0 flicker).
2. **Surgical Granularity (20+ Independent Toggles)**: Keep subscriptions while hiding home feed recommendations; hide comments but keep descriptions; etc.
3. **Deep Shorts Elimination**: Completely suppresses YouTube Shorts across homepage shelves, sidebar tabs, search results, channel tabs, and watch recommendations.
4. **Dopamine De-stimulation**: Clickbait thumbnail neutralization (with duration badges and video titles preserved) and site-wide hardware-accelerated grayscale mode.
5. **Mindful Watch Tracking**: Local active playback meter (HTML5 video tracking), customizable soft break reminder toasts, and hard daily watch ceilings with automated midnight resets.
6. **100% Local Privacy (0% Telemetry)**: No remote analytics, no tracking pixels, zero external network requests. Everything is strictly sandboxed in `browser.storage.local`.

---

## 🎛️ Complete Feature Breakdown

### 1. Feed & Algorithmic Discovery
- `blockHomeFeed`: Replaces infinite homepage recommendations with a clean, distraction-free search interface.
- `blockSubscriptionsFeed`: Suppresses subscription feed grid when intentional search-only browsing is desired.
- `blockExploreAndTrending`: Removes trending hubs, gaming, movies, and promotional sidebar menus.
- `blockMoreFromYouTube`: Removes YouTube Premium, Studio, Kids, TV, and Music cross-promotions.
- `blockTopHeader`: Completely hides top header bar for an ultra-clean, minimal reading/viewing environment.
- `blockNotificationBell`: Eliminates unread notification badges and alert popups.

### 2. Deep Shorts Suppression
- `blockShorts`: Multi-surface suppression across homepage shelves, sidebar tabs, search results, channel tabs, and watch-page recommendations.

### 3. Search Results Cleansing
- `blockIrrelevantSearchResults`: Filters out algorithmic injection rows (*"People also watched"*, *"For you"*, *"Previously watched"*, *"Related to your search"*, and *"Latest from channel"*).

### 4. Watch Page & Player Controls
- `blockSidebar` & `blockRecommended`: Removes the "Up next" recommendation column and centers the video player.
- `blockMixPlaylists`: Hides endless automated "Mix" and "Radio" station playlists.
- `blockPlaylist`: Collapses playlist side panels during active viewing.
- `blockEndScreenVideowall`: Prevents grid recommendation tiles from displaying upon video completion.
- `blockEndScreenCards`: Blocks floating creator cards and subscribe overlays during the final seconds of a video.
- `disableAutoplay`: Removes the autoplay attribute and turns off YouTube's native autonav toggle switch.
- `disableAnnotations`: Blocks creator cards, promotional popups, and banner overlays.

### 5. Granular Metadata & Social Distractions
- `blockVideoInfo`: Hides the video title and primary metadata container.
- `blockVideoButtons`: Strips Like, Dislike, Share, Download, Clip, and Save buttons.
- `blockChannelInfo`: Hides channel avatar, name, and subscriber count badges.
- `blockVideoDescription`: Suppresses the expandable video description box.
- `blockComments`: Completely removes the comment section.
- `blockProfilePhotos`: Replaces user comment avatars with blank circles to reduce visual stimulation while keeping discussion text readable.
- `blockLiveChat`: Disables live chat drawers and replay streams.
- `blockMerch`: Suppresses product carousels, store shelves, and shopping tags.

### 6. Visual De-stimulation & Dopamine Reducers
- `hideThumbnails`: Replaces saturated thumbnails with clean placeholders while preserving exact duration stamps and video titles.
- `grayscaleMode`: Applies a native hardware-accelerated grayscale filter across the entire YouTube interface.

### 7. Time Awareness & Mindful Watch Limits
- **Passive Active Watch Meter**: Accurately tracks active `<video>` playback seconds (ignoring paused time), writing in 5-second batches.
- **Automatic Midnight Reset**: Alarms API ensures daily watch counters reset at `00:00` local time every night.
- **Soft Break Reminder Toasts**: Floating notification toasts at customizable intervals (e.g., 15m, 30m, 45m).
- **Hard Daily Playback Ceilings**: Daily watch quota locking video playback with a mindful pause overlay when exhausted.

---

## 🛠️ Tech Stack & Platforms

| Area | Technology |
| :--- | :--- |
| **Extension Standard** | WebExtensions Manifest V2 (Cross-browser compatible) |
| **Browsers Supported** | Mozilla Firefox (AMO Verified), Google Chrome, Brave, Edge, Arc |
| **Styling & Injection** | Zero-flash high-specificity CSS injected at `document_start` |
| **State & Lifecycle** | Native `browser.storage.local` with sequential FIFO write queue & SPA route observers |
| **Web & Landing Page** | React 19, Vite, Lucide Icons, pure CSS design system |
| **Hosting & Deploy** | Vercel (`dist/` build output) & GitHub Pages |

---

## 🔗 Official Links & Metadata
- **GitHub Repository**: https://github.com/manasdotio/intentional-yt
- **Firefox Add-ons Store**: https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/
- **Author**: manasdotio (Manas Singh)
- **License**: MIT
