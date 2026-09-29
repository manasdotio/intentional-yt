import { APP_CONFIG } from '@/src/config/constants'
import { SITE_URL } from '@/src/config/seo'
import { faqItems } from '@/src/components/Faq'
import { getAllPosts } from '@/src/utils/blog'

export const dynamic = 'force-static'

// Reuse published answers and article metadata so this index stays aligned
// with the website instead of maintaining a second set of product claims.
export function GET() {
  const guides = getAllPosts().map(post =>
    `- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.description}`
  ).join('\n')
  const questions = faqItems.map(([question, answer]) =>
    `### ${question}\n\n${answer}`
  ).join('\n\n')

  return new Response(`# Intentional YT

> Intentional YT is a free, open-source browser extension for Chrome, Firefox, and Edge that hides YouTube distractions and provides daily playback limits.

Official website: ${SITE_URL}/
Current version: ${APP_CONFIG.version}
Developer: manasdotio (${APP_CONFIG.githubRepoUrl})

## Product and pricing

- [Product, interactive demo, features, and FAQ](${SITE_URL}/): Free under the MIT license, with no subscription or account required.
- [Privacy policy](${SITE_URL}/privacy): Extension settings, blocklists, and playback counters are stored locally.
- [Source code](${APP_CONFIG.githubRepoUrl}): Public implementation, license, and issue tracker.

The extension controls YouTube in a supported desktop browser. It does not control the native YouTube phone app. Focus Lock adds friction to settings changes; it does not prevent disabling or uninstalling the extension. YouTube layout changes can affect blocking rules.

## Installation

- [Chrome Web Store](${APP_CONFIG.chromeWebStoreUrl})
- [Microsoft Edge Add-ons](${APP_CONFIG.edgeAddonUrl})
- [Firefox Add-ons](${APP_CONFIG.firefoxAddonUrl})

## Guides

${guides}

## Frequently asked questions

${questions}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
