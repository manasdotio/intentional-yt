import '../src/index.css'
import { ThemeProvider } from '../src/context/ThemeContext'
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'

const siteSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--site-sans'
})

const siteMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--site-mono'
})

export const metadata = {
  metadataBase: new URL('https://www.intentionalyt.me'),
  title: {
    default: 'YouTube Distraction Blocker & Daily Limit — Intentional YT',
    template: '%s — Intentional YT'
  },
  description: 'YouTube distraction blocker to hide recommendations, block Shorts, and set daily time limits. Private settings and watch-time tracking stay in your browser.',
  keywords: [
    'youtube distraction blocker',
    'block youtube recommendations extension',
    'youtube daily time limit extension',
    'hide youtube shorts extension',
    'unhook alternative',
    'untrap alternative',
    'private youtube blocker',
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
    description: 'YouTube distraction blocker. Hide recommendations, block YouTube Shorts, neutralize clickbait, and set custom daily time limits.',
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
    description: 'YouTube distraction blocker. Hide recommendations, block YouTube Shorts, neutralize clickbait, and set custom daily time limits.',
    images: ['/screenshots/intentional_yt_marquee_1400x560.png']
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`scroll-smooth ${siteSans.variable} ${siteMono.variable}`} data-theme="light" suppressHydrationWarning>
      <head>
        {/* Anti-Flicker: Set data-theme immediately before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('intentional_yt_theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||(d?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
          }}
        />
        <meta name="theme-color" content="#fbfbfe" id="meta-theme-color" />
        <meta name="color-scheme" content="light dark" />
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
