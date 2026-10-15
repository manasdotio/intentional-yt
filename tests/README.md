# Extension verification

Run dependency-free regression checks with `npm run test:extension`. The tests use Node's built-in test runner, VM contexts and compression APIs; they do not add dependencies to shipped extension scripts.

Run `npm run package` to build all three distributions. Chrome and Edge include only the service worker background declaration; Firefox includes only background scripts. The source manifest intentionally keeps both. Every archive includes local fonts and the current/historical license notices. Chrome and Firefox include all 26 languages; the Edge package includes English.

## Automated checks

The `Regression Checks` workflow runs on pull requests to `main`, pushes to `main` and manual dispatch. It uses Node 24 and `npm ci` with locked development tooling. Two jobs cover:

- Extension unit tests, all three browser packages, Mozilla linting of the Firefox ZIP and Chromium extension smoke tests. Archive tests validate browser-specific manifests, runtime files, locales and license notices.
- The production website build, seven-page SEO checks and website browser tests against a temporary local production server. Startup has a timeout, and the server log is printed when the step finishes.

Mozilla linting targets the generated Firefox ZIP, not the repository's intentionally dual-browser source manifest. Linter warnings are reported but do not fail CI; errors do. Browser checks use fixtures and do not replace live YouTube or Firefox runtime checks before release.

## Browser integration

`browser-smoke.cjs` uses Playwright as development tooling, excluded from shipped extension packages. After `npm ci`, install Chromium and run:

```sh
npm exec -- playwright install chromium
node tests/browser-smoke.cjs
node tests/performance-smoke.cjs
```

Alternatively, use an installation outside the repository by setting `IYT_PLAYWRIGHT_MODULE` to its absolute module path:

```powershell
$env:IYT_PLAYWRIGHT_MODULE = 'C:\path\to\tooling\node_modules\playwright'
node tests/browser-smoke.cjs
```

The script stages the extension in a new OS temporary directory, launches an isolated headless Chromium profile, and closes the browser on completion. It does not use a personal browser profile. YouTube URLs are served controlled fixtures through Playwright routing; no account login is required. Browser tooling and tests are excluded from release ZIPs.

The performance smoke test loads the blocker into a local fixture with mocked settings access. It checks that short feeds become idle, slow-loading cards still trigger bounded loading retries, overlapping navigation refreshes share scans, and observer modes follow settings changes. It also checks retained JavaScript heap after garbage collection across repeated 100-card replacements. These measurements isolate blocker behavior; they do not measure total browser RAM, live YouTube playback, or Firefox runtime performance.

Coverage includes actual toolbar popup auto-sizing and footer visibility, popup fonts, the MV3 background, matching desktop/mobile origins, document-start hiding, content filters and DOM reuse, schedules/snooze, media-state preservation, Focus Lock UI and persisted deadlines, keyboard-accessible Quick Block, and 320px English/Arabic light/dark popup layouts with mobile device emulation.

Shorts regressions verify that ordinary shelves remain visible, Shorts shelves/cards stay hidden, reused cards update immediately in both directions, and disabling Shorts blocking preserves page-owned display styles. Shorts visibility uses document-start CSS rather than delayed inline hiding.

For Firefox validation, extract `intentional-yt-firefox.zip` to a temporary directory and run `web-ext lint --source-dir <directory>`. Runtime checks on Firefox and live YouTube should still be performed before publishing, especially SPA navigation, fullscreen, real sleep/wake, current mobile markup and YouTube layout experiments.

## Behavioral contracts

