import Hero from '@/src/components/Hero'
import Simulator from '@/src/components/Simulator'
import Features from '@/src/components/Features'
import Calculator from '@/src/components/Calculator'
import Comparison from '@/src/components/Comparison'
import Faq from '@/src/components/Faq'
import ReviewCta from '@/src/components/ReviewCta'
import Installation from '@/src/components/Installation'

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
          "name": "Why is Intentional YT considered the best Unhook and Untrap alternative?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unlike Unhook and Untrap, Intentional YT is 100% free and open-source under the MIT license, requires zero subscriptions, has 0% telemetry, injects zero-flash CSS at document_start, and includes integrated daily watch time limits, channel/keyword blocklists, and anti-doomscroll feed batches."
          }
        },
        {
          "@type": "Question",
          "name": "How does Intentional YT block YouTube recommendations without flickering?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Unlike blockers that wait for page scripts to load and cause visible content flashing, Intentional YT injects high-specificity CSS class tokens into the HTML root at document_start before paint, guaranteeing zero-flash blocking and 0ms layout lag."
          }
        },
        {
          "@type": "Question",
          "name": "Can I completely hide YouTube Shorts with this extension?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Intentional YT completely suppresses Shorts shelves, sidebar tabs, channel tabs, and search results across YouTube on Chrome, Firefox, Brave, and Edge."
          }
        },
        {
          "@type": "Question",
          "name": "How does the YouTube daily time limit feature work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Intentional YT includes a local watch-time tracker that monitors active video playback and displays mindful toast reminders or stops playback when your customizable daily limit (e.g. 30m, 60m) is reached."
          }
        },
        {
          "@type": "Question",
          "name": "Is Intentional YT open source and free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Intentional YT is 100% free, MIT licensed, and contains no paid tiers, subscriptions, tracking pixels, or data collection."
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
      <Calculator />
      <Comparison />
      <Faq />
      <ReviewCta />
      <Installation />
    </>
  )
}
