# Intentional YT

YouTube Focus Guard is a Firefox WebExtension for making YouTube usage more deliberate.

Privacy and release docs:

- See [PRIVACY.md](PRIVACY.md) for the current privacy policy.
- See [AMO_CHECKLIST.md](AMO_CHECKLIST.md) for the Firefox Add-ons submission checklist.

It combines four ideas:

- block the most distracting recommendation surfaces
- separate Research from Entertainment viewing
- enforce a daily entertainment limit
- interrupt aimless browsing on the YouTube home page

The extension is built around YouTube's single-page app behavior, so it keeps reacting when YouTube changes routes without a full page reload.

## What The Extension Does

### Night Lock
- Blocks YouTube during configured sleep hours.
- Redirects locked access to a blocked page with the active lock reason.
- Runs from the background scripts, so it can react on tab updates and scheduled checks.

### Research Mode
- Lets you keep a saved research topic as keywords.
- Uses Topic Guard to warn when a clicked or opened video drifts away from the current topic.
- Tracks research watch time in stats.
- Hides the entertainment watch timer while research is active.
- Supports a research channel allowlist so trusted channels can bypass topic drift checks.

### Entertainment Mode
- Shows a floating watch timer on watch pages.
- Tracks watch time against a daily entertainment limit.
- Enforces the daily limit by redirecting to the blocked page when the limit is exhausted.
- Keeps periodic reminder thresholds for long watch sessions.

### Browsing Mode
- Prompts for intent on the YouTube home page.
- Allows a short intentional browsing window instead of immediate infinite scrolling.
- Shows a separate browsing countdown on watch pages while the browsing session is active.
- Supports a limited number of browsing extensions before cooldown applies.

### Recommendation Blocking
- Hides the YouTube home feed.
- Suppresses watch-page recommendations where possible.
- Suppresses end-screen suggestions where possible.
- Blocks Shorts pages.
- Suppresses other algorithm-heavy surfaces such as trending-style areas when selectors match.

### Popup Controls
The popup is the main control surface for the extension. It currently provides:

- extension on/off toggle
- current mode, session time, topic, and entertainment usage summary
- manual Research and Entertainment mode buttons
- Start Research action
- inline topic editor with Save and Clear actions
- current browsing-session status with Stop Browsing
- daily stats panel
- Night Lock toggle and time inputs
- entertainment limit editor
- research channel allowlist editor
- Reset Daily Stats

## Current Defaults

- Night Lock: enabled
- Night Lock window: `23:30` to `06:00`
- Entertainment limit: `60` minutes per day
- Browsing session duration: `15` minutes
- Browsing extensions available: `2`
- Watch reminder intervals: `25`, `15`, `10`, `5` minutes

These defaults come from [utils/storage.js](utils/storage.js).

## Mode Flow

### Research entry paths
There are three main ways to end up in Research mode:

1. Choose Research from the watch-page Research vs Entertainment prompt.
2. Enter a topic in the popup and use Start Research.
3. Toggle Research Mode manually from the popup.

### Entertainment entry paths
You enter Entertainment mode by:

1. choosing Entertainment in the watch-page prompt
2. toggling Entertainment Mode from the popup
3. falling back to Entertainment when no stronger research context applies

### Topic behavior
The research topic is stored as a keyword array under `settings.research.currentTopic`.

You can:

- save keywords manually from the popup
- clear them explicitly when changing subjects
- let the watch-page flow infer topic keywords from search context and video titles

If Research mode is active but no topic exists, the mode still works, but topic drift protection is weaker until a topic is saved or inferred.

## Topic Guard

Topic Guard enforces research focus in two places:

- before navigation, by checking clicked video links
- after navigation, by checking the resolved watch page again

That second pass matters because YouTube is a single-page app and route transitions can complete without a full reload.

Topic Guard also supports a one-time allow action for a specific unrelated video, so an explicit bypass does not immediately re-trigger on the same navigation.

## YouTube SPA Handling

The extension does not rely on `window.onload` for route changes.

The current runtime is built around YouTube navigation events such as:

- `yt-navigate-start`
- `yt-navigate-finish`
- `yt-page-data-updated`
- `popstate`

This is lighter and more reliable than long-lived full-subtree `MutationObserver` polling for every route change.

## Timer Behavior

### In Entertainment mode
- The watch timer is shown on watch pages.
- Entertainment time contributes to the daily limit.
- Reminder thresholds are still active.
- Reaching the daily limit redirects to the blocked page.

### In Research mode
- The watch timer is hidden.
- Research time is still counted in daily stats.
- Research time does not consume the entertainment limit.

### In Browsing Mode
- A separate browsing timer is shown while the browsing session is active.
- The browsing overlay only appears on watch pages.
- When the browsing window expires, the user must decide whether to extend or stop.

## Stats And Storage

Settings are stored in `browser.storage.local`.

