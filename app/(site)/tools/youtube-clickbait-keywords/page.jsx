import Link from 'next/link'
import { pageMetadata, serializeJsonLd, SITE_URL } from '@/src/config/seo'
import ClickbaitKeywordsTool from '@/src/components/ClickbaitKeywordsTool'

export const metadata = pageMetadata({
  title: 'YouTube Clickbait and Ragebait Keyword Filter List (60+ Phrases)',
  description: 'Free filter list of 60+ clickbait, ragebait, and curiosity phrases. Block screaming ALL-CAPS titles and manufactured drama with zero tracking.',
  path: '/tools/youtube-clickbait-keywords',
  image: '/screenshots/og-tools-clickbait-keywords.png'
})

export default function YoutubeClickbaitKeywordsPage() {
  const toolsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'YouTube Clickbait and Ragebait Keyword Filter List',
    url: `${SITE_URL}/tools/youtube-clickbait-keywords`,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires Chrome, Edge, Brave, or Firefox',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: 'Free curated list of 60+ psychological curiosity keywords, screaming ALL-CAPS hooks, and false emergency phrases used in video titles.'
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_URL}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tools',
        item: `${SITE_URL}/tools`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Clickbait Keyword Filter',
        item: `${SITE_URL}/tools/youtube-clickbait-keywords`
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does YouTube keyword filtering work without breaking normal search?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Intentional YT performs case-insensitive substring checks against video card title elements inside your browser. If a video title contains a blacklisted phrase such as YOU WONT BELIEVE or GONE WRONG, only that individual card is hidden. Legitimate tutorials and normal videos remain visible.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does this remove clickbait thumbnails as well?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. When combined with Intentional YT neutral thumbnail mode, sensationalist custom thumbnails are replaced with clean, unedited video frame grabs taken from the exact middle of the video stream. This eliminates exaggerated facial expressions and red arrows.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I customize the keywords in this list?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can copy the raw comma-separated list into the Intentional YT popup under Keyword Filters and add, edit, or remove any terms to fit your preferences.'
        }
      }
    ]
  }

  return (
    <div className="page-container" style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px 80px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(toolsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '24px' }}>
        <ol style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          <li>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/tools" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Tools</Link>
          </li>
          <li>/</li>
          <li style={{ color: 'var(--text)' }}>Clickbait Keywords</li>
        </ol>
      </nav>

      <header style={{ marginBottom: '32px' }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '3px 10px',
            borderRadius: '6px',
            background: 'var(--bg-subtle)',
            color: '#f97316',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            marginBottom: '12px'
          }}
        >
          Curated Keyword Filter Pack
        </span>
        <h1 style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1.25, marginBottom: '14px' }}>
          YouTube Clickbait and Ragebait Keyword Filter List (60+ Phrases)
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Filter artificial urgency, shouting ALL-CAPS titles, and manufactured drama hooks. Copy plain text words, download JSON, or import directly into Intentional YT with zero tracking.
        </p>
      </header>

      {/* Interactive Tool Component */}
      <ClickbaitKeywordsTool />

      {/* Editorial Content */}
      <article style={{ marginTop: '50px', lineHeight: 1.7, color: 'var(--text)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
          The psychology of retention-engineered video titles
        </h2>
        <p>
          YouTube title algorithms reward high click-through rates. Creators test hundreds of headline variations to trigger subconscious dopamine and anxiety loops. The most common formulas rely on three psychological reflexes:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Artificial scarcity and FOMO:</strong> Phrases like &quot;Watch before it&apos;s deleted&quot; or &quot;No one is talking about this&quot; make you feel like information is about to disappear.
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Catastrophic melodrama:</strong> Words like &quot;Ruined my life&quot;, &quot;Cops called&quot;, and &quot;Worst mistake&quot; exploit our innate survival reflex to investigate potential threats.
          </li>
          <li>
            <strong>Curiosity gaps:</strong> Phrases like &quot;You won&apos;t believe&quot; or &quot;Finally revealed&quot; leave an intentional information vacuum that your brain feels compelled to close.
          </li>
        </ul>

        <h2 style={{ fontSize: '24px', fontWeight: '700', marginTop: '36px', marginBottom: '16px' }}>
          Combining title keyword filters with neutral thumbnails
        </h2>
        <p>
          Filtering keywords removes roughly 70% of low-information content. To eliminate the remaining psychological triggers, Intentional YT pairs keyword blocking with neutral mid-video thumbnails.
        </p>
        <p>
          Instead of rendering hyper-saturated custom graphics with exaggerated screaming faces, the extension replaces the thumbnail image element with a raw video frame extracted from the middle of the playback buffer. This allows you to evaluate whether a video is worth watching based on its actual visual substance rather than marketing tricks.
        </p>

        <h2 style={{ fontSize: '24px', fontWeight: '700', marginTop: '36px', marginBottom: '16px' }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
          <details
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px'
            }}
          >
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>
              Are keyword filters case sensitive?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              No. Intentional YT normalizes all title text to lowercase before evaluating keyword matches. Entering &quot;gone wrong&quot; will filter &quot;GONE WRONG&quot;, &quot;Gone Wrong&quot;, and &quot;gOnE wRoNg&quot; equally.
            </p>
          </details>

          <details
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px'
            }}
          >
            <summary style={{ fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>
              Can I choose whether to hide or dim videos matching these words?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              Yes. In the extension settings under Channel and Keyword Filters, you can toggle between hiding matched video cards entirely or dimming them with 30% opacity so you know something was filtered.
            </p>
          </details>
        </div>

        {/* Cross links */}
        <div
          style={{
            marginTop: '40px',
            padding: '24px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, marginBottom: '10px' }}>
            Related Guides and Tools
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <li style={{ marginBottom: '8px' }}>
              <Link href="/blog/replace-clickbait-youtube-thumbnails-neutral-frames" style={{ color: 'var(--accent)' }}>
                How to replace clickbait YouTube thumbnails with neutral frames automatically
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link href="/tools/youtube-drama-blocklist" style={{ color: 'var(--accent)' }}>
                YouTube Drama and Brainrot Channel Blocklist (80+ Channels)
              </Link>
            </li>
            <li>
              <Link href="/tools" style={{ color: 'var(--accent)' }}>
                Browse all 7 curated focus packs in our Tools Library
              </Link>
            </li>
          </ul>
        </div>
      </article>
    </div>
  )
}
