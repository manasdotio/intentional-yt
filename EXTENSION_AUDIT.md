# Extension audit — 2026-09-28

## Implementation status — completed 2026-09-28

The 16 numbered findings below have implementation fixes. The additional concrete issues in performance, scan scheduling, feed limits, mobile selectors, schedule transitions, accessibility, localization, packaging, and unused remote-font CSS have also been addressed. The feature ideas remain a roadmap, rather than requirements of this repair.

| Findings | Implemented changes |
| --- | --- |
| 1, 11 | Background-only serialized commands, separate usage storage, idempotent watch batches, legacy stats migration, conditional date rollover, and startup alarm reconciliation. |
| 2, 8 | One background policy protects all weakening changes; PIN-verified commands and deadlines persist independently of the popup. Schedule commands target individual IDs, preserving other edits during cooldown. Snooze duration starts after approval. |
| 3, 4, 6 | Shared effective settings combine enable/snooze/schedules. Normal application cannot undo Strict Focus. Removed the broken cached-strict fast path; document-start bootstrap CSS covers startup. |
| 5 | Allowlisted nested schema and bounds, atomic rejection, versioned portable backups, escaped/DOM-assigned IDs, no imported PINs or pending commands. Malformed existing settings are retained in local recovery storage. |
| 7, 9, 10 | Schedule blocking only pauses media; attachment is cancellable and idempotent. Elapsed playback replaces callback counting, with buffering/seeking/ad exclusions. Paused same-video refreshes preserve finish-video grace. |
| 12, 13 | All archives include fonts and 26 locales. Shared packaging entry point, explicit runtime floor, unambiguous Firefox output, and browser-specific distribution manifests. Source retains both background declarations. |
| 14, 15 | Exact names plus handles/channel IDs, international handle decoding, no page-owner inheritance, updates for reused/text-only cards, and effective-state checks before deferred filtering. |
| 16 | Native bootstrap CSS plus structural feed/Shorts selectors; ready state releases once authoritative preferences and schedule classes apply. |

Other changes: translated schedule/Quick Block actions; index-correct localization placeholders; dialog focus trapping, background isolation and restoration; Quick Block keyboard/touch access; a consistent 15-card limit; minute-boundary/focus schedule reconciliation; overlap-aware reopening; static HTML templates with DOM-assigned dynamic text; and popup layout fixes at 320px.

Validation completed:

- `npm run test:extension`: **21 passing tests** covering concurrency, validation, policy, deadlines/restarts, schedule overlaps, timer lifecycle/accounting, channel matching, localization and ZIP contents/CRC.
- Real headless Chromium with the extension loaded: worker/popup/font initialization, content-script injection on desktop and mobile YouTube origins, default feed CSS, exact filtering, Quick Block, reused cards, Strict Focus across navigation, full-block/snooze/media restoration, PIN flow, popup-closed deadline application, all popup tabs at 320px in English/Arabic and light/dark, and no page JavaScript errors.
- `npm run package`: rebuilt Chrome, Edge and Firefox ZIPs.
- `web-ext lint` on the extracted Firefox distribution: **0 errors, 0 warnings, 0 notices**.
- Whitespace/error check passed on changed extension files.

Browser integration uses controlled YouTube-shaped fixtures at the actual matching origins, not live YouTube accounts. This proves browser/runtime integration and the tested DOM structures; it cannot certify every current YouTube experiment. Firefox runtime, real-device sleep and live-site layout coverage remain manual release checks. No landing-page files were edited for this repair, so the Next.js build is outside its validation scope.

Watch-time semantics: aggregate real playback time across playing tabs, including background playback; exclude buffering, seeking and detected ads. Statistics can continue while protection is disabled/snoozed, but limits/reminders/schedules do not enforce. Existing user data remains local. See `tests/README.md` for repeatable checks.

## Follow-up additions — 2026-09-28

Implemented clear popup status, 25/45/60-minute Strict Focus sessions, and an optional advance daily-limit warning. Session deadlines survive popup closure/restarts; early endings respect Focus Lock. Warnings reuse the playback timer and are deduplicated locally across tabs. The popup status only refreshes while open, and schedule end calculations inspect end boundaries instead of every minute. No runtime dependency or network request was added.

