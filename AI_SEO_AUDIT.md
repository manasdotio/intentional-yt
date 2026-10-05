# Intentional YT AI search audit

Reviewed: September 29, 2026. Scope: repository content and a public-site fetch attempt. No authenticated Search Console, analytics, or cross-platform AI monitoring data was available. Citation and recommendation rates are **unmeasured**, not zero.

## Product context

Intentional YT is a desktop browser extension for people who need YouTube for learning or work and want controls over recommendations, Shorts, and playback time. The site compares it with Unhook and UnTrap. Product sources: `src/config/constants.js`, the homepage FAQ, and the published guides in `src/posts/`.

No product-marketing context file was found in `.agents` or `.claude`; the existing repository documentation and public-facing copy provide the product context.

## Findings and work completed

| Area | Evidence and result |
| --- | --- |
| Product definition and privacy | Homepage hero identifies the category and browser support; FAQ describes local storage. |
| Crawl eligibility | `app/robots.js` allows all user agents. The sitemap lists the homepage, blog, articles, and privacy page. This is source-level evidence, not proof of live crawl access or indexing. |
| Structured data | Homepage includes WebSite and SoftwareApplication data, a zero-price offer, store links, developer identity, and the configured software version. |
| Useful content structure | Published guides and FAQs cover practical setup, browser scope, and limitations; comparison content discloses developer affiliation and cites competitor sources. |
| Plain-text discovery | Added `/llms.txt`, generated at build time from configured product links, published guide metadata, and the same FAQ answers rendered on the homepage. This is an optional discovery aid, with no promised ranking or citation benefit. |
| Live access | The web fetch of `https://www.intentionalyt.me/` failed. This tool failure alone does not establish that the site is down or blocks crawlers. Check HTTP status, initial HTML, and hosting rules after deployment. |
| AI visibility | Not measured. Ordinary search results cannot establish ChatGPT, Perplexity, or Google AI Overview citation rates. |

## Query baseline to measure

Run these unchanged across the target platforms, recording date, platform/model, locale, exact response, citation URLs, brand mentions, competitor mentions, and whether the response actually recommends the extension. Repeat each prompt 3–5 times and report counts with sample size. Keep unavailable results marked unmeasured.

| Query | Relevant existing page |
| --- | --- |
| What is Intentional YT? | Homepage |
| Does Intentional YT collect my data? | Homepage FAQ |
| Does Intentional YT collect browsing data? | Privacy policy |
| YouTube distraction blocker for studying | Homepage and guides |
| Hide YouTube Shorts without blocking normal videos | Shorts and recommendations guide |
| Remove YouTube recommendations but keep subscriptions | Homepage FAQ and Shorts guide |
| Set a daily YouTube watch time limit on desktop | Daily time-limit guide |
| YouTube extension that counts active playback time | Daily time-limit guide |
| Intentional YT vs Unhook vs UnTrap | Comparison guide |
| Private Unhook alternative | Comparison guide |
| Can a YouTube focus extension prevent uninstalling? | Focus Lock explanation and FAQ |
| Does Intentional YT work in the YouTube mobile app? | Homepage FAQ |

## Next priorities

1. After deployment, verify the homepage, robots.txt, sitemap.xml, and llms.txt return their intended content without authentication or a bot challenge. Check important pages with Search Console URL Inspection.
2. Collect the query baseline above before attributing any visibility improvement to a change. Track citations and recommendations separately.
3. Expand guides only where real support questions reveal missing information. Keep screenshots, settings names, limitations, and release details accurate. Do not invent performance benchmarks, testimonials, or expert quotes.
4. Keep official store listings and the website consistent. Seek independent coverage through useful demonstrations and honest community participation; no fabricated reviews or mass promotion.

## Corrections to the supplied skill guidance

Google says no special AI files or schema are required for AI Overviews or AI Mode. Googlebot controls access for Google Search; Google-Extended is a separate control for some other Google systems. Do not change training preferences based on a claim that allowing every training bot is necessary for search citations. Source: [Google Search Central: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features).

The skill's percentage improvements, platform citation shares, and model-specific format claims were not independently established in this audit and are not used as forecasts. The optional llms.txt index does not replace the website, sitemap, or ordinary crawl/indexing work.
