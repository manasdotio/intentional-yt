import Uninstall from '@/src/components/Uninstall'

export const metadata = {
  title: 'Uninstall Feedback',
  description: 'Mind letting us know how we can improve Intentional YT?',
  robots: {
    index: false,
    follow: false
  }
}

export default function UninstallPage() {
  return <Uninstall />
}
