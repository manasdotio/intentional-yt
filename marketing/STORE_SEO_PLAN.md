# Store listing optimization for Intentional YT

Prepared September 29, 2026. Status: local copy and metadata prepared; no store dashboard changes submitted.

## Recommended listing fields

Keep the existing repository title: **Intentional YT - YouTube Distraction Blocker & Daily Time Limit**. It already communicates the category and a useful feature. Keep Intentional YT as the stable brand across the website, repository, and stores.

Use this English summary (123 characters):

> Hide YouTube Shorts and recommendations, set daily watch time limits, and block distracting channels. Free and open source.

The summary is updated in `_locales/en/messages.json`, which supplies the manifest description. The full description is ready to paste from `marketing/store-listing-description.txt`. It describes repository version 2.3.0; confirm each store's available release supports those features before publishing its listing.

| Dashboard field | Recommended value |
| --- | --- |
| Homepage | https://www.intentionalyt.me/ |
| Support | https://github.com/manasdotio/intentional-yt/issues |
| Privacy policy | https://www.intentionalyt.me/privacy |
| Official website | Verify ownership of intentionalyt.me and select the verified website where available. |
| Firefox license | MIT, matching the repository LICENSE. |
| Category | The current store category most closely describing focus or digital well-being; check the dashboard choices rather than selecting an unrelated category for traffic. |

Chrome takes the name and summary from the uploaded extension's manifest/localized metadata; the long description, screenshots, and related links are dashboard fields. Deliver the summary in the next packaged release with the project's normal synchronized version bump. No version increment or release archive was created for this copy change. [Chrome listing setup](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).

## What the audit established

- The live Firefox listing had a different title and displayed All Rights Reserved despite this repository's MIT license. Its description included unsupported comparisons about competitors and an absolute promise about filtered content. The proposed description removes those claims and states browser scope and Focus Lock limits. [Firefox listing](https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/).
- Direct Chrome and Edge listing fetches failed through the research tool. This does not establish an indexing problem. A dated third-party Chrome snapshot was found, but was not used to establish the current Chrome version, user count, or ranking.
- The existing English summary describes broad controls; the revised summary names Shorts, recommendations, and daily watch limits directly. These are product-relevant query hypotheses, not measured search-volume findings.

## Keyword and intent coverage

Use these concepts naturally in the relevant fields; this table is a research plan, not text to paste as a keyword block.

| Search intent | Where the prepared copy answers it |
| --- | --- |
| YouTube distraction blocker | Title and opening paragraph |
| Hide or block YouTube Shorts | Summary and first feature |
| Remove YouTube recommendations | Summary and feature list |
| YouTube daily watch time limit | Title, summary, time controls |
| Keep subscriptions without recommendations | Feature list and FAQ |
| Block YouTube channels or title keywords | Filtering section |
| Free open-source YouTube extension | Opening, summary, license explanation |
| Scheduled YouTube blocking | Time controls |

Keep competitor comparisons on the sourced website comparison page. Avoid competitor names in the title or summary. Google's guidance favors an accurate, concise overview and relevant features, and prohibits repetitive keyword spam. [Chrome listing guidance](https://developer.chrome.com/docs/webstore/best-listing).

## Screenshot brief

Use current extension captures and short benefit captions. Review existing images before reusing them; their filenames alone do not establish that the UI is current. Suggested order:

1. Clean homepage: "Hide recommendations. Keep search."
2. Watch page: "Watch your video without the suggested-video sidebar."
3. Shorts controls: "Hide Shorts and keep ordinary videos."
4. Daily limit: "Choose your daily watch budget."
5. Channel and keyword filters: "Filter the topics you want to avoid."

For Chrome, prepare up to five 1280 × 800 screenshots and a 440 × 280 promotional tile. Keep text readable at small sizes and show the actual product. The existing 1400 × 560 marquee can be reviewed for consistency. Images still require visual review; no new artwork was generated in this task. [Chrome graphic guidance](https://developer.chrome.com/docs/webstore/best-listing).

## AI discovery and wider search

The store controls its page HTML, structured data, and crawler policy. Put clear product facts into the fields you can edit: name, summary, description, developer identity, and official links. Keep the same facts on GitHub and the website, with links to the correct store IDs.

The website already provides guides, a sourced comparison, and an optional llms.txt index. Those do not modify the store page or guarantee that an AI assistant will recommend the product. Earn independent coverage by sharing useful demos and answering relevant questions with affiliation disclosed. Ask actual users for honest feedback without requesting a particular rating or offering incentives.

Google identifies listing relevance, popularity, ratings, and user experience as store discovery factors. Improving onboarding, fixing broken selectors, and resolving support issues belong alongside copy improvements. [Chrome ranking explanation](https://support.google.com/chrome_webstore/answer/12225786?hl=en).

## Publishing and measurement

1. Record the current listing text, release version, date, and available dashboard acquisition metrics before editing.
2. Paste the detailed description and correct website/support/privacy fields into the existing Chrome listing. Submit the new summary with the next release. Check the dashboard's review requirements before publishing.
3. Apply the consistent description and branding to Edge and Firefox after checking feature parity. Correct Firefox's license field. Review translations against the English meaning before updating localized listings.
4. Publish current screenshots after visual review. Keep a dated record of the changes.
5. Compare the next 28 days with the preceding 28 days, using whatever impressions, listing visits, installs, and retention data the dashboard actually exposes. Annotate releases and other promotions; a before/after comparison does not prove causation.
6. For wider search, sample "YouTube distraction blocker", "hide YouTube Shorts extension", "YouTube daily time limit extension", and "Intentional YT" weekly. Record engine, date, locale, result URL, and position. Store search, web search, AI citations, and AI recommendations are separate measurements.
7. Repeat the same queries 3–5 times per AI platform and record cited URLs and recommendation counts with sample sizes. The existing `AI_SEO_AUDIT.md` has a broader query set. No current AI citation baseline or rank improvement was established here.

No live dashboard session was available for this task. Publishing remains a dashboard action; editing these repository files does not update the public listings.
