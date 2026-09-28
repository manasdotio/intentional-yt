# Intentional YT SEO audit — September 28, 2026

The main verified technical issue was conflicting canonical signals: production redirects `https://intentionalyt.me/` to `https://www.intentionalyt.me/` with HTTP 308, but the served canonical tag, sitemap entries, and robots sitemap reference used the non-www domain. The repository now uses the production www host for those signals.

This audit identifies and fixes observable problems; it does not establish a single cause of low rankings or guarantee rankings. Search Console, Google-selected canonicals, search performance, backlink data, and field Core Web Vitals were not available. Changes are local and require deployment.

## Findings and fixes

| Priority | Finding and evidence | Resolution |
| --- | --- | --- |
| High | Production redirects to www but declares non-www canonicals. Live response headers, homepage head, robots.txt, and sitemap.xml confirmed the mismatch. | Aligned metadata base, page canonicals, social URLs, schema IDs, sitemap, and robots with `https://www.intentionalyt.me`. Kept the existing production redirect direction. |
| Medium | Homepage output repeated the brand: `YouTube Distraction Blocker & Daily Limit — Intentional YT — Intentional YT`. | Pass the unbranded page title to the layout template. Verified the final HTML contains one brand suffix. |
| Medium | The site only had one article, primarily a competitor comparison, with little practical setup coverage. | Added two distinct guides based on actual extension UI controls: Shorts/recommendation hiding and daily playback limits. Linked every article directly from the homepage and blog index; added contextual links between guides. No search-volume claim is made. |
| Medium | Competitor content contained unsupported performance allegations and incorrect claims that UnTrap lacked time controls and filtering. | Replaced claims with a dated, attributed comparison using official sources and disclosed the author's affiliation. Removed unmeasured flicker timings, unsupported privacy implications, and invented feature limitations. |
| Medium | Most FAQ answers were conditionally mounted only after clicking. Separately maintained FAQ schema did not have matching initial-page answers. | Used native details/summary with every answer in server-rendered HTML. Removed the duplicated FAQ schema. FAQs now work without JavaScript; no FAQ rich-result promise is made. |
| Medium | Blog index inherited homepage Twitter content; overriding Open Graph objects on some pages lost social images. | Added a shared page metadata helper with page-specific title, description, URL, image, and Twitter tags. Social tags improve previews; they are not claimed as a direct ranking factor. |
| Medium | Sitemap dates changed on every build for unchanged pages. | Omitted unknown modification dates. Article frontmatter now supports an explicit editorial `modified` date used in sitemap, visible article metadata, Open Graph, and BlogPosting schema. |
| Medium | Two article screenshots were 867,985 and 988,686 bytes, with no intrinsic dimensions. | Added WebP versions of 67,806 and 80,988 bytes, about 92% smaller combined. Reserved their 1280 × 800 dimensions and kept lazy loading. Original PNG assets remain available. |
| Low | robots.txt blocked `/uninstall`, preventing compliant crawlers from reading its noindex directive. | Allowed crawling, preserved noindex, and kept the page out of the sitemap. This fixes exclusion semantics; it is not a homepage ranking blocker. |
| Low | The footer advertised `/intentional-yt.zip`, but no ZIP is shipped in the site's public assets. | Removed that broken local download link and retained the official stores and GitHub Release Packages link. A live ZIP check was inconclusive because of network errors. |
| Low | Article breadcrumbs had no structured data, and image dimensions in article social metadata were assumed to be identical. | Added BreadcrumbList alongside BlogPosting, semantic breadcrumb navigation, and safe JSON-LD serialization. Removed inaccurate assumed social-image dimensions. |
| Low | Software schema listed browsers as operating systems and hardcoded the version separately. | Used desktop operating systems, a browser requirement, and the existing version constant. No fabricated reviews or aggregate ratings were added. |

## What already worked

- Next.js prerendered the main content. This was not an empty JavaScript-only landing page.
- The production www homepage returned HTTP 200; HTTPS and the permanent apex redirect were present.
- The homepage allowed indexing, had an H1, and contained meaningful product copy.
- Public favicon, manifest, and referenced article image assets existed.
- The design already used shared light/dark tokens and hid horizontal page overflow.
- The extension remains native, dependency-free, and local-only. Extension behavior and version were not changed.

## Search intent and page ownership

| Page | Intent covered |
| --- | --- |
| `/` | YouTube distraction blocker; free open-source browser extension |
| `/blog/hide-youtube-shorts-and-recommendations` | How to hide Shorts and remove recommendations on desktop while retaining search/subscriptions |
| `/blog/set-youtube-daily-time-limit` | How to configure a daily playback budget and understand its limits |
| `/blog/intentional-yt-vs-unhook-vs-untrap` | Evaluate alternatives and compare documented capabilities |
| `/blog` | Discover guides and comparisons |
| `/privacy` | Understand storage and privacy |