Validation: 27 dependency-free tests; Chromium integration covering session controls, deadline reconciliation, preference restoration, live budget display, real fixture playback warnings, no repeated warning, and 320px light/dark/RTL layouts. Distribution archives rebuilt. These remain controlled fixtures, not live YouTube layout certification.

## Original audit (historical findings)

Scope: manifest, all extension JavaScript, popup markup/styles, blocking CSS, 26 locale catalogs, and the Node/Bash/PowerShell packaging paths. The marketing site is outside this audit. No extension implementation files were changed.

Evidence: source review, JavaScript syntax compilation, isolated Node VM reproductions, locale validation, and execution of the actual Node packager with archive writes intercepted in memory. These are not live Chrome/Firefox or current YouTube DOM tests. DOM compatibility, paint timing, accessibility behavior, and real background timer throttling still need browser validation.

## Fix first

### 1. High — concurrent contexts overwrite settings and watch time

Locations: `utils/storage.js:125`, `utils/storage.js:140`, `content/timerToast.js:345`.

Each tab, popup, and background context has its own `_writeQueue`. They all read and replace the entire `settings` object. The queue serializes only writes in its own context. A timer flush can therefore overwrite a popup change; two tabs can lose watch-time increments. Reset and expired-snooze paths can also write stale snapshots.

Reproduced with two independent VM contexts sharing mocked storage: concurrent updates to `blockComments=true` and `blockPlaylist=true` left comments false and playlist true.

Fix: make the background the sole writer; send validated commands/deltas to one serialized mutation queue. Separate usage statistics from preferences. Make date rollover and increments one serialized operation, with idempotent batch IDs if retrying messages.

### 2. High — Focus Lock can be bypassed through ordinary controls

Locations: `ui/popup.js:2006`, `ui/popup.js:2070`, `ui/popup.js:2194`, `ui/popup.js:2269`, `ui/popup.js:2473`, `content/timerToast.js:327`.

Disabling the daily limit requires PIN/cooldown, but increasing its minutes, resetting today's usage, or selecting “Dismiss for today” does not. Disabling/deleting a schedule is protected, but editing its days/time or changing full block to strict mode is not. Cooldown can also be shortened without protection. Snooze asks for a PIN but skips the cooldown (`ui/popup.js:1152`).

Reproduction: enable Focus Lock and a short daily limit, then raise the limit or reset statistics. For a schedule, edit its active hours to exclude the current time.

Fix: define which changes weaken protection and enforce that policy centrally for all entry points. Apply it to limit increases, usage resets, daily overrides, schedule edits, snooze, and cooldown reductions. Treat Focus Lock as a commitment aid, not a security boundary against the browser owner.

### 3. High — daily limits and reminders ignore master disable/snooze

Locations: `content/timerToast.js:66`, `content/timerToast.js:424`, `content/timerToast.js:607`, `content/scheduledBlocker.js:325`.

`_isLimitExceeded()` never checks `extensionEnabled` or `snoozeUntil`. Reminder checks also omit them. The timer's storage listener can create a limit overlay even when no video is attached, using the document body fallback. Scheduled blocking respects master disable but ignores snooze.

Reproduced the actual limit predicate returning true with both `extensionEnabled=false` and a future snooze time.

Fix: establish one effective-protection policy used by every module. Guard playback enforcement and overlays with it and with a valid video route/attachment. Decide whether passive statistics continue while disabled; make that a separate policy. Explain explicitly if schedules are intended to override snooze.

### 4. High — Strict Focus is overwritten by normal settings

Locations: `content/scheduledBlocker.js:296`, `content/blocker.js:843`, `content/youtubeObserver.js:25`.

The scheduler adds all blocking classes. Normal `applyAllClasses()` removes classes whose saved switches are false. Navigation, storage updates, and direct popup messages invoke normal application independently of the scheduler. Listener completion order determines the final appearance; the class observer only restores saved enabled switches, not schedule overrides. Strict mode also does not independently enforce autoplay disabling.

Reproduced a strict comments class being removed by the actual normal application function with `blockComments=false`.

Fix: compute effective settings from defaults, preferences, snooze, and active schedules in one place. Have one function own DOM state and behavioral controls.

### 5. High — imports can persist invalid data and break consumers

