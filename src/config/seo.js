import { APP_CONFIG } from './constants'

export const SITE_URL = APP_CONFIG.liveWebsiteUrl.replace(/\/$/, '')
export const HOME_TITLE = 'Block YouTube Shorts & Recommendations'
export const HOME_DESCRIPTION = 'Hide YouTube Shorts, home feed, and recommendations. Set a daily watch limit. Free extension for Chrome, Firefox, and Edge. No account needed.'
export const SOCIAL_IMAGE = {
  url: '/screenshots/intentional_yt_marquee_1400x560.png',
  width: 1400,
  height: 560,
  alt: 'Intentional YT browser extension for distraction-free YouTube'
}

export function pageMetadata({ title, description, path = '/' }) {
  const url = new URL(path, SITE_URL).href
  const socialTitle = `${title} — Intentional YT`
  return {
    title, description, alternates: { canonical: url },
    openGraph: {
      type: 'website', locale: 'en_US', siteName: 'Intentional YT',
      url, title: socialTitle, description, images: [SOCIAL_IMAGE]
    },
    twitter: {
      card: 'summary_large_image', title: socialTitle, description,
      images: [SOCIAL_IMAGE.url]
    }
  }
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
