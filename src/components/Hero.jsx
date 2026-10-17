import React from 'react'
import { InstallButton, InstallOptions } from './InstallActions'
import HeroShowcase from './HeroShowcase'
import { APP_CONFIG } from '../config/constants'

export default function Hero() {
  return (
    <section className="hero hero-welcome" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <div className="hero-kicker">
          <span className="hero-kicker-dot" aria-hidden="true" />
          <span>Watch without the distractions</span>
        </div>
        <h1 className="hero-title" id="hero-heading">
          Block YouTube Shorts.<br />
          <span className="hero-title-calm">Keep your focus.</span>
        </h1>
        <p className="hero-subtitle">
          {APP_CONFIG.description}
        </p>
        <p className="hero-product-label">Free for Chrome, Firefox &amp; Edge on desktop.</p>
        <div className="hero-actions">
          <InstallButton />
          <a href="#before-after" className="hero-demo-link">
            <span className="hero-demo-play" aria-hidden="true">▶</span>
            See what changes
          </a>
        </div>
        <InstallOptions id="install-options" />
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
