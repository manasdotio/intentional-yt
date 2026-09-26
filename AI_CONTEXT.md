# Intentional YT — AI Context & Knowledge Base

> **Use this file as a ready-to-use context prompt for any LLM / AI tool to write social posts, Reddit threads, Product Hunt listings, release notes, documentation, or code contributions.**

---

## 📌 Executive Summary
- **Name**: Intentional YT - YouTube Distraction Blocker & Daily Time Limit
- **Version**: 2.2.0
- **License**: MIT (100% Free & Open Source)
- **Tagline**: Take back your focus. Make YouTube an intentional tool, not an endless rabbit hole.
- **One-Liner**: A zero-flash, privacy-first browser extension and modern React web app that turns YouTube into a distraction-free, search-first utility by stripping algorithmic rabbit holes, Shorts carousels, clickbait thumbnails, and infinite feeds.

---

## 🎯 Core Value Proposition
Traditional YouTube blockers either rely on rigid "all-or-nothing" settings or sluggish JavaScript DOM mutations that briefly flash distracting clickbait content before hiding it. 

**Intentional YT solves this with:**
1. **Zero-Flash DOM Ingestion**: Injects high-specificity CSS rules onto `<html>` at `document_start` before the browser renders the first pixel (0ms render lag, 0 flicker).
2. **Surgical Granularity (20+ Independent Toggles)**: Keep subscriptions while hiding home feed recommendations; hide comments but keep descriptions; etc.
3. **Quick Focus Presets (Zero Space Overhead)**: Instant switching between **Balanced**, **Zen**, and **Video Only** modes with non-intrusive floating hover tooltips.
4. **Anti-Doomscroll Feed Limiter**: Option to limit the homepage feed to a single calm batch of 15 recommendations, stopping infinite scroll with a peaceful caught-up banner (`✦ You're all caught up`).
5. **Deep Shorts Elimination & Redirection**: Completely suppresses YouTube Shorts across shelves, tabs, and search results, or redirects Shorts into standard `/watch` desktop video players.
6. **Dopamine De-stimulation**: Clickbait thumbnail neutralization (with duration badges and video titles preserved) and site-wide hardware-accelerated grayscale mode.
7. **Mindful Watch Tracking, Focus Lock & Scheduling**: Local active playback meter (HTML5 video tracking), customizable soft break reminder toasts, weekly automation scheduling, PIN-protected Focus Lock cooldowns, and hard daily watch ceilings.
8. **Modern 5-Tab Popup UI**: Clean sidebar navigation (**Block**, **Filters**, **Focus**, **Stats**, **Settings**) with instant live search across all toggles.
9. **Interactive Web Simulator**: Landing page features an authentic YouTube desktop replica with dynamic Light & Dark themes, category chips, channel avatars, and live control mirroring.
10. **100% Local Privacy (0% Telemetry)**: No remote analytics, no tracking pixels, zero external network requests. Everything is strictly sandboxed in `browser.storage.local`.

---

## ⚡ Quick Focus Presets

Users can switch focus modes instantly from the top utility bar in the popup or simulator. Hovering over the dropdown displays a sleek, zero-overhead floating tooltip explaining what each mode controls:

| YouTube Element | 🟢 Balanced (Default) | 🟣 Zen (Deep Work) | 🔵 Video Only (Lecture/Cinema) |
| :--- | :---: | :---: | :---: |
| **Home Feed** | 🚫 Hidden | 🚫 Hidden | 🚫 Hidden |
| **Shorts (All Surfaces)** | 🚫 Hidden | 🚫 Hidden | 🚫 Hidden |
| **Sidebar Recommendations** | 🚫 Hidden | 🚫 Hidden | 🚫 Hidden |
| **Autoplay & End Screens** | 🚫 Off | 🚫 Off | 🚫 Off |
| **Subscriptions Feed** | ✅ Visible | 🚫 Hidden | ✅ Visible |
| **Comments & Avatars** | ✅ Visible | 🚫 Hidden | 🚫 Hidden |
| **Video Playlists** | ✅ Visible | 🚫 Hidden | ✅ Visible |
| **Thumbnails** | ✅ Normal Color | 🚫 Focus Neutral | ✅ Normal Color |
| **Notification Bell** | 🚫 Hidden | 🚫 Hidden | ✅ Visible |

* **Balanced**: Sustainable everyday focus. Hides algorithmic rabbit holes without crippling intentional browsing (subscriptions, playlists, and comments stay accessible).
* **Zen**: Deep work and intense study. Converts YouTube into a silent, Google-like search engine utility.
* **Video Only**: Keeps eyes locked strictly on the active video. Eliminates sidebars and comment sections while keeping playlists open for multi-part lectures and tutorials.
* **Custom**: Activates automatically whenever any individual checkbox is customized.

---

## 🎛️ Complete Feature Breakdown

