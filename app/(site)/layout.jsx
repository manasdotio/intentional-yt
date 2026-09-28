import Navbar from '@/src/components/Navbar'
import Footer from '@/src/components/Footer'

export default function SiteLayout({ children }) {
  return (
    <div className="container">
      <Navbar />
      <main id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}
