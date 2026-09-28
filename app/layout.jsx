import '../src/index.css'
import { ThemeProvider } from '../src/context/ThemeContext'

export const metadata = {
  metadataBase: new URL('https://www.intentionalyt.me'),
  title: {
    default: 'YouTube Distraction Blocker & Daily Limit — Intentional YT',
    template: '%s — Intentional YT'
  },
  description: 'Free YouTube distraction blocker to hide recommendations, block Shorts, and set daily time limits. 100% open source, zero subscriptions, and strictly private.',
  keywords: [
    'youtube distraction blocker',
    'block youtube recommendations extension',
    'youtube daily time limit extension',
    'hide youtube shorts extension',
    'unhook alternative',
    'untrap alternative',
    'open source youtube blocker',
    'intentional yt'
  ],
  authors: [{ name: 'manasdotio', url: 'https://github.com/manasdotio' }],
  creator: 'manasdotio',
  publisher: 'manasdotio',
  applicationName: 'Intentional YT',
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-32.png', type: 'image/png', sizes: '32x32' }
    ],
    apple: [
      { url: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.intentionalyt.me/',
    siteName: 'Intentional YT',
    title: 'YouTube Distraction Blocker & Daily Limit — Intentional YT',
    description: 'Free open-source YouTube distraction blocker. Hide recommendations, block YouTube Shorts, neutralize clickbait, and set custom daily time limits.',
    images: [
      {
        url: '/screenshots/intentional_yt_marquee_1400x560.png',
        width: 1400,
        height: 560,
        alt: 'Intentional YT - Distraction Free Minimal YouTube Interface'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Distraction Blocker & Daily Limit — Intentional YT',
    description: 'Free open-source YouTube distraction blocker. Hide recommendations, block YouTube Shorts, neutralize clickbait, and set custom daily time limits.',
    images: ['/screenshots/intentional_yt_marquee_1400x560.png']
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth" data-theme="light" suppressHydrationWarning>
      <head>
        {/* Anti-Flicker: Set data-theme immediately before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('intentional_yt_theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||(d?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
          }}
        />
        <meta name="theme-color" content="#fbfbfe" id="meta-theme-color" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <div className="app-shell">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
