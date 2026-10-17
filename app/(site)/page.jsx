import { APP_CONFIG } from '@/src/config/constants'
import { HOME_TITLE, HOME_DESCRIPTION, pageMetadata, serializeJsonLd } from '@/src/config/seo'
import Guides from '@/src/components/Guides'
import Hero from '@/src/components/Hero'
import LazySimulator from '@/src/components/LazySimulator'
import Features from '@/src/components/Features'
import BeforeAfter from '@/src/components/BeforeAfter'
import SetupSteps from '@/src/components/SetupSteps'
import Faq from '@/src/components/Faq'
import ClosingCta from '@/src/components/ClosingCta'

export const metadata = pageMetadata({ title: HOME_TITLE, description: HOME_DESCRIPTION })

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.intentionalyt.me/#website",
      "url": "https://www.intentionalyt.me/",
      "name": "Intentional YT",
      "description": APP_CONFIG.description,
      "inLanguage": "en-US"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.intentionalyt.me/#software",
      "name": APP_CONFIG.shortName,
      "operatingSystem": "Windows, macOS, Linux",
      "browserRequirements": "Requires Chrome, Firefox, Edge, or a compatible desktop browser",
      "applicationCategory": "ProductivityApplication",
      "applicationSubCategory": "Browser Extension",
      "softwareVersion": APP_CONFIG.version,
      "description": APP_CONFIG.description,
      "isAccessibleForFree": true,
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
        "Hide YouTube home-feed and sidebar recommendations",
        "Hide Shorts on supported feeds and pages",
        "Clickbait thumbnail neutralization while preserving duration stamps",
        "Granular toggles for 20+ distraction points",
        "Set a daily watch-time limit that pauses playback when reached",
        "Keep search and subscriptions available",
        "Local extension settings and counters, with no usage analytics"
      ],
      "author": {
        "@type": "Person",
        "name": "manasdotio",
        "url": "https://github.com/manasdotio"
      }
    },
    {
      "@type": "WebPage",
      "@id": "https://www.intentionalyt.me/#webpage",
      "url": "https://www.intentionalyt.me/",
      "name": `${HOME_TITLE} — Intentional YT`,
      "description": HOME_DESCRIPTION,
      "isPartOf": { "@id": "https://www.intentionalyt.me/#website" },
      "mainEntity": { "@id": "https://www.intentionalyt.me/#software" }
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
