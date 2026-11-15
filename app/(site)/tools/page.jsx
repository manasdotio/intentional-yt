import { pageMetadata, serializeJsonLd, SITE_URL } from '@/src/config/seo'
import ToolsLibrary from '@/src/components/ToolsLibrary'

export const metadata = pageMetadata({
  title: 'Free YouTube Channel Blocklists, Keyword Filters & Tools',
  description: 'Free 1-click YouTube blocklists for drama channels, clickbait keywords, and study-only allowlists. Import directly into Intentional YT with zero tracking.',
  path: '/tools'
})

export default function ToolsPage() {
  const toolsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'YouTube Focus & Clutter Toolkit',
    url: `${SITE_URL}/tools`,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires Chrome, Edge, Brave, or Firefox',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: 'Free curated YouTube blocklists, custom preset builder, screen-time audit calculator, and clickbait headline sanitizer.'
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Curated YouTube Blocklists and Preset Packs',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Brainrot & Drama Channel Purge (75+ Channels)',
        url: `${SITE_URL}/tools`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Clickbait & Ragebait Keyword Filter (60+ Keywords)',
        url: `${SITE_URL}/tools`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Computer Science & Engineering Allowlist (45+ Channels)',
        url: `${SITE_URL}/tools`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'STEM & University Academic Allowlist (45+ Channels)',
        url: `${SITE_URL}/tools`
      },
      {
        '@type': 'ListItem',
        position: 5,
        name: 'Calm Kids & Safe Viewing Shield (35+ Channels & 25+ Keywords)',
        url: `${SITE_URL}/tools`
      },
      {
        '@type': 'ListItem',
        position: 6,
        name: 'Cable News & Political Ragebait Shield (30+ Channels)',
        url: `${SITE_URL}/tools`
      },
      {
        '@type': 'ListItem',
        position: 7,
        name: 'Newspaper Mode (15-Video Cap)',
        url: `${SITE_URL}/tools`
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I block YouTube channels from search results without signing in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Intentional YT executes blocklist matching locally inside your desktop browser via chrome.storage.local. It filters matching video cards across search results, recommendation grids, and sidebars even when you browse in guest or incognito mode.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I import a curated blocklist pack into Intentional YT?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Click Copy Setup Code on any curated pack in the Tools library. Open the Intentional YT extension popup in your browser toolbar, navigate to Options > Import, and paste your code. The rules and channel filters apply immediately.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the difference between a channel blocklist and an allowlist?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A blocklist hides specifically named channels while letting you browse everything else. An allowlist (whitelist) flips this model: it blocks or dims all general algorithmic recommendations by default and approves only a small handful of channels you trust, which is ideal for studying.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are these blocklists and tools completely private?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Intentional YT is built with zero telemetry and zero external network calls. All presets, blocklists, and watch budgets stay strictly inside your local browser.'
        }
      }
    ]
  }

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Free Tools', item: `${SITE_URL}/tools` }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([toolsSchema, itemListSchema, faqSchema, breadcrumbsSchema]) }}
      />
      <ToolsLibrary />
    </>
  )
}
