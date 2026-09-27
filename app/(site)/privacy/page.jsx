import Privacy from '@/src/components/Privacy'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Intentional YT is engineered to be 100% private, offline-first, and telemetry-free. Your data never leaves your browser.',
  alternates: {
    canonical: 'https://intentionalyt.me/privacy'
  },
  openGraph: {
    type: 'website',
    url: 'https://intentionalyt.me/privacy',
    title: 'Privacy Policy — Intentional YT',
    description: 'Intentional YT is engineered to be 100% private, offline-first, and telemetry-free. Your data never leaves your browser.'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — Intentional YT',
    description: 'Intentional YT is engineered to be 100% private, offline-first, and telemetry-free. Your data never leaves your browser.'
  }
}

export default function PrivacyPage() {
  return <Privacy />
}
