import Link from 'next/link'
import { pageMetadata, serializeJsonLd, SITE_URL } from '@/src/config/seo'
import DramaBlocklistTool from '@/src/components/DramaBlocklistTool'

export const metadata = pageMetadata({
  title: 'YouTube Drama and Brainrot Channel Blocklist (80+ Channels)',
  description: 'Curated blocklist of 80 commentary channels, influencer feuds, reaction streamers, and content mills. Filter them in search and feeds with zero tracking.',
  path: '/tools/youtube-drama-blocklist',
  image: '/screenshots/og-tools-drama-blocklist.png'
})

export default function YoutubeDramaBlocklistPage() {
  const toolsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'YouTube Drama and Brainrot Channel Blocklist',
    url: `${SITE_URL}/tools/youtube-drama-blocklist`,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires Chrome, Edge, Brave, or Firefox',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: 'Free curated list of 80+ YouTube channels known for drama commentary, reaction clips, and low-effort retention algorithms.'
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
        name: 'Drama Channel Blocklist',
        item: `${SITE_URL}/tools/youtube-drama-blocklist`
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why does YouTube still show blocked channels in search results?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'YouTube native Don’t recommend channel button only impacts recommendations on the home feed and watch page sidebar. It does not exist in search results, trending feeds, or signed-out guest mode. A local extension like Intentional YT evaluates channel handles inside the DOM and removes matching cards before they render.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I block these YouTube channels without signing in to a Google account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Intentional YT stores your channel blocklist inside your browser local storage using the chrome.storage API. It intercepts elements locally, meaning your blocklist functions identically in incognito windows and signed-out sessions.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I add my own channels to this blocklist?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Open the Intentional YT popup from your browser toolbar, expand the Channel Filters section, and type or paste any YouTube handle starting with an @ symbol. Changes take effect on your next page interaction without reloading.'
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
          <li style={{ color: 'var(--text)' }}>Drama Blocklist</li>
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
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: '12px'
          }}
        >
          Curated Channel Filter Pack
        </span>
        <h1 style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1.25, marginBottom: '14px' }}>
          YouTube Drama and Brainrot Channel Blocklist (80+ Channels)
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          A free, community-maintained list of commentary channels, influencer feuds, reaction streamers, and retention mills. Clean your YouTube search results and home feed with plain text handles or 1-click extension import.
        </p>
      </header>

      {/* Interactive Tool Component */}
      <DramaBlocklistTool />

      {/* Editorial Content */}
      <article style={{ marginTop: '50px', lineHeight: 1.7, color: 'var(--text)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
          Why YouTube recommendation filters fail in search results
        </h2>
        <p>
          YouTube provides a native option called &quot;Don&apos;t recommend channel&quot; in the three-dot menu next to video titles. While helpful for basic recommendations, this button does not work when you search for a topic. If you type &quot;productivity&quot;, &quot;gaming&quot;, or &quot;tech review&quot;, the search engine retrieves results based on view velocity and keyword tags regardless of whether you previously hid the creator.
        </p>
        <p>
          Worse, if you browse YouTube while signed out or inside a private browser session, YouTube offers zero channel suppression features. The recommendation algorithm defaults to broad viral trends, which frequently prioritize celebrity gossip, manufactured creator conflicts, and loud reaction streams.
        </p>

        <h2 style={{ fontSize: '24px', fontWeight: '700', marginTop: '36px', marginBottom: '16px' }}>
          How local DOM matching works
        </h2>
        <p>
          Intentional YT solves this by filtering channels directly inside your browser DOM. When a page finishes loading or requests additional videos, the content script checks video author links against your locally stored blocklist.
        </p>
        <p>
          If a video author matches any handle in your list, the extension applies high-specificity styles to collapse the entire card before it catches your attention. This prevents the visual flash common in scripts that wait for delayed network responses.
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
              Can I block these YouTube channels without signing in to a Google account?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              Yes. All filtering runs locally on your computer inside chrome.storage.local. You do not need to sign in to Google, sync browsing profiles, or share personal information.
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
              Does blocking a channel slow down my computer?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              No. Intentional YT does not run heavyweight background scripts or remote API checks. Matching 80 handles in browser memory takes less than 2 milliseconds per page scan.
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
              How do I import this list into Intentional YT?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              Click the &quot;1-Click Extension Setup&quot; button above. It opens our setup decoder page with the preset pre-loaded. Click &quot;Apply to Extension&quot; and your filters will activate immediately.
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
            Related Focus Guides and Tools
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <li style={{ marginBottom: '8px' }}>
              <Link href="/blog/block-youtube-channels-from-search-results" style={{ color: 'var(--accent)' }}>
                How to block specific YouTube channels from search results
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link href="/tools/youtube-clickbait-keywords" style={{ color: 'var(--accent)' }}>
                YouTube Clickbait and Ragebait Keyword Filter List
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
