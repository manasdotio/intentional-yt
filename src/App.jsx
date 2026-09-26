import React, { useState, useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Simulator from './components/Simulator'
import Features from './components/Features'
import Calculator from './components/Calculator'
import Comparison from './components/Comparison'
import Faq from './components/Faq'
import Installation from './components/Installation'
import ReviewCta from './components/ReviewCta'
import Footer from './components/Footer'
import Privacy from './components/Privacy'
import Uninstall from './components/Uninstall'

export default function App() {
  const checkRoutes = () => {
    if (typeof window === 'undefined') return { privacy: false, uninstall: false }
    const path = window.location.pathname || ''
    const hash = window.location.hash || ''
    return {
      privacy: path.startsWith('/privacy') || hash === '#/privacy' || hash === '#privacy',
      uninstall: path.startsWith('/uninstall') || hash === '#/uninstall' || hash === '#uninstall'
    }
  }

  const [routes, setRoutes] = useState(checkRoutes)

  useEffect(() => {
    const handleLocationChange = () => {
      setRoutes(checkRoutes())
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  return (
    <ThemeProvider>
      <div className="ambient-glow" />
      <div className="ambient-grid" />
      {routes.uninstall ? (
        <Uninstall />
      ) : (
        <div className="container">
          <Navbar />
          <main>
            {routes.privacy ? (
              <Privacy />
            ) : (
              <>
                <Hero />
                <Simulator />
                <Features />
                <Calculator />
                <Comparison />
                <Faq />
                <Installation />
                <ReviewCta />
              </>
            )}
          </main>
          <Footer />
        </div>
      )}
    </ThemeProvider>
  )
}
