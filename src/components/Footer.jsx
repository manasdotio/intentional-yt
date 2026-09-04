import React from 'react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        {/* Brand / About Column */}
        <div className="footer-brand-col">
          <div className="footer-brand-title">
            <img src="/icons/icon.svg" width="24" height="24" alt="Intentional YT Logo" />
            <span>Intentional YT</span>
          </div>
          <p className="footer-brand-desc">
            A minimalist, zero-flash browser extension engineered to strip distraction surfaces, endless recommendations, and clickbait from YouTube.
          </p>
          <div className="footer-badges">
            <span className="footer-tag">MIT Open Source</span>
            <span className="footer-tag">100% Local</span>
            <span className="footer-tag">Zero Telemetry</span>
          </div>
        </div>

        {/* Product & Features Column */}
        <div>
          <h4 className="footer-col-title">Navigation</h4>
          <ul className="footer-nav-list">
            <li><a href="#demo" className="footer-nav-link">Interactive Demo</a></li>
            <li><a href="#features" className="footer-nav-link">Core Features</a></li>
            <li><a href="#calculator" className="footer-nav-link">Focus Calculator</a></li>
            <li><a href="#comparison" className="footer-nav-link">Why Us?</a></li>
            <li><a href="#faq" className="footer-nav-link">FAQ</a></li>
          </ul>
        </div>

        {/* Installation & Stores */}
        <div>
          <h4 className="footer-col-title">Installation</h4>
          <ul className="footer-nav-list">
            <li><a href="https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/" target="_blank" rel="noopener noreferrer" className="footer-nav-link">Firefox Add-on Store ↗</a></li>
            <li><a href="#install" className="footer-nav-link">Chrome &amp; Brave Setup</a></li>
            <li><a href="#install" className="footer-nav-link">Edge &amp; Arc Setup</a></li>
            <li><a href="https://github.com/manasdotio/intentional-yt/releases" target="_blank" rel="noopener noreferrer" className="footer-nav-link">Release Packages ↗</a></li>
          </ul>
        </div>

        {/* Open Source & Resources */}
        <div>
          <h4 className="footer-col-title">Resources</h4>
          <ul className="footer-nav-list">
            <li><a href="https://github.com/manasdotio/intentional-yt" target="_blank" rel="noopener noreferrer" className="footer-nav-link">GitHub Repository ↗</a></li>
            <li><a href="https://github.com/manasdotio/intentional-yt/blob/main/PRIVACY.md" target="_blank" rel="noopener noreferrer" className="footer-nav-link">Privacy Policy</a></li>
            <li><a href="https://github.com/manasdotio/intentional-yt/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" className="footer-nav-link">Security Audit</a></li>
            <li><a href="https://github.com/manasdotio/intentional-yt/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="footer-nav-link">Contributing</a></li>
            <li><a href="https://github.com/manasdotio/intentional-yt/issues" target="_blank" rel="noopener noreferrer" className="footer-nav-link">Report an Issue ↗</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          <span>© 2026 Intentional YT • Free &amp; Open Source under MIT License</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span>Designed for deep focus &amp; digital well-being</span>
          <span>•</span>
          <a href="#" className="footer-back-top" aria-label="Scroll back to top">
            <span>Back to top</span>
            <span>↑</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
