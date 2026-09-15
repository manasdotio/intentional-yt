import React, { useEffect } from 'react'
import { APP_CONFIG } from '../config/constants'

export default function Privacy() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.title = 'Privacy Policy — Intentional YT'
  }, [])

  return (
    <div className="privacy-page" style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 0 80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <a 
          href="/" 
          className="btn btn-secondary" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '6px 14px' }}
        >
          <span>← Back to Home</span>
        </a>
      </div>

      <div className="section-head" style={{ textAlign: 'left', marginBottom: '36px' }}>
        <div className="section-eyebrow">Privacy &amp; Security</div>
        <h1 className="section-title" style={{ fontSize: '36px', marginBottom: '12px' }}>Privacy Policy</h1>
        <p className="section-desc" style={{ maxWidth: '100%', fontSize: '16px' }}>
          Intentional YT is engineered to be 100% private, offline-first, and telemetry-free. Your data never leaves your browser.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="brand-badge" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            ✓ 0% Telemetry
          </span>
          <span className="brand-badge">
            ✓ 100% Local Storage
          </span>
          <span style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
            Effective Date: September 15, 2026
          </span>
        </div>
      </div>

      <div className="table-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
            1. Core Principle
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '14.5px' }}>
            Intentional YT was designed from day one to give users complete control over their attention without monitoring or logging their activity. The extension operates entirely within your browser's private local environment.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
            2. Local Data Storage
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '14.5px', marginBottom: '14px' }}>
            All user settings and watch-time statistics are saved exclusively on your local device via the native browser storage API (<code>chrome.storage.local</code> / <code>browser.storage.local</code>). None of this data is transmitted across the internet.
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '14px', paddingLeft: '20px' }}>
            <li><strong>UI Toggle Preferences:</strong> Which distraction surfaces you choose to block (e.g. hiding home feeds, comments, or Shorts).</li>
            <li><strong>Timer Preferences:</strong> Configured reminder interval minutes and daily active playback limits.</li>
            <li><strong>Daily Watch Statistics:</strong> Accumulated seconds watched today and the date of the last 24-hour reset.</li>
          </ul>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
            3. Data Access &amp; Permissions
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '14.5px', marginBottom: '12px' }}>
            The extension requests permissions strictly necessary to function on YouTube:
          </p>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '14px', paddingLeft: '20px' }}>
            <li><strong>Target Domains:</strong> Content scripts execute solely on <code>*://www.youtube.com/*</code> and <code>*://m.youtube.com/*</code> to apply CSS stylesheet rules and observe video play/pause events.</li>
            <li><strong>Explicit Exclusions:</strong> <code>music.youtube.com</code> is explicitly excluded.</li>
            <li><strong>Storage Permission:</strong> Used only to read and write your local toggle states and playback counter.</li>
          </ul>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
            4. What We Do NOT Do
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>🚫 Zero Network Calls</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>The extension never connects to external servers, APIs, or endpoints.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>🚫 Zero Telemetry &amp; Analytics</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>No Google Analytics, tracking pixels, crash reporters, or usage beacons.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>🚫 Zero Third-Party Scripts</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>No external CDNs, ad networks, or remote tracking libraries are loaded.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>🚫 Zero Identification</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>We never collect your IP address, browsing history, search terms, or account info.</p>
            </div>
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
            5. Data Removal &amp; User Control
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '14.5px' }}>
            You retain 100% control over your data. You can manually reset your daily watch metrics at any time by clicking the "Reset Today's Time" button in the extension popup. If you uninstall the extension, your browser immediately wipes all local storage associated with Intentional YT.
          </p>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
            6. Open Source Transparency
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '14.5px', marginBottom: '14px' }}>
            Intentional YT is completely open-source under the MIT License. Anyone can inspect, audit, or build the code directly from the public GitHub repository.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a 
              href={APP_CONFIG.githubRepoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary"
            >
              <span>View Source on GitHub ↗</span>
            </a>
            <a 
              href={`${APP_CONFIG.githubRepoUrl}/blob/main/SECURITY.md`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary"
            >
              <span>Security Policy ↗</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
