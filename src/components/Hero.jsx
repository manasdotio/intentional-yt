import React from 'react'
import { APP_CONFIG } from '../config/constants'
import HeroShowcase from './HeroShowcase'

export default function Hero() {
  return (
    <section className="hero hero-welcome" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <div className="hero-kicker">
          <span className="hero-kicker-dot" aria-hidden="true" />
          <span>Watch without the distractions</span>
        </div>
        <h1 className="hero-title" id="hero-heading">
          Your YouTube.<br />
          <span className="hero-title-calm">A little calmer.</span>
        </h1>
        <p className="hero-subtitle">
          Hide Shorts and recommendations so you can watch the video you came for.
          Set a daily limit if you tend to stay longer than you meant to.
        </p>
        <p className="hero-product-label">Free for Chrome, Firefox &amp; Edge on desktop.</p>
        <div className="hero-actions">
          <a href={APP_CONFIG.chromeWebStoreUrl} target="_blank" rel="noopener noreferrer"
            className="btn hero-btn-primary" aria-label="Add Intentional YT to Chrome">
            <img src="/icons/chrome.svg" alt="" width="20" height="20" />
            <span>Add to Chrome</span>
            <span className="hero-btn-arrow" aria-hidden="true">↗</span>
          </a>
          <a href="#before-after" className="hero-demo-link">
            <span className="hero-demo-play" aria-hidden="true">▶</span>
            See what changes
          </a>
        </div>
        <div className="hero-browser-options">
          <span>Also available for</span>
          <a href={APP_CONFIG.firefoxAddonUrl} target="_blank" rel="noopener noreferrer" aria-label="Add Intentional YT to Firefox">
            <img src="/icons/firefox.svg" alt="" width="17" height="17" /> Firefox
          </a>
          <a href={APP_CONFIG.edgeAddonUrl} target="_blank" rel="noopener noreferrer" aria-label="Add Intentional YT to Microsoft Edge">
            <img src="/icons/edge.svg" alt="" width="17" height="17" /> Edge
          </a>
        </div>
        <p className="hero-reassurance">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z" /><path d="m8 12 3 3 5-6" />
          </svg>
          No account needed. Your settings stay local.
        </p>
      </div>
      <HeroShowcase />
    </section>
  )
}