These are editorial intent assignments based on the actual product, not measured keyword demand. Avoid creating many near-identical browser or keyword pages. Further content should answer distinct questions with verified steps and useful examples.

### Keyword refinements

Relevant phrases now appear naturally in the visible feature headings, guide headings, descriptions, and homepage introduction:

| Page | Primary and supporting phrases |
| --- | --- |
| Homepage | YouTube distraction blocker; distraction-free YouTube; hide YouTube recommendations; YouTube Shorts blocker; daily YouTube time limits |
| Shorts guide | How to hide YouTube Shorts; remove YouTube recommendations; Shorts blocker for Chrome, Firefox, or Edge |
| Time-limit guide | YouTube time limit extension; set a daily YouTube time limit; daily watch budget |
| Comparison | Unhook alternative; UnTrap alternative; open-source YouTube extension |

These terms describe supported features and relevant user tasks, not verified high-volume or low-competition keywords. Existing page URLs are preserved. No keyword-density target or hidden keyword block was added. Google does not use the meta keywords tag for indexing or ranking; visible, useful content is the focus. See [Google's supported meta tags documentation](https://developers.google.com/search/docs/crawling-indexing/special-tags) and [title guidance](https://developers.google.com/search/docs/appearance/title-link).

## Validation completed

- `npm run build`: passed; six indexable pages prerendered, plus uninstall, error, and metadata routes. The sandbox initially blocked worker creation; the authorized build outside it succeeded.
- `npm run audit:seo`: passed. The new dependency-free script checks generated HTML for unique titles/descriptions, one H1, self-canonicals on the www host, social metadata, parseable JSON-LD, local links, and image files. It checks sitemap/robots consistency and uninstall noindex as well.
- Chromium: 48 page/viewport/theme combinations passed across all six indexable pages at 320, 375, 768, and 1440 pixels in light and dark mode. No horizontal page overflow or uncaught JavaScript errors. Visually reviewed the 320px homepage screenshot.
- With JavaScript disabled: all seven FAQs were present and a closed FAQ could be expanded.
- Missing article and missing top-level route: actual HTTP 404 responses. Local sitemap and robots routes returned HTTP 200.
- `git diff --check`: passed.

The temporary Playwright runner/browser were installed outside the project's dependencies. Local screenshots and browser results are in ignored `.system_generated/`. Structured-data checks cover syntax and emitted content, not Google's rich-result eligibility. No Lighthouse score or field performance improvement is asserted.

Run `npm run build` followed by `npm run audit:seo` after future metadata or content changes. Next serves the routes in `app/`; root `robots.txt` and `sitemap.xml` are legacy copies synchronized in this change, not the production route implementation. Legacy Vite metadata was also aligned with www, but the Next build is the supported path checked here.

## After deployment

1. Verify the public homepage, three article URLs, robots.txt, and sitemap.xml reflect this build. The www URLs should serve HTTP 200, the non-www domain should redirect to www, and missing pages should return 404.
2. In the site's Google Search Console property, submit `https://www.intentionalyt.me/sitemap.xml`. Use URL Inspection for the homepage and articles; compare the user-declared and Google-selected canonical and request indexing where appropriate.
3. Review Page Indexing, Manual Actions, and Security Issues. Investigate reported exclusions individually rather than inferring that a lack of search results means a penalty.
4. Record a baseline of impressions, clicks, CTR, queries, and indexed pages. Compare equivalent periods after recrawling; do not infer success from a single search or promise a fixed ranking timeline.
5. Check mobile PageSpeed Insights and Search Console Core Web Vitals after deployment. The page still loads Google Fonts from external stylesheets; assess actual render delay before changing typography or font delivery. No field LCP, INP, or CLS data was available here.
6. Review referring links and official store website links. Relevant editorial mentions and useful documentation may improve discovery; this audit did not measure authority or acquire links.

## Sources

- [Google: canonical URLs and consistent signals](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: allow crawling for noindex to be read](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: sitemap dates and submission](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Unhook official site](https://unhook.app/) and [UnTrap official site](https://untrap.app/), checked September 28, 2026
- Local extension controls in `ui/popup.html`, settings in `utils/storage.js`, and playback-limit behavior in `content/timerToast.js`

Live fetches were intermittently unreliable. Successful response headers and metadata establish the domain mismatch; timeouts were not interpreted as production downtime. Public search returned no results for the domain in this session, which is not conclusive evidence about Google's index.
