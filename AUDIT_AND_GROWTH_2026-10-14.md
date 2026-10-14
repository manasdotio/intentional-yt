# Intentional YT: 20 fixes and growth priorities

Updated: October 14, 2026 | Branch: `fix/high-impact-audit`

**Remaining work comes first, ordered from very high to low impact. Completed work is below.** Related implementation details are grouped into 20 tracked items rather than counted as separate fixes. IDs stay with each item when it moves to done.

**Status: 10 remaining, 9 completed locally, 1 dropped by request.** Checked means implemented and verified on this branch, not published. Impact is an assessment, not a measured growth result.

## Remaining: very high impact

- [ ] **#4 - Complete the release workflow.** Validate and attach Chrome, Firefox and Edge archives. The current GitHub workflow attaches only Chrome.
- [ ] **#5 - Help new users finish installation.** Make existing popup onboarding easy to find. Explain pinning/opening the extension and reloading existing YouTube tabs. Do not repeat welcome steps after updates.

## Remaining: high impact

- [ ] **#6 - Explain the starting settings.** Say what Balanced hides, including protections not shown in the welcome form. Make "Save & start watching" lead clearly to YouTube.
- [ ] **#12 - Make store information consistent.** Verify Firefox/Edge versions, screenshots and license metadata in the dashboards. Update published descriptions and assets to match the product. Cached Firefox data showed 2.3.0 and "All Rights Reserved"; confirm current details first.
- [ ] **#15 - Test a clearer headline.** Focus on students and tutorial learners. Suggested headline: "Watch the tutorial. Skip the rabbit hole." Explain hiding distractions and setting a daily playback budget. Measure understanding before treating this as an improvement.
- [ ] **#16 - Show the result before the settings.** Make a 20 to 30 second real demonstration: hide distractions, set a daily budget, then show the warning and limit behavior. Local promo assets were refreshed, but this outcome-focused demonstration remains to do.

## Remaining: medium impact

- [ ] **#11 - Confirm feedback delivery.** The Google Forms submission cannot verify acceptance. Use a confirmed submission flow before claiming a response was received. Lost feedback has not been demonstrated. The legacy automatic-send page has already been retired.
- [ ] **#17 - Improve the comparison article.** Compare verified tasks, browser support and relevant prices. Replace repeated "check their listing" wording with useful, sourced comparisons.
- [ ] **#19 - Measure acquisition and retention.** Use store dashboards, Search Console and consenting tester feedback. Keep extension telemetry at zero. Private conversion and retention data was unavailable during the audit.

## Remaining: low impact until the above is ready

- [ ] **#18 - Publish useful guides and test outreach.** Cover study schedules, keeping subscriptions while hiding recommendations, daily playback limits and fixing over-blocking. Use original screenshots and store links. Share only where promotion is allowed and disclose that you built it.

## Completed locally

- [x] **#7 - Fix install buttons and their UI. (High)** Navbar, hero and final section share browser-aware controls for Chrome, Firefox and Edge. Phones get a demo and desktop setup guidance; unsupported browsers get a store chooser. All three stores remain available, including without JavaScript. Store links have 44px tap targets and layouts work from 320px to desktop in both themes. Production build, SEO and browser checks pass; changes are not published.

- [x] **#3 - Automate regression checks. (Very high)** The workflow now runs extension unit tests, browser packaging, Firefox ZIP linting, Chromium extension tests, the production website build, SEO and site browser tests. Development tools are version-pinned in the lockfile and excluded from extension packages. Local checks pass; the GitHub-hosted Ubuntu run still needs confirmation after pushing.

