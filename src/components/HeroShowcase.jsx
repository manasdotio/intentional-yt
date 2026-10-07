import React from 'react'

export default function HeroShowcase() {
  return (
    <figure className="hero-showcase">
      <div className="hero-scene" aria-hidden="true">
        <div className="hero-scene-backdrop" />
        <div className="hero-scene-orbit" />
        <div className="hero-scene-note">
          A little breathing room.
          <svg viewBox="0 0 95 48" fill="none"><path d="M4 6C30 1 20 39 83 35M74 27l12 8-11 8" /></svg>
        </div>
        <div className="hero-preview-browser">
          <div className="hero-preview-toolbar">
            <span className="hero-window-dots"><i /><i /><i /></span>
            <span className="hero-preview-address">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
              youtube.com
            </span>
            <img src="/icons/icon.svg" alt="" width="17" height="17" />
          </div>
          <div className="hero-preview-content">
            <div className="hero-preview-ytbar">
              <span className="hero-preview-ytlogo"><span>▶</span> YouTube</span>
              <span className="hero-preview-search">A moment to slow down <span>⌕</span></span>
            </div>
            <div className="hero-preview-video">
              <img src="/screenshots/hero-calm-landscape.webp" alt="" width="1000" height="667" fetchPriority="high" />
              <span className="hero-preview-video-tag">A moment for you</span>
              <div className="hero-preview-player"><span>Ⅱ</span><span>03:24 / 12:00</span><span className="hero-preview-player-line" /><span>⛶</span></div>
            </div>
            <div className="hero-preview-video-info"><strong>A slower kind of afternoon</strong><span>Just the video. Room to focus.</span></div>
          </div>
        </div>
        <div className="hero-scene-tag hero-scene-tag-shorts">
          <span className="hero-scene-check">✓</span><span>Shorts, out of sight.</span>
        </div>
        <div className="hero-extension-frame">
          <div className="hero-extension-label"><span /> Your focus controls</div>
          <img className="hero-extension-light" src="/screenshots/hero-extension-light.webp" alt="" width="1080" height="1060" decoding="async" />
          <img className="hero-extension-dark" src="/screenshots/hero-extension-dark.webp" alt="" width="1080" height="1060" decoding="async" />
        </div>
      </div>
      <figcaption className="hero-showcase-caption">Your controls, up close.<span>Actual extension interface · Illustrated watch page</span>
        <a className="hero-controls-fullsize hero-controls-fullsize-light" href="/screenshots/hero-extension-light.webp" target="_blank" rel="noopener noreferrer">View full-size controls ↗</a>
        <a className="hero-controls-fullsize hero-controls-fullsize-dark" href="/screenshots/hero-extension-dark.webp" target="_blank" rel="noopener noreferrer">View full-size controls ↗</a>
      </figcaption>
    </figure>
  )
}
