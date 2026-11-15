import Link from 'next/link'
import { pageMetadata, serializeJsonLd, SITE_URL } from '@/src/config/seo'
import ScreenTimeCalculatorTool from '@/src/components/ScreenTimeCalculatorTool'

export const metadata = pageMetadata({
  title: 'YouTube Screen Time and Wasted Hours Calculator',
  description: 'Calculate how many hours and dollars algorithmic YouTube recommendations cost you each year. Free interactive focus audit and recovery calculator.',
  path: '/tools/screen-time-calculator',
  image: '/screenshots/og-tools-screentime-calculator.png'
})

export default function ScreenTimeCalculatorPage() {
  const toolsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'YouTube Screen Time and Focus Recovery Calculator',
    url: `${SITE_URL}/tools/screen-time-calculator`,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires Chrome, Edge, Brave, or Firefox',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: 'Free interactive tool to calculate annual time lost to YouTube recommendations, economic opportunity cost, and hours recovered with daily watch limits.'
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
        name: 'Screen Time Calculator',
        item: `${SITE_URL}/tools/screen-time-calculator`
      }
    ]
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does YouTube daily limit tracking work without an account?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Intentional YT monitors HTML5 video playback state directly inside your browser tab. When a video is actively playing, a lightweight local timer accumulates elapsed seconds in chrome.storage.local. Once your daily budget expires, the player pauses and displays a calm cooldown screen.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does pausing a video count against my daily limit?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The timer only ticks when the video is unpaused and actively playing audio or video frames. Pausing to take notes or leaving a tab open in the background does not consume your daily allowance.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I prevent myself from simply increasing my limit when time runs out?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Intentional YT includes a Focus Lock feature. You can protect your settings with a 4-digit PIN code and enforce a mandatory cooldown timer of up to 60 minutes before any limit adjustments are accepted.'
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
          <li style={{ color: 'var(--text)' }}>Screen Time Calculator</li>
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
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            marginBottom: '12px'
          }}
        >
          Interactive Productivity Audit
        </span>
        <h1 style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1.25, marginBottom: '14px' }}>
          YouTube Screen Time and Wasted Hours Calculator
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Most YouTube viewing begins with a single search and ends in an algorithmic rabbit hole. Use the interactive sliders below to audit your annual hours lost, economic opportunity cost, and focus recovery potential.
        </p>
      </header>

      {/* Interactive Tool Component */}
      <ScreenTimeCalculatorTool />

      {/* Editorial Content */}
      <article style={{ marginTop: '50px', lineHeight: 1.7, color: 'var(--text)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
          The hidden compounding cost of autoplay and infinite scroll
        </h2>
        <p>
          According to YouTube published engineering papers, more than 70% of total platform watch time is driven directly by algorithmic recommendations. The recommendation engine is designed to optimize for session duration rather than user satisfaction.
        </p>
        <p>
          Spending 90 minutes each day on YouTube does not feel like an addiction in the moment. But over the course of a single calendar year, 90 minutes per day totals <strong>547 hours</strong>. If two-thirds of that watch time comes from algorithmic sidebar clicks and Shorts autoplay loops, you lose over <strong>350 hours of conscious attention every year</strong>. That represents two full work months or 70 read books.
        </p>

        <h2 style={{ fontSize: '24px', fontWeight: '700', marginTop: '36px', marginBottom: '16px' }}>
          How to implement Newspaper Mode
        </h2>
        <p>
          You do not need to quit YouTube completely to regain your focus. Intentional YT offers Newspaper Mode, which caps your home feed to 15 deliberate videos and eliminates infinite scroll.
        </p>
        <p>
          Just like a print newspaper with a physical back page, your feed comes to an end. Once you review the top 15 videos, there is nothing left to scroll. Pairing this with a 25-minute daily playback timer restores YouTube as an intentional research utility.
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
              Does Intentional YT track my personal viewing history?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              No. Intentional YT has zero remote servers, zero analytics packages, and zero telemetry. All timer counts remain stored exclusively in your local browser profile.
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
              What happens when the daily watch limit is reached?
            </summary>
            <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
              When your timer expires, the video player pauses and a clean, unobtrusive overlay informs you that your daily limit has finished. You can close the tab and return to deep work.
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
              <Link href="/blog/limit-youtube-home-feed-to-15-videos" style={{ color: 'var(--accent)' }}>
                How to disable YouTube infinite scroll and limit your home feed to 15 videos
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link href="/blog/set-youtube-daily-time-limit" style={{ color: 'var(--accent)' }}>
                How to set a strict daily YouTube watch limit on desktop
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
