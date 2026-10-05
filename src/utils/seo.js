/**
 * Helper to update document head tags for SEO dynamically
 */

const DEFAULT_SEO = {
  title: 'YouTube Distraction Blocker & Daily Limit — Intentional YT',
  description: 'YouTube distraction blocker to hide recommendations, block Shorts, and set daily time limits. Private settings and watch-time tracking stay in your browser.',
  url: 'https://www.intentionalyt.me/',
  image: 'https://www.intentionalyt.me/screenshots/intentional_yt_marquee_1400x560.png'
}

function setMetaTag(selector, attrName, value) {
  if (typeof document === 'undefined') return
  let el = document.querySelector(selector)
  if (!el && value) {
    el = document.createElement('meta')
    if (selector.startsWith('meta[name=')) {
      const name = selector.match(/meta\[name="?([^"\]]+)"?\]/)?.[1]
      if (name) el.setAttribute('name', name)
    } else if (selector.startsWith('meta[property=')) {
      const prop = selector.match(/meta\[property="?([^"\]]+)"?\]/)?.[1]
      if (prop) el.setAttribute('property', prop)
    }
    document.head.appendChild(el)
  }
  if (el) {
    el.setAttribute(attrName, value)
  }
}

function setCanonical(url) {
  if (typeof document === 'undefined') return
  let el = document.querySelector('link[rel="canonical"]')
  if (!el && url) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  if (el) {
    el.setAttribute('href', url)
  }
}

export function updateMetaTags({ title, description, url, image } = {}) {
  const finalTitle = title ? `${title} — Intentional YT` : DEFAULT_SEO.title
  const finalDesc = description || DEFAULT_SEO.description
  const finalUrl = url || DEFAULT_SEO.url
  const finalImage = image || DEFAULT_SEO.image

  if (typeof document !== 'undefined') {
    document.title = finalTitle

    setMetaTag('meta[name="title"]', 'content', finalTitle)
    setMetaTag('meta[name="description"]', 'content', finalDesc)

    // Open Graph
    setMetaTag('meta[property="og:title"]', 'content', finalTitle)
    setMetaTag('meta[property="og:description"]', 'content', finalDesc)
    setMetaTag('meta[property="og:url"]', 'content', finalUrl)
    setMetaTag('meta[property="og:image"]', 'content', finalImage)

    // Twitter
    setMetaTag('meta[name="twitter:title"]', 'content', finalTitle)
    setMetaTag('meta[name="twitter:description"]', 'content', finalDesc)
    setMetaTag('meta[name="twitter:url"]', 'content', finalUrl)
    setMetaTag('meta[name="twitter:image"]', 'content', finalImage)

    // Canonical
    setCanonical(finalUrl)
  }
}

export function resetMetaTags() {
  updateMetaTags(DEFAULT_SEO)
}
