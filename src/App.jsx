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

export default function App() {
  const [isPrivacyPage, setIsPrivacyPage] = useState(
    typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/privacy') || window.location.hash === '#/privacy' || window.location.hash === '#privacy')
  )

  useEffect(() => {
    const handleLocationChange = () => {
      setIsPrivacyPage(
        window.location.pathname.startsWith('/privacy') || 
        window.location.hash === '#/privacy' || 
        window.location.hash === '#privacy'
      )
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
      <div className="container">
        <Navbar />
        <main>
          {isPrivacyPage ? (
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
    </ThemeProvider>
  )
}
