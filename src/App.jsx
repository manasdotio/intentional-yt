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
import BlogList from './components/BlogList'
import BlogPost from './components/BlogPost'

export default function App() {
  const checkRoutes = () => {
    if (typeof window === 'undefined') {
      return { privacy: false, uninstall: false, blog: false, blogSlug: null }
    }
    const path = window.location.pathname || ''
    const hash = window.location.hash || ''

    let blogSlug = null
    if (path.startsWith('/blog/')) {
      const parts = path.replace(/^\/blog\/?/, '').split('/')
      if (parts[0]) blogSlug = decodeURIComponent(parts[0])
    } else if (hash.startsWith('#/blog/') || hash.startsWith('#blog/')) {
      const parts = hash.replace(/^#\/?blog\/?/, '').split('/')
      if (parts[0]) blogSlug = decodeURIComponent(parts[0])
    }

    const isBlogIndex = !blogSlug && (
      path === '/blog' || path === '/blog/' ||
      hash === '#/blog' || hash === '#blog'
    )

    return {
      privacy: path.startsWith('/privacy') || hash === '#/privacy' || hash === '#privacy',
      uninstall: path.startsWith('/uninstall') || hash === '#/uninstall' || hash === '#uninstall',
      blog: isBlogIndex,
      blogSlug
    }
  }

  const [routes, setRoutes] = useState(checkRoutes)

  const navigateTo = (url) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', url)
      setRoutes(checkRoutes())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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
            ) : routes.blogSlug ? (
              <BlogPost slug={routes.blogSlug} onNavigate={navigateTo} />
            ) : routes.blog ? (
              <BlogList onNavigate={navigateTo} />
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