### 1. Feed & Algorithmic Discovery
- `blockHomeFeed`: Replaces infinite homepage recommendations with a clean, distraction-free search interface.
- `limitHomeFeed`: Caps homepage recommendations to the first 15 videos, halts infinite scroll pagination, and displays the mindful caught-up banner (`✦ You're all caught up • Feed limit active`). Mutually exclusive with `blockHomeFeed`.
- `blockSubscriptionsFeed`: Suppresses subscription feed grid when intentional search-only browsing is desired.
- `blockExploreAndTrending`: Removes trending hubs, gaming, movies, and promotional sidebar menus.
- `blockMoreFromYouTube`: Removes YouTube Premium, Studio, Kids, TV, and Music cross-promotions.
- `blockTopHeader`: Completely hides top header bar for an ultra-clean, minimal reading/viewing environment.
- `blockNotificationBell`: Eliminates unread notification badges and alert popups.

### 2. Deep Shorts Suppression & Redirection
- `blockShorts`: Multi-surface suppression across homepage shelves, sidebar tabs, search results, channel tabs, and watch-page recommendations.
- `redirectShorts`: Automatically intercepts and rewrites `/shorts/[id]` URLs to `/watch?v=[id]`, loading short videos in YouTube's standard desktop player with progress scrubbing and no auto-looping reels.

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

### 7. Time Awareness, Focus Lock & Automation
- **Passive Active Watch Meter**: Accurately tracks active `<video>` playback seconds (ignoring paused time), writing in 5-second batches.
- **Automatic Midnight Reset**: Alarms API ensures daily watch counters reset at `00:00` local time every night.
- **Soft Break Reminder Toasts**: Floating notification toasts at customizable intervals (e.g., 15m, 30m, 45m).
- **Hard Daily Playback Ceilings**: Daily watch quota locking video playback with a mindful pause overlay when exhausted.
- **PIN-Protected Focus Lock**: Protects settings during study sessions. Requires a 4-digit PIN and a mandatory cooldown delay (1m, 3m, 5m) before protections can be disabled, preventing impulse unlocks.
- **Scheduled Blocking Engine**: Automates quiet hours and work periods. Supports custom multi-day schedules (Mon–Sun), start/end time windows, and two modes:
  - *Full Block*: Reopens YouTube only when the scheduled window closes with a serene commitment screen.
  - *Strict Protections*: Forces all distraction blocks on while keeping intentional playback allowed.

### 8. Channel & Keyword Filtering (Filters Tab)
- `channelBlocklist`: Array of blocked channel names/handles (case-insensitive client-side DOM match). Hides whole video cards across home feed, search, and sidebar.
- `keywordBlocklist`: Array of blocked title keywords (case-insensitive substring match). Hides video cards whose titles contain any blocked keyword.
- `enableQuickBlock`: Solid, high-contrast 1-click Block button displayed next to channel names on video cards for instant blocking without popup interaction.
- **Strictly Local**: Client-side text matching only, 0% telemetry, zero remote requests.

---

## 🧭 Extension Popup Architecture (5 Tabs)
1. **Block**: Live toggle search, preset dropdown with zero-space hover tooltip, and 5 collapsible accordion categories (**Feed**, **Video**, **Social**, **Interface**, **Appearance**).
2. **Filters**: Channel & Keyword Blocklists with removable chips, quick suggestions, Clear all, and 1-Click In-Feed Quick Block toggle.
3. **Focus**: Mindful session time limits, soft break reminders, Focus Lock PIN settings, and Scheduled Blocking management.
4. **Stats**: Daily active watch meter hero card, reset controls, and persistent bottom status bar.
5. **Settings**: Theme switcher (Auto, Dark, Light), i18n language selector, JSON configuration backup & restore, reset defaults, and review CTAs.

---

## 💻 Landing Page Web Simulator
- **Live Interactive Replica**: Allows users to test the extension directly in the browser before installing.
- **Dual Theme Support (Light & Dark)**: Full fidelity with YouTube's real light (`#ffffff`) and dark (`#0f0f0f`) themes, coupled to the site's theme switcher and featuring an independent YouTube theme toggle (☀️ / 🌙).
- **Authentic Desktop UI**: Category chips bar (`All`, `Deep Work`, `Calculus`), creator avatars with verified badges (`✓`), video duration stamps, and realistic vertical 9:16 Shorts shelf.
- **Zero-Space Preset Tooltip**: Hovering the preset dropdown reveals snappy, concise mode descriptions identical to the extension popup.

---

## 🛠️ Tech Stack & Platforms

| Area | Technology |
| :--- | :--- |
| **Extension Standard** | WebExtensions Manifest V3 (Cross-browser compatible) |
| **Browsers Supported** | Google Chrome (Chrome Web Store Verified), Mozilla Firefox (AMO Verified), Brave, Edge, Arc |
| **Styling & Injection** | Zero-flash high-specificity CSS injected at `document_start` |
| **State & Lifecycle** | Native `browser.storage.local` with sequential FIFO write queue & SPA route observers |
| **Web & Landing Page** | React 19, Vite, Lucide Icons, pure CSS design system |
| **Hosting & Deploy** | Vercel (`dist/` build output) & GitHub Pages |

---

## 🔗 Official Links & Metadata
- **Chrome Web Store**: https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg
- **Firefox Add-ons Store**: https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/
- **Feedback & Feature Requests**: https://forms.gle/EFixUed5F5bmVvFX7
- **GitHub Repository**: https://github.com/manasdotio/intentional-yt
- **Author**: manasdotio (Manas Singh)
- **License**: MIT
