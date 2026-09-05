import React from 'react'
import { useTheme } from '../context/ThemeContext'
import { APP_CONFIG } from '../config/constants'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="nav-wrap">
      <nav className="nav">
        <a href="#" className="brand" aria-label="Intentional YT Home">
          <img src="/icons/icon.svg" alt="Intentional YT Logo" className="brand-logo" width="28" height="28" />
          <span>{APP_CONFIG.name}</span>
          <span className="brand-badge">{APP_CONFIG.versionShort}</span>
        </a>

        <div className="nav-links">
          <a href="#demo" className="nav-link">Interactive Demo</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#calculator" className="nav-link">Focus Calculator</a>
          <a href="#comparison" className="nav-link">Comparison</a>
          <a href="#faq" className="nav-link">FAQ</a>
          <a href="#install" className="nav-link">Installation</a>
        </div>

        <div className="nav-actions">
          <button
            className="theme-toggle-btn"
            id="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              /* Sun Icon (for dark mode) */
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              /* Moon Icon (for light mode) */
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <a
            href={APP_CONFIG.githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
          </a>

          <a
            href={APP_CONFIG.firefoxAddonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-amo"
          >
            <span>Add to Firefox</span>
          </a>
        </div>
      </nav>
    </header>
  )
}
