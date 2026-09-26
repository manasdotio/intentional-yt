import React from 'react'
import { APP_CONFIG } from '../config/constants'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-pill">
        <span className="pill-dot"></span>
        <span>Zero-Flash Ingestion • Anti-Doomscroll • Focus Lock • 100% Local Privacy</span>
      </div>
      <h1 className="hero-title">
        The Open Source<br />
        <span className="serif-accent">YouTube Distraction Blocker</span> &amp; Daily Time Limit.
      </h1>
      <p className="hero-subtitle">
        Eliminate infinite feeds, algorithm rabbit holes, clickbait thumbnails, and Shorts. Intentional YT is a 100% free, private browser extension to block YouTube recommendations, hide Shorts, and set custom daily time limits.
      </p>
      <div className="hero-actions">
        <a
          href={APP_CONFIG.chromeWebStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-chrome btn-lg"
        >
          <img src="/icons/chrome.svg" alt="Google Chrome" width="20" height="20" style={{ display: 'block' }} />
          <span>Add to Chrome</span>
          <span style={{ fontSize: '16px', marginLeft: '2px' }}>→</span>
        </a>
        <a
          href={APP_CONFIG.firefoxAddonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-amo btn-lg"
        >
          <img src="/icons/firefox.svg" alt="Firefox" width="20" height="20" style={{ display: 'block' }} />
          <span>Add to Firefox</span>
          <span style={{ fontSize: '16px', marginLeft: '2px' }}>→</span>
        </a>
        <a href="#install" className="btn btn-secondary btn-lg">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Install Guide</span>
        </a>
      </div>
      <div className="hero-badges">
        <div className="badge-item">
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '14px' }}>✓</span>
          <span>Chrome Web Store &amp; Firefox AMO</span>
        </div>
        <div className="badge-item">
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '14px' }}>✓</span>
          <span>Zero-Flash &amp; Anti-Doomscroll</span>
        </div>
        <div className="badge-item">
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '14px' }}>✓</span>
          <span>Focus Lock &amp; Scheduling</span>
        </div>
        <div className="badge-item">
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '14px' }}>✓</span>
          <span>100% Local Privacy</span>
        </div>
      </div>
    </section>
  )
}