- [x] **#1 - Stop hiding normal video shelves. (Very high)** Hide Shorts now requires Shorts-specific content. Invalid individual-card CSS selectors were also repaired.
- [x] **#2 - Restore reused video cards. (Very high)** Cards changed from Shorts to normal videos no longer stay hidden. Browser regressions cover shelves, cards, badges, reuse both ways, disabling blocking and preserving page-owned styles.
- [x] **#8 - Implement an honest, working simulator. (High)** Starts in Balanced with limits/reminders off. Supported presets, exact channel matching, filters, playback, warnings, limits, reminders and reset work on fictional samples. Removed fake streaks, time-saved totals and shortcuts. Direct, repeated and cross-page demo links work.
- [x] **#9 - Explain watch-time counting briefly. (High)** Updated all 26 language catalogs: playback adds across tabs, including background tabs; simultaneous videos count separately, even with protections off or snoozed; totals reset at midnight.
- [x] **#10 - Clarify privacy. (High)** The website and [privacy document](PRIVACY.md) explain local extension data, website requests, voluntary Google Forms feedback and deletion. The old uninstall URL now redirects to the explicit-send form.
- [x] **#13 - Remove overpromises. (High)** Local website, popup, documentation and prepared store copy describe supported layouts and actual behavior. Promotional screenshots, artwork, asset ZIP and videos were refreshed. Public store updates remain under #12.
- [x] **#14 - Switch to source-available licensing. (High)** The [license](LICENSE) allows inspection and private use/modification; redistribution, sale and competing derivatives of newly covered material require permission. This is not open source. Earlier MIT permissions and third-party rights remain intact, with the [historical notice](licenses/MIT-legacy.txt) preserved. Package metadata and archives include the notices.

Related implementation files: [blocking logic](content/blocker.js), [blocking styles](styles/blocker.css), [browser tests](tests/browser-smoke.cjs), [unit tests](tests/extension.test.cjs).

## Dropped by request

- **#20 - Promote zero-flash blocking.** Removed this marketing pitch. The underlying CSS blocking remains; no new feature or promotional work is planned for it.

## Before publishing

- [ ] Confirm the new regression workflow passes on GitHub after pushing.
- [ ] Review dependency advisories found during this batch: npm audit reports 7 affected packages (3 high, 4 moderate), including existing Next.js, sharp and blog-parser dependencies. These were not upgraded as part of the CI change.

- [ ] Review the custom license wording before release; it has not had professional legal review.
- [ ] Manually check current live YouTube in Chrome and Firefox.
- [ ] Verify store versions, screenshots and license metadata in the dashboards. The cached Firefox listing showed 2.3.0 and "All Rights Reserved"; confirm current details first.
- [ ] Choose the release version and synchronize it across the manifest, package, website constants, popup and documentation. Local version is still 2.4.1.
- [ ] Publish the website changes and browser packages, and update public store descriptions, screenshots and license metadata.

**Nothing in this checklist means the changes are committed, merged or published.**

## Verified locally

- [x] All 38 extension unit tests passed.
- [x] Full Chromium extension smoke suite passed, including Shorts regressions.
- [x] Popup checks passed at 320px in English and Arabic, in both themes.
- [x] Production website build passed.
- [x] SEO checks passed for seven indexable pages.
- [x] [Site browser checks](tests/site-smoke.cjs) passed: simulator controls, filtering, limits, reminders, reset, demo navigation, privacy and the legacy uninstall redirect.
- [x] Site layouts checked at 320px and 1440px in light and dark themes.
- [x] Chrome, Edge and Firefox packaging passed, including license notices.
- [x] Git whitespace checks passed.
- [x] Packaged Firefox add-on lint passed with zero errors, notices or warnings.
- [x] Regression workflow YAML parses; local build, SEO and both browser suites passed with the pinned tooling.
- [x] Clean locked dependency installation passed in an isolated temporary directory. The running development server was left in place.

Extension browser tests use controlled YouTube fixtures. They do not establish compatibility with every live layout or Firefox runtime. No Google Forms feedback was submitted during testing. Conversion, retention and production performance improvements have not been measured.

## Simple 30-day plan

| When | Action | What to learn |
| --- | --- | --- |
| Week 1 | Finish installation and release work. Watch five new users install and configure the extension. | Where do people get stuck? |
| Week 2 | Test the headline and real demo with about ten tutorial learners. | Do they understand the value? |
| Week 3 | Publish one useful guide. Share where promotion is allowed, or with small educational creators. Disclose that you built it. | Which channel brings interested users? |
| Week 4 | Follow up with testers after a week. Review support and uninstall reasons. Repeat the most useful experiment. | Who keeps using it, and why? |

Working target, not a forecast: **20 relevant people who install, find a useful setup and choose to keep using it.** Learn from them before spending on ads or adding more features.

## Market context from the original audit

The [Chrome listing](https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg) showed 36 users and two ratings on October 14, 2026. This is a historical snapshot, not a growth trend. [Unhook](https://chromewebstore.google.com/detail/unhook-remove-youtube-rec/khncfooichmfjbepaaaebmommgaepoid) has substantial existing adoption, and [UnTrap](https://untrap.app/) advertises time controls. Focus on a clear use case and reliable behavior; avoid unsupported claims of uniqueness.
