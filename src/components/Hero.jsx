import React from 'react'
import { APP_CONFIG } from '../config/constants'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-kicker">
        <span>✦ Focus on what matters</span>
      </div>

      <h1 className="hero-title">
        <span className="hero-title-main">YouTube Distraction Blocker</span>{' '}
        <span className="hero-title-sub">&amp; Daily Time Limit.</span>
      </h1>

      <p className="hero-subtitle">
        Hide YouTube recommendations, block Shorts, and set a daily watch limit. Available for Chrome, Firefox, and Edge.
      </p>

      <div className="hero-actions">
        <a
          href={APP_CONFIG.chromeWebStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn hero-btn-primary"
          aria-label="Add Intentional YT to Chrome"
        >
          <img src="/icons/chrome.svg" alt="" width="20" height="20" aria-hidden="true" />
          <span>Add to Chrome</span>
          <span className="hero-btn-arrow" aria-hidden="true">→</span>
        </a>

        <a
          href={APP_CONFIG.edgeAddonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn hero-btn-secondary hero-btn-edge"
          aria-label="Add Intentional YT to Microsoft Edge"
        >
          <img src="/icons/edge.svg" alt="" width="20" height="20" aria-hidden="true" />
          <span>Add to Edge</span>
        </a>

        <a
          href={APP_CONFIG.firefoxAddonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn hero-btn-secondary"
          aria-label="Add Intentional YT to Firefox"
        >
          <img src="/icons/firefox.svg" alt="" width="20" height="20" aria-hidden="true" />
          <span>Add to Firefox</span>
        </a>
      </div>

      <p className="hero-reassurance">
        Use it without an account or tracking. Your settings stay in your browser.
      </p>
    </section>
  )
}