Locations: `utils/storage.js:200`, `ui/popup.js:2394`, `ui/popup.js:1235`.

Import checks only that the root is an object. Invalid nested structures, numbers in string lists, invalid times, and arbitrary keys are accepted. Consumers then call array/string methods on those values. The malformed settings are saved before popup rendering fails, so the error toast does not roll back the damage. Imported schedule IDs are interpolated into HTML attributes without escaping, permitting markup injection; this is not a demonstrated script-execution exploit.

Reproduced successful import of `{"scheduledBlocking":{"enabled":true,"schedules":"invalid"},"channelBlocklist":[42]}`.

Fix: validate an allowlisted, versioned schema before writing; validate nested types, finite ranges, schedule times/days/modes, list lengths and string lengths. Reject atomically with field-specific errors. Use DOM properties for identifiers rather than HTML interpolation. Exclude transient pending actions from portable backups or validate them separately.

## Reliability and release defects

### 6. Medium — cached Strict Focus throws before initialization

Locations: `content/scheduledBlocker.js:81`, `content/scheduledBlocker.js:93`, `content/scheduledBlocker.js:296`.

The synchronous cached `strict` branch calls `applyStrictMode()` before the `const ALL_BLOCK_CLASSES` initializer. This throws a temporal-dead-zone ReferenceError, swallowed by the broad catch. Async evaluation eventually recovers, but the fast path does not work.

VM reproduction with cached strict mode and storage unresolved restored zero classes. Move constants above the fast path; validate cached state expiry before using it.

### 7. Medium — full schedule blocking destroys playback state

Locations: `content/scheduledBlocker.js:17`, `content/scheduledBlocker.js:71`, `content/scheduledBlocker.js:289`.

Freezing sets `muted=true`, `volume=0`, and `currentTime=0`. Removing the overlay only removes observers/listeners and classes. Ending or disabling a schedule leaves the existing player muted, at zero volume, and rewound.

Fix: pause without rewinding. If muting is needed to prevent startup audio, snapshot state per media element and restore it when appropriate, without automatically resuming playback.

### 8. Medium — cooldown actions depend on the popup staying open

Locations: `ui/popup.js:999`, `ui/popup.js:1057`; `background/background.js`.

Only the popup countdown applies pending unlocks. Closing the popup means the action is not applied at the deadline; reopening triggers it. The timer can also be recreated immediately after an expired action starts, without an in-flight guard.

Fix: handle pending actions in the background using persisted deadlines, startup reconciliation, and idempotent application. The popup should display state. If importing requires a user gesture, mark it eligible after cooldown and provide an explicit import button rather than programmatically opening a picker from a timer.

### 9. Medium — timer attachment has no cancellation and resets grace state

Locations: `content/timerToast.js:502`, `content/timerToast.js:515`, `content/timerToast.js:559`, `content/youtubeObserver.js:20`.

`attach()` polls asynchronously without a route generation or cancellation token. A pending attachment can complete after navigation/detach. If the same player is paused, repeated forced route events bypass the active-interval guard, call `detach()`, and reset session time and `_allowedVideoId`. “Finish this video” can be revoked by unrelated player/page refresh events.

Fix: make attachment idempotent for an element/video ID, cancel stale polls, and keep daily grace and reminder accounting separate from DOM listener lifetime. Add tests for paused SPA navigation and late player insertion.

### 10. Medium — timer counts callbacks, not elapsed playback

Location: `content/timerToast.js:381`.

Every one-second interval adds exactly one second. Delayed callbacks therefore undercount elapsed playback. Multiple playing tabs count independently; the product does not define whether the budget measures combined playback or elapsed user time. Rapid pauses/re-attachments also lose fractional seconds.

Fix: use monotonic elapsed deltas while playback is active, retaining fractional accumulation and excluding buffering. Define ads, background playback, playback speed, and simultaneous-tab policy. Coordinate tabs in the background if the budget is wall-clock usage. Validate throttling and sleep behavior in real browsers.

### 11. Medium — midnight reset is not reconciled on startup

Locations: `background/background.js:83`, `background/background.js:101`.

Startup checks snooze but does not ensure the daily reset alarm exists. Date-based lazy resets mitigate this but do not guarantee idle pages reset promptly. An overdue midnight alarm also resets unconditionally, even if another path has already reset and accumulated usage for the new date.

