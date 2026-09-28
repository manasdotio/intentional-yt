import Hero from '@/src/components/Hero'
import Simulator from '@/src/components/Simulator'
import Features from '@/src/components/Features'
import Comparison from '@/src/components/Comparison'
import Faq from '@/src/components/Faq'

export const metadata = {
  title: 'YouTube Distraction Blocker & Daily Limit — Intentional YT',
  alternates: {
    canonical: 'https://intentionalyt.me/'
  }
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://intentionalyt.me/#website",
      "url": "https://intentionalyt.me/",
      "name": "Intentional YT",
      "description": "Open source YouTube distraction blocker and daily time limit browser extension.",
      "inLanguage": "en-US"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://intentionalyt.me/#software",
      "name": "Intentional YT - YouTube Distraction Blocker & Daily Time Limit",
      "operatingSystem": "Google Chrome, Mozilla Firefox, Brave, Microsoft Edge, Arc",
      "applicationCategory": "ProductivityApplication",
      "applicationSubCategory": "Browser Extension",
      "softwareVersion": "2.3.0",
      "license": "https://github.com/manasdotio/intentional-yt/blob/main/LICENSE",
      "description": "An open source, distraction-free YouTube extension that blocks YouTube recommendations, hides Shorts, neutralizes clickbait thumbnails, and sets daily time limits.",
      "url": "https://intentionalyt.me/",
      "downloadUrl": "https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg",
      "sameAs": [
        "https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg",
        "https://microsoftedge.microsoft.com/addons/detail/intentional-yt-youtube-/jjgijacfockomgkhljkhalhapnloonbb",
        "https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/",
        "https://github.com/manasdotio/intentional-yt"
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
        "@type": "Organization",
        "name": "manasdotio",
        "url": "https://github.com/manasdotio"
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://intentionalyt.me/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does Intentional YT achieve zero-flash blocking on YouTube?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unlike blockers that wait for page scripts to load and cause visible content flashing, Intentional YT injects high-specificity CSS class tokens into the HTML root at document_start before paint, guaranteeing zero-flash blocking and 0ms layout lag."
          }
        },
        {
          "@type": "Question",
          "name": "Why is Intentional YT considered the best Unhook and Untrap alternative?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unlike Unhook and Untrap, Intentional YT is 100% free and open-source under the MIT license, requires zero subscriptions, has 0% telemetry, injects zero-flash CSS at document_start, and includes integrated daily watch time limits, channel/keyword blocklists, and anti-doomscroll feed batches."
          }
        },
        {
          "@type": "Question",
          "name": "How do Focus Lock and cooldown timers prevent impulsive overrides?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Focus Lock prevents impulsive override by requiring an intentional cooldown delay (e.g. 5, 10, or 30 minutes) before any focus rules can be unlocked, paired with scheduled active hours."
          }
        },
        {
          "@type": "Question",
          "name": "Does Intentional YT collect any browsing history or watch data?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Strictly zero. Intentional YT contains zero analytics, zero telemetry, and zero remote network requests. All data stays 100% local in browser.storage.local."
          }
        },
        {
          "@type": "Question",
          "name": "Which browsers and platforms are supported?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Intentional YT is verified and published on both the Chrome Web Store (Chrome, Brave, Edge, Opera, Arc) and Firefox AMO."
          }
        }
      ]
    }
  ]
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Simulator />
      <Features />
      <Comparison />
      <Faq />
    </>
  )
}
