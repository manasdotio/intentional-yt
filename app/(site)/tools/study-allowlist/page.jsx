import Link from 'next/link'
import { pageMetadata, serializeJsonLd, SITE_URL } from '@/src/config/seo'
import StudyAllowlistTool from '@/src/components/StudyAllowlistTool'

export const metadata = pageMetadata({
  title: 'Study-Only YouTube Allowlist (90+ CS, STEM and University Channels)',
  description: 'Turn YouTube into a distraction-free library. Allowlist 90+ accredited university, programming, and mathematics channels while hiding everything else.',
  path: '/tools/study-allowlist',
  image: '/screenshots/og-tools-study-allowlist.png'
})

export default function StudyAllowlistPage() {
  const toolsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Study-Only YouTube Channel Allowlist',
    url: `${SITE_URL}/tools/study-allowlist`,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires Chrome, Edge, Brave, or Firefox',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: 'Free curated allowlist of 90+ verified educational creators covering computer science, mathematics, engineering, and university lectures.'
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
        name: 'Study Allowlist',
        item: `${SITE_URL}/tools/study-allowlist`
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What happens when I enable Allowlist Mode in Intentional YT?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Allowlist mode reverses normal blocking rules. Instead of hiding specific creators, the extension checks every video card against your approved list. Videos from non-approved channels are either dimmed with 30% opacity or removed entirely, leaving only verified educational content visible.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I still search for documentation and university lectures?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Searching YouTube works normally, but search results are filtered so that only videos produced by channels in your allowlist appear on screen. Unrelated viral recommendations and clickbait are removed.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I add my university or school channel to this allowlist?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Open the extension popup, switch the Filter Mode to Allowlist, and add your department or professor YouTube handle to the text box. It will remain accessible alongside our curated channels.'
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
          <li style={{ color: 'var(--text)' }}>Study Allowlist</li>
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
            color: '#3b82f6',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            marginBottom: '12px'
          }}
        >
          Study and Research Allowlist
        </span>
        <h1 style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1.25, marginBottom: '14px' }}>
          Study-Only YouTube Allowlist (90+ CS, STEM and University Channels)
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Turn YouTube into an academic reference library. Allowlist 90+ verified computer science, mathematics, and university lecture channels while dimming or hiding all algorithmic distractions.
        </p>
      </header>

      {/* Interactive Tool Component */}
      <StudyAllowlistTool />

      {/* Editorial Content */}
      <article style={{ marginTop: '50px', lineHeight: 1.7, color: 'var(--text)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
          Why allowlists work better than blocklists for deep study
        </h2>
        <p>
          Standard website blockers rely on blocklists: you identify 10 or 20 distracting channels and hide them. But YouTube adds tens of thousands of new creators every single week. When you need to study linear algebra or debug a memory leak, a blocklist leaves the door open to an infinite stream of novelty.
        </p>
        <p>
          An allowlist flips the equation. Instead of deciding what to ban, you declare the small set of educational creators you actually need. Every other channel on YouTube is automatically filtered out. Your home feed becomes a calm bulletin board of academic lectures and technical tutorials.
        </p>

        <h2 style={{ fontSize: '24px', fontWeight: '700', marginTop: '36px', marginBottom: '16px' }}>
          Configuring Dim versus Hide mode
        </h2>
        <p>
          Intentional YT offers two options for non-approved channels in Allowlist Mode:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Dim Mode (Recommended for research):</strong> Reduces non-approved videos to 30% opacity. The titles and thumbnails become visual background noise, but you can still click them if a specific niche tutorial is truly necessary for your work.
          </li>
          <li>
            <strong>Hide Mode (Strict focus):</strong> Completely collapses non-approved video cards from the DOM. If a channel is not in your allowlist, it ceases to exist in your browser viewport.
          </li>
        </ul>

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
              Can I lock this study preset during exam week?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              Yes. You can activate Focus Lock with a 4-digit numeric PIN and a cooldown timer. If you feel an impulse to disable your allowlist, the extension enforces a waiting period of up to 60 minutes before changes are permitted.
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
              Will this prevent me from watching course playlists?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              No. Educational video links and official university playlists (such as MIT OpenCourseWare or Harvard CS50) play with full resolution and speed controls.
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
            Related Study Guides and Tools
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <li style={{ marginBottom: '8px' }}>
              <Link href="/blog/whitelist-youtube-channels-allowlist-guide" style={{ color: 'var(--accent)' }}>
                How to set up a whitelist-only YouTube for studying and coding tutorials
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link href="/tools/screen-time-calculator" style={{ color: 'var(--accent)' }}>
                YouTube Screen Time and Wasted Hours Calculator
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
