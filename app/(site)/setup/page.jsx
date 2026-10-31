import { pageMetadata } from '@/src/config/seo'
import SetupShare from '@/src/components/SetupShare'

export const metadata = pageMetadata({
  title: 'Shared Focus Preset — Intentional YT',
  description: 'Inspect and import a 1-click shared YouTube focus preset for Intentional YT.',
  path: '/setup'
})

export default function SetupPage() {
  return <SetupShare />
}
