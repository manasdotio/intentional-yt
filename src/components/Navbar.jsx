'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from '../context/ThemeContext'
import { APP_CONFIG } from '../config/constants'

export default function Navbar() {
  const { theme, toggleTheme, mounted } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [installUrl, setInstallUrl] = useState(APP_CONFIG.chromeWebStoreUrl)
  const menuButtonRef = useRef(null)
  const menuRef = useRef(null)
  const closeMenu = () => {
    setMobileMenuOpen(false)
    menuButtonRef.current?.focus()
  }

  // Smart detect user browser for primary install CTA
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || ''
      if (ua.includes('Firefox')) {
        setInstallUrl(APP_CONFIG.firefoxAddonUrl)
      } else if (ua.includes('Edg/')) {
        setInstallUrl(APP_CONFIG.edgeAddonUrl)
      }
    }
  }, [])

  // Keep keyboard focus and page scrolling inside the open mobile menu.
  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuRef.current?.querySelector('a')?.focus()
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        menuButtonRef.current?.focus()
      }
      if (e.key === 'Tab') {
        const items = menuRef.current?.querySelectorAll('a[href], button:not([disabled])')
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
        else if (!menuRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus() }
      }
    }
    const desktop = window.matchMedia('(min-width: 769px)')
    const handleResize = () => { if (desktop.matches) setMobileMenuOpen(false) }
    desktop.addEventListener('change', handleResize)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      desktop.removeEventListener('change', handleResize)
    }
  }, [mobileMenuOpen])

  return (
    <header className="nav-wrap">
      <nav className="nav">
        <Link 
          href="/" 
          className="brand" 
          aria-label="Intentional YT Home"
          onClick={() => setMobileMenuOpen(false)}
        >
          <img src="/icons/icon.svg" alt="Intentional YT Logo" className="brand-logo" width="28" height="28" />
          <span>{APP_CONFIG.shortName || APP_CONFIG.name}</span>
        </Link>

        <div className="nav-links">
          <Link href="/#demo" className="nav-link">Demo</Link>
          <Link href="/#features" className="nav-link">Features</Link>
          <Link href="/#setup" className="nav-link">Setup</Link>
          <Link href="/#faq" className="nav-link">FAQ</Link>
          <Link href="/blog" className="nav-link">Blog</Link>
        </div>

        <div className="nav-actions">
          <button
            className="theme-toggle-btn"
            id="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            title="Toggle theme"
            suppressHydrationWarning
          >
            {mounted && theme === 'dark' ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <a 
            href={installUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary nav-install-btn"
          >
            <span className="install-text-desktop">Get Extension</span>
            <span className="install-text-mobile">Install</span>
            <span className="hero-btn-arrow" aria-hidden="true" style={{ fontSize: '13px' }}>→</span>
          </a>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            ref={menuButtonRef}
            className={`nav-hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuOpen ? 'mobile-navigation' : undefined}
          >
            <span className="hamburger-line line-1"></span>
            <span className="hamburger-line line-2"></span>
            <span className="hamburger-line line-3"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={closeMenu}>
          <div 
            className="mobile-nav-drawer" 
            id="mobile-navigation"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div className="mobile-nav-heading">
              <span>Navigation</span>
              <button type="button" onClick={closeMenu} aria-label="Close navigation menu">×</button>
            </div>
            <div className="mobile-nav-links">
              <Link 
                href="/#demo" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">⚡</span>
                <span className="mobile-nav-text">Interactive Demo</span>
              </Link>
              <Link 
                href="/#features" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">✦</span>
                <span className="mobile-nav-text">Core Features</span>
              </Link>
              <Link 
                href="/#setup"
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">⚖️</span>
                <span className="mobile-nav-text">How to set it up</span>
              </Link>
              <Link 
                href="/#faq" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">💬</span>
                <span className="mobile-nav-text">Frequently Asked Questions</span>
              </Link>
              <Link 
                href="/blog" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">📝</span>
                <span className="mobile-nav-text">Blog &amp; Essays</span>
              </Link>
              <Link 
                href="/privacy" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">🔒</span>
                <span className="mobile-nav-text">Privacy Policy</span>
              </Link>
            </div>

            <div className="mobile-nav-divider"></div>

            <div className="mobile-nav-footer">
              <div className="mobile-nav-stores">
                <a
                  href={APP_CONFIG.chromeWebStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-store-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/icons/chrome.svg" alt="" width="16" height="16" aria-hidden="true" />
                  <span>Chrome</span>
                </a>
                <a
                  href={APP_CONFIG.edgeAddonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-store-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/icons/edge.svg" alt="" width="16" height="16" aria-hidden="true" />
                  <span>Edge</span>
                </a>
                <a
                  href={APP_CONFIG.firefoxAddonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-store-btn"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/icons/firefox.svg" alt="" width="16" height="16" aria-hidden="true" />
                  <span>Firefox</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