Fix: verify the alarm at background startup and make rollover conditional on the stored date inside the central write queue. [Chrome's alarm guidance](https://developer.chrome.com/docs/extensions/reference/api/alarms) recommends checking important alarms whenever the worker starts, particularly across browsers and older versions.

### 12. Medium — all generated archives omit popup fonts

Locations: `styles/popup.css:1`, `scripts/package.cjs:150`, `package.sh`, `package-firefox.ps1`.

The popup references four `../fonts/Inter-*.woff2` assets, but no packaging include list contains `fonts`. In-memory execution of the real packager confirmed zero font entries in Chrome, Edge, and Firefox archives. Unpacked development hides the defect.

Fix: include fonts in every packaging path and validate packaged HTML/CSS local asset references automatically.

### 13. Medium — Edge offers languages absent from its archive

Locations: `scripts/package.cjs:168`, `utils/i18n.js:24`, `utils/i18n.js:57`.

The Edge ZIP has only English, while the unchanged language picker advertises 26 languages and attempts to fetch their missing catalogs. Selections silently fall back to English.

Fix: ship supported language assets, or restrict the picker to what the package actually contains. If listing constraints require English-only `_locales`, evaluate packaging manual catalogs separately.

### 14. Medium — channel matching hides unrelated channels

Locations: `content/blocker.js:424`, `content/blocker.js:485`, `content/blocker.js:520`, `content/blocker.js:664`.

Normalized prefix matching means blocking “Science” also blocks “ScienceDaily” (reproduced). Quick Block prefers display names even when handles are available. The current channel page's identity is added to every card, including cards with their own distinct owner. Handle parsing only accepts an ASCII subset.

Fix: prefer stable channel IDs/handles; use exact display-name matching only as fallback, with fuzzy matching explicitly optional. Only use page identity when the card belongs to the page owner and lacks its own identity. Decode and handle international handles safely.

### 15. Medium — filtered-card updates miss reused DOM content

Locations: `content/blocker.js:690`, `content/blocker.js:796`, `content/blocker.js:950`.

The observer processes only added element nodes, not text changes or updated link/title attributes. Reused cards can retain old visibility, and an existing Quick Block button retains its closure over the old channel. Pending filter work also does not recheck effective activation before hiding cards, so work queued before snooze/disable can hide content afterward.

Fix: rescan affected card roots on relevant mutations, update/rebind button identity, and cancel or invalidate pending work when effective settings change. Test node reuse rather than only newly appended cards.

### 16. Medium — zero-flash blocking is not guaranteed by CSS injection alone

Locations: `content/blocker.js:911`, `styles/blocker.css:10`, `content/blocker.js:174`.

CSS arrives at `document_start`, but the relevant classes arrive after an asynchronous storage read. There is no bootstrap rule covering unresolved settings on a fresh page. JS card filtering is also delayed, and Shorts/feed logic still mutates hiding state after DOM insertion. The actual visible flash duration requires browser measurement.

Fix: design a narrowly scoped pre-initialization CSS state for core distraction surfaces, release it once settings are resolved, and retain native document-start CSS for structural blockers. Measure cold navigation, SPA navigation, and throttled startup; do not claim zero flash solely from manifest timing.

## Popup regression follow-up

The initial popup responsiveness fix capped desktop width with `100vw`. In the actual Chromium toolbar popup this prevented intrinsic sizing and reproduced a 55px-wide popup; the earlier regular-tab layout test missed it. Desktop width is now fixed at 540px, mobile screen widths remain responsive, and the inner shell fits the available host height. The browser regression test now opens the actual toolbar popup and verifies its width and footer visibility. The corrected run measured a 540px shell fitting the 510px available height, with the footer visible; all 320px English/Arabic light/dark tab checks also passed.

## Additional improvements

- **Reduce unnecessary work:** timer flushes rewrite `settings` every five seconds, causing every tab to reapply classes, scan cards multiple times, and reevaluate schedules. Separate stats events from preference changes. Full-schedule overlays replace their entire innerHTML on every evaluation, which also discards keyboard focus. Update only changed state.
- **Fix scan scheduling:** consecutive `scheduleFullFilterScan(50/300/1000)` calls all share one timeout; only the last executes (`content/blocker.js:833`). Use distinct retry handles if multiple passes are intended, or one intentional debounce.
- **Fix feed-limit CSS conflicts:** generic `nth-of-type(n+16)` rules hide item 16 even when the four-column rule intends to retain it (`styles/blocker.css:59`). Define one count consistently across CSS and JS; test 2–6 columns and filtered/Shorts cards.
- **Clarify mobile scope:** the manifest includes `m.youtube.com`, but most feed/comment/recommendation/card selectors target desktop `ytd-*` structures. Validate mobile fixtures and real devices before claiming equivalent feature coverage.
- **Improve schedule transitions:** a free-running 60-second interval can start/end schedules late, and sleep can delay it further. Reconcile on focus/visibility and use the next actual boundary. Calculate the true reopening time for overlapping or all-day schedules rather than displaying the first matching schedule's end.
- **Accessibility:** popup modals lack dialog semantics and focus trapping/restoration (`ui/popup.html:998`); the scheduled dialog declares modality but does not make the underlying page inert. Add keyboard tests, accessible names for generated schedule checkboxes, and restrained live announcements for reminders/status changes.
- **Localization:** scheduled overlay actions and “Reopens at” remain hardcoded even though `reopenText` is computed; Quick Block feedback also contains hardcoded English. All 26 catalogs parse and have every English key, but this does not validate translation quality, placeholder formatting, or actual usage.
- **Packaging cleanup:** `package-firefox.ps1` defaults to the Chrome-named `intentional-yt.zip`, risking accidental artifact replacement. The Bash output-path argument is unused. Consolidate packaging entry points and name artifacts unambiguously.
- **Declare the packaging runtime floor:** `zlib.crc32` requires Node 20.15.0 or 22.2.0+, but package engines admit earlier 20.x/22.x. Add a capability check or tighten supported versions. [Node documentation](https://nodejs.org/api/zlib.html#zlibcrc32data-value).
- **Remove dormant remote font CSS:** `styles/ui.css:1` imports Google Fonts. It is not referenced by the current manifest/popup, so this is not evidence of an active privacy leak, but it is shipped and conflicts with the local-only direction if reused.

## Useful additions after the fixes

1. An effective-state display: “Blocked by Work schedule until 17:00,” “Snoozed until 14:20,” or “Daily budget remaining: 12m.” Surface rule precedence and overlaps.
2. A local “Why was this hidden?” view showing the matched rule, with undo and an explicit channel allowlist. Apply Focus Lock policy to exceptions.
3. An optional local weekly usage summary with clear reset/deletion controls. Store daily aggregates, not browsing history or video titles.
4. A bounded “Finish this video” policy with a visible maximum extension, distinct from dismissing the entire day.
5. A privacy-safe diagnostic export containing extension/browser version and selector/error counters, excluding titles, URLs, PIN hashes, and blocklists by default.

## Validation and release plan

Completed: nine JS files compile; all 26 locale JSON files parse and contain all English keys; reproduced cross-context lost updates, disabled/snoozed limit enforcement, malformed import acceptance, strict-class overwrite, cached-strict startup failure, and channel-prefix false positives. Executed Node packaging in memory: Chrome 47 files/26 locales, Edge 22 files/1 locale, Firefox 47 files/26 locales; none included fonts.

The dual-background source manifest is not itself a defect: the declared Firefox minimum is newer than the version supporting scripts alongside service_worker. Keep the source invariant. [MDN background compatibility](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background).

No active telemetry calls were found in extension runtime code; the locale fetch uses extension URLs. The uninstall URL opens the public feedback page. This is source-review evidence, not a network-capture certification.

Recommended order: centralize storage and policy; close Focus Lock bypasses; fix scheduler/timer lifecycle; validate imports; repair packaging; then improve DOM compatibility, accessibility, localization, and diagnostics.

Before release, test packaged builds in Chrome and Firefox across two tabs, popup closure during cooldown, browser restart, midnight/sleep, overlapping/overnight schedules, snooze/master disable, SPA navigation, paused/reused players, fullscreen, Shorts, mobile layouts, malformed imports, keyboard-only operation, and non-English/RTL locales. Add focused regression tests for these state transitions and archive contents; no runtime npm dependencies are needed.
