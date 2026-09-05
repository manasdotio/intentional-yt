import React from 'react'
import { APP_CONFIG } from '../config/constants'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-pill">
        <span className="pill-dot"></span>
        <span>Zero-Flash DOM Ingestion • 100% Local Privacy</span>
      </div>
      <h1 className="hero-title">
        Turn YouTube into a<br />
        <span className="serif-accent">mindful focus tool</span>, not a trap.
      </h1>
      <p className="hero-subtitle">
        Eliminate infinite feeds, algorithm rabbit holes, clickbait thumbnails, and Shorts. Intentional YT gives you granular, instant control over every distraction surface on YouTube.
      </p>
      <div className="hero-actions">
        <a
          href={APP_CONFIG.firefoxAddonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-amo btn-lg"
        >
          <span>Add to Firefox</span>
          <span style={{ fontSize: '16px', marginLeft: '2px' }}>→</span>
        </a>
        <a href="#install" className="btn btn-secondary btn-lg">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Chromium &amp; Source</span>
        </a>
      </div>
      <div className="hero-badges">
        <div className="badge-item">
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '14px' }}>✓</span>
          <span>Verified Firefox Add-on</span>
        </div>
        <div className="badge-item">
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '14px' }}>✓</span>
          <span>Zero Content Pop-in</span>
        </div>
        <div className="badge-item">
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '14px' }}>✓</span>
          <span>0% Telemetry &amp; Local</span>
        </div>
      </div>
    </section>
  )
}
