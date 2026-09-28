import { pageMetadata } from '@/src/config/seo'
import Privacy from '@/src/components/Privacy'

export const metadata = pageMetadata({"title":"Privacy Policy","description":"Read how Intentional YT stores settings and watch-time counters locally, without extension telemetry or an account.","path":"/privacy"})

export default function PrivacyPage() {
  return <Privacy />
}
