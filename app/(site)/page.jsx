import { APP_CONFIG } from '@/src/config/constants'
import { pageMetadata, serializeJsonLd } from '@/src/config/seo'
import Guides from '@/src/components/Guides'
import Hero from '@/src/components/Hero'
import LazySimulator from '@/src/components/LazySimulator'
import Features from '@/src/components/Features'
import BeforeAfter from '@/src/components/BeforeAfter'
import SetupSteps from '@/src/components/SetupSteps'
import Faq from '@/src/components/Faq'
import ClosingCta from '@/src/components/ClosingCta'

export const metadata = pageMetadata({ title: 'YouTube Distraction Blocker & Daily Limit', description: 'Hide YouTube Shorts and recommendations, set daily watch limits, and stay focused. Available for Chrome, Firefox, and Edge.' })

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.intentionalyt.me/#website",
      "url": "https://www.intentionalyt.me/",
      "name": "Intentional YT",
      "description": "YouTube distraction blocker and daily time limit browser extension.",
      "inLanguage": "en-US"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.intentionalyt.me/#software",
      "name": "Intentional YT - YouTube Distraction Blocker & Daily Time Limit",
      "operatingSystem": "Windows, macOS, Linux",
      "browserRequirements": "Requires Chrome, Firefox, Edge, or a compatible desktop browser",
      "applicationCategory": "ProductivityApplication",
      "applicationSubCategory": "Browser Extension",
      "softwareVersion": APP_CONFIG.version,
      "description": "A distraction-free YouTube extension that blocks YouTube recommendations, hides Shorts, neutralizes clickbait thumbnails, and sets daily time limits.",
      "url": "https://www.intentionalyt.me/",
      "downloadUrl": "https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg",
      "sameAs": [
        "https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg",
        "https://microsoftedge.microsoft.com/addons/detail/intentional-yt-youtube-/jjgijacfockomgkhljkhalhapnloonbb",
        "https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/"
      ],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "featureList": [
        "Zero-flash CSS injection at document_start",
        "Complete suppression of YouTube Shorts across shelves, sidebar, and search",
        "Clickbait thumbnail neutralization while preserving duration stamps",
        "Granular toggles for 20+ distraction points",
        "Built-in daily playback time tracker and reminder toasts",
        "100% private with strictly zero telemetry or remote analytics"
      ],
      "author": {
        "@type": "Person",
        "name": "manasdotio",
        "url": "https://github.com/manasdotio"
      }
    }

  ]
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Hero />
      <BeforeAfter />
      <Features />
      <LazySimulator />
      <SetupSteps />
      <Guides />
      <Faq />
      <ClosingCta />
    </>
  )
}
