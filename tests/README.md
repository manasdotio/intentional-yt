# Extension verification

Run dependency-free regression checks with `npm run test:extension`. The tests use Node's built-in test runner, VM contexts and compression APIs; they do not add dependencies to shipped extension scripts.

Run `npm run package` to build all three distributions. Chrome and Edge include only the service worker background declaration; Firefox includes only background scripts. The source manifest intentionally keeps both. Every archive includes the local fonts and all 26 languages.

## Optional browser integration

`browser-smoke.cjs` uses Playwright as external development tooling. Install Playwright and its Chromium browser in a tooling directory outside the extension, then set `IYT_PLAYWRIGHT_MODULE` to the absolute path of that installation's `node_modules/playwright`. Run:

```powershell
$env:IYT_PLAYWRIGHT_MODULE = 'C:\path\to\tooling\node_modules\playwright'
node tests/browser-smoke.cjs
```

The script stages the extension in a new OS temporary directory, launches an isolated headless Chromium profile, and closes the browser on completion. It does not use a personal browser profile. YouTube URLs are served controlled fixtures through Playwright routing; no account login is required. Browser tooling and tests are excluded from release ZIPs.

Coverage includes actual toolbar popup auto-sizing and footer visibility, popup fonts, the MV3 background, matching desktop/mobile origins, document-start hiding, content filters and DOM reuse, schedules/snooze, media-state preservation, Focus Lock UI and persisted deadlines, keyboard-accessible Quick Block, and 320px English/Arabic light/dark popup layouts with mobile device emulation.

For Firefox validation, extract `intentional-yt-firefox.zip` to a temporary directory and run `web-ext lint --source-dir <directory>`. Runtime checks on Firefox and live YouTube should still be performed before publishing, especially SPA navigation, fullscreen, real sleep/wake, current mobile markup and YouTube layout experiments.

## Behavioral contracts

- Focus sessions enable protections, clear snooze and apply Strict Focus for 25, 45 or 60 minutes. They preserve saved blocking preferences and do not override full schedules or daily limits. A background alarm reconciles expiry after popup closure or restart. Ending early respects Focus Lock, and a delayed end applies only to the session it targeted.
- The popup shows active schedules, session end time, paused/off state and the remaining daily budget. Status refreshes use existing storage events, plus a deadline/minute-boundary timeout only while the popup is open. Schedule end calculation checks actual boundaries rather than scanning a week minute by minute.
- Daily warnings default on when a daily limit is enabled, with an opt-out beside the limit controls. They appear during visible playback with at most five minutes left (one minute for limits of five minutes or less), without pausing playback. One local claim per day/budget prevents repeated warnings across tabs and reloads; the existing playback tick drives the check, with no new playback interval, observer, dependency or network request.
- New feature messages currently use English in all catalogs; the existing language selection, placeholders and RTL layout remain supported. Translation review is still needed for these new messages.

- Every preference/usage mutation goes through the background queue. Popup presentation preferences such as expanded sections remain independent local keys.
- The background guards all weakening actions while Focus Lock is active. It persists the exact authorized command after PIN verification and applies it once the deadline is reached, even if the popup is closed.
- Disabled or snoozed protections never enforce daily limits, reminders, schedules or visual blocking. Passive usage recording continues.
- Usage is aggregate elapsed playback across tabs, including background tabs. Buffering, seeking and detected ads are excluded. Playback speed does not multiply real watch time.
- Same start/end schedule times mean the whole selected calendar day. Overlapping full blocks report the end of their combined active period.
- Backups carry schema version 1, and legacy plain settings objects are accepted. PINs, pending actions, snooze and usage are not portable; imports cannot schedule arbitrary background actions.
- Focus Lock is an intentional-delay aid, not a security boundary against someone controlling the browser or extension installation.
