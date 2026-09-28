'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '../context/ThemeContext'
import { APP_CONFIG } from '../config/constants'

export default function Navbar() {
  const { theme, toggleTheme, mounted } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [installUrl, setInstallUrl] = useState(APP_CONFIG.chromeWebStoreUrl)

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

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
          <span className="brand-badge">{APP_CONFIG.versionShort}</span>
        </Link>

        <div className="nav-links">
          <Link href="/#demo" className="nav-link">Demo</Link>
          <Link href="/#features" className="nav-link">Features</Link>
          <Link href="/#comparison" className="nav-link">Comparison</Link>
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
            href={APP_CONFIG.githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-icon-btn nav-github"
            aria-label="GitHub Repository"
            title="View source on GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>

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
            className={`nav-hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line line-1"></span>
            <span className="hamburger-line line-2"></span>
            <span className="hamburger-line line-3"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="mobile-nav-drawer" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile Navigation"
          >
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
                href="/#comparison" 
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-nav-icon">⚖️</span>
                <span className="mobile-nav-text">Unhook &amp; Untrap Comparison</span>
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
              <a
                href={APP_CONFIG.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-nav-gh-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>manasdotio/intentional-yt (MIT)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