The extension does not send this data to remote servers. Current data handling details are documented in [PRIVACY.md](PRIVACY.md).

The main settings groups are:

- `nightLock`
- `entertainment`
- `research`
- `browsingMode`
- `watchTimer`
- `stats`

Important stored values include:

- `research.mode`
- `research.currentTopic`
- `research.allowedChannels`
- `entertainment.dailyLimit`
- `entertainment.todayUsed`
- `browsingMode.active`
- `browsingMode.cooldownUntil`

Daily stats track:

- total watch time
- research time
- entertainment time
- entertainment usage against the limit

## Installation

### Temporary Firefox install
1. Open Firefox.
2. Go to `about:debugging`.
3. Open `This Firefox`.
4. Click `Load Temporary Add-on`.
5. Select [manifest.json](manifest.json).

More setup detail is available in [INSTALL.md](INSTALL.md).

## Project Structure

```text
yt-blocker/
|-- manifest.json
|-- README.md
|-- INSTALL.md
|-- background/
|   |-- scheduler.js
|   |-- scheduler.ts
|   |-- usageTracker.js
|   `-- usageTracker.ts
|-- content/
|   |-- browsingMode.js
|   |-- browsingMode.ts
|   |-- recommendationBlocker.js
|   |-- recommendationBlocker.ts
|   |-- timerOverlay.js
|   |-- timerOverlay.ts
|   |-- topicGuard.js
|   |-- topicGuard.ts
|   |-- youtubeObserver.js
|   `-- youtubeObserver.ts
|-- icons/
|   `-- ...
|-- styles/
|   `-- ui.css
|-- ui/
|   |-- blocked.html
|   |-- modal.html
|   |-- popup.html
|   |-- popup.js
|   `-- popup.ts
`-- utils/
    |-- storage.js
    |-- storage.ts
    |-- time.js
    `-- time.ts
```

## Important Implementation Notes

- The manifest runs the JavaScript files, not the TypeScript files.
- Keep `.js` and `.ts` files in sync when changing runtime behavior.
- Main YouTube route coordination lives in [content/youtubeObserver.js](content/youtubeObserver.js).
- Browsing Mode logic lives in [content/browsingMode.js](content/browsingMode.js).
- Topic enforcement lives in [content/topicGuard.js](content/topicGuard.js).
- Entertainment tracking and daily-limit enforcement live in [background/usageTracker.js](background/usageTracker.js) and [background/scheduler.js](background/scheduler.js).
- Popup behavior lives in [ui/popup.js](ui/popup.js).
- Shared popup, overlay, modal, and blocked-page styles live in [styles/ui.css](styles/ui.css).

## Testing Guide

### Basic smoke test
1. Load the extension in Firefox.
2. Open YouTube home.
3. Confirm the home feed is hidden.
4. Confirm the home-page intent flow appears when appropriate.
5. Search for a topic.
6. Open a video and confirm the Research vs Entertainment flow behaves as expected.

### Research flow
1. Search for a topic.
2. Open a video.
3. Choose Research.
4. Confirm the timer hides.
5. Open the popup and confirm the topic is visible.
6. Open a related video and confirm Topic Guard allows it.
7. Open an unrelated video and confirm Topic Guard warns or blocks it.

### Entertainment flow
1. Switch to Entertainment.
2. Confirm the watch timer appears.
3. Confirm entertainment usage increases.
4. Lower the daily limit and confirm enforcement works.

### Browsing flow
1. Open YouTube home.
2. Confirm the intent prompt appears.
3. Start Browsing Mode.
4. Open a watch page and confirm the browsing countdown is visible.
5. Stop browsing from the popup and confirm the browsing session clears.

### Night Lock flow
1. Set Night Lock around the current time.
2. Enable Night Lock.
3. Open or reload YouTube.
4. Confirm the blocked page appears during locked hours.

## Known Constraints

- Recommendation blocking depends on YouTube DOM structure and may need selector updates when YouTube changes markup.
- Topic relevance detection is keyword-based, not semantic.
- Manual Research mode with no topic is allowed, but topic enforcement is weaker until a topic exists.
- The popup, watch-page prompt, and inferred-topic flow all write to the same research state, so switching modes aggressively in one tab can still produce edge cases.

## Development Notes

1. Edit the TypeScript source when possible.
2. Keep the JavaScript runtime files updated to match.
3. Reload the temporary add-on in Firefox after changes.
4. Re-test YouTube SPA navigation after route-handling or mode-logic edits.

## Support

If behavior stops matching this README, inspect these files first:

- [content/youtubeObserver.js](content/youtubeObserver.js)
- [content/browsingMode.js](content/browsingMode.js)
- [content/topicGuard.js](content/topicGuard.js)
- [background/usageTracker.js](background/usageTracker.js)
- [ui/popup.js](ui/popup.js)