- The Block tab shows effective blocking status and pause/resume. Search and the three common settings are directly available, without an Advanced settings or Change what's hidden gate. Each common setting has one control instead of duplicate quick/category controls; search includes those controls. Active schedules explain their override and disable conflicting common edits. Categories retain their saved expansion choices; an old collapsed wrapper preference cannot hide the controls.
- The Block tab starts directly with controls, without an active-summary card. Effective settings use subtle row highlights; paused/off states clear those highlights. Navigation consequences remain available through setting help.
- Collapsible controls are grouped into Home & browsing, Watching a video, and Navigation & appearance. Common controls remain at the top without duplication. Counts and search follow the new groups, and expanded legacy categories keep their moved controls reachable after upgrade.
- Presets apply atomically and preserve unrelated preferences. They show a brief confirmation without a change-summary card or undo snapshot. Relaxing restrictions still requires PIN/cooldown when Focus Lock is active. Legacy preset-undo snapshots and pending undo commands are retired without changing current protections.
- Fresh installations show Quick Block buttons by default, with blocking restrictions off. Saving the first-run form changes only Shorts, home recommendations, suggested videos and the daily limit; skipping does not enable restrictions. Existing full/partial settings keep their previous defaults and customizations, including an explicitly disabled Quick Block preference. Presets and explicit reset retain their existing behavior.
- Focus sessions enable the user's chosen protections and clear snooze for 25, 45 or 60 minutes, without enabling extra blocking controls. Explicit strict/full schedules and daily limits still apply. A background alarm reconciles expiry after popup closure or restart. Ending early respects Focus Lock, and a delayed end applies only to the session it targeted.
- Balanced and Video Only keep navigation, live chat, playlists, descriptions and the search header available. Zen remains an explicit stronger choice. Hiding recommendations must not hide a shared side panel containing chat or a playlist. Hiding "More from YouTube" targets product links, not the last sidebar section.
- The popup shows active schedules, session end time, paused/off state and the remaining daily budget. Status refreshes use existing storage events, plus a deadline/minute-boundary timeout only while the popup is open. Schedule end calculation checks actual boundaries rather than scanning a week minute by minute.
- Daily warnings default on when a daily limit is enabled, with an opt-out beside the limit controls. They appear during visible playback with at most five minutes left (one minute for limits of five minutes or less), without pausing playback. One local claim per day/budget prevents repeated warnings across tabs and reloads; the existing playback tick drives the check, with no new playback interval, observer, dependency or network request.
- Focus messages and watch-time explanations are localized in all catalogs. Native-speaker review remains useful for translation quality.

- Every preference/usage mutation goes through the background queue. Popup presentation preferences such as expanded sections remain independent local keys.
- The background guards all weakening actions while Focus Lock is active. It persists the exact authorized command after PIN verification and applies it once the deadline is reached, even if the popup is closed.
- Disabled or snoozed protections never enforce daily limits, reminders, schedules or visual blocking. Passive usage recording continues.
- Usage is aggregate elapsed playback across tabs, including background tabs. Buffering, seeking and detected ads are excluded. Playback speed does not multiply real watch time.
- Same start/end schedule times mean the whole selected calendar day. Overlapping full blocks report the end of their combined active period.
- Backups carry schema version 1, and legacy plain settings objects are accepted. PINs, pending actions, snooze and usage are not portable; imports cannot schedule arbitrary background actions.
- Focus Lock is an intentional-delay aid, not a security boundary against someone controlling the browser or extension installation.

Popup browser checks cover the common home-page mode, legacy settings, search, and PIN/cooldown transitions. Opening “Below the video” must not change preferences; description, channel details, and action buttons can each be hidden independently, including after reopening the popup.

Setting descriptions are available through adjacent info buttons on hover, keyboard focus, or tap. Help must not toggle a setting; Escape, a second tap, or clicking elsewhere dismisses it. Descriptions remain searchable and available to screen readers. Browser checks cover translated tooltip placement at 320px in both text directions.

Pause/resume stays in the top bar across tabs. The Block tab has no summary card; row highlights reflect effective protections and clear when paused or disabled. Schedule override explanations remain in the contextual status banner.

Filters uses compact channel and keyword cards, with explanations in info tooltips and Quick Block beside the channel list. Empty lists use a single line. Adding by button or Enter, removing entries, clearing lists, and Focus Lock behavior remain unchanged; narrow layouts use an accessible plus button to leave room for typing.

## Website preview checks

After `npm run build`, start `npm run start -- --port 3105` in another terminal, then run `node tests/site-smoke.cjs`. It uses the installed development dependency, or the external `IYT_PLAYWRIGHT_MODULE` override if set. Set `IYT_SITE_URL` to use a different local server.

Checks cover direct/repeated demo navigation, Balanced/Zen/Video Only settings, exact channel matching, title filters, off-state behavior, sample limits/warnings/reminders/reset, 320px and desktop light/dark layouts, privacy text and the legacy uninstall redirect. No real feedback is submitted. Screenshots are saved in the OS temporary directory.

Install checks emulate Chrome, Edge, Firefox, Safari, iPhone and Android user agents in Chromium. They verify consistent store destinations, mobile guidance/demo navigation, mobile menu access, no-JavaScript store choices, and 44px install targets at 320/768/1024/1440px in both themes. These checks do not replace native-browser runtime testing.
