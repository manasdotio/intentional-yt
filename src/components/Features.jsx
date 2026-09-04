import React from 'react'

export default function Features() {
  return (
    <section id="features" style={{ paddingTop: '40px' }}>
      <div className="section-head">
        <div className="section-eyebrow">Crafted for Deep Focus</div>
        <h2 className="section-title">Built with strict architectural principles.</h2>
        <p className="section-desc">
          Traditional blockers use slow DOM mutations that flash distracting content for a split second. Intentional YT is built fundamentally differently.
        </p>
      </div>

      <div className="bento-grid">
        {/* Card 1: Zero Flash */}
        <div className="bento-card bento-card-8">
          <div className="bento-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="bento-title">Zero-Flash Injection Engine</h3>
          <p className="bento-text">
            Styles are injected onto <code>&lt;html&gt;</code> at <code>document_start</code> before the browser renders the first pixel. You will never see a thumbnail or recommendation briefly flash onto the screen before disappearing.
          </p>
          <div className="bento-visual">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>document_start &gt; &lt;html class="yt-block-home-feed"&gt;</span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>0ms render lag</span>
            </div>
          </div>
        </div>

        {/* Card 2: 100% Local Privacy */}
        <div className="bento-card bento-card-4">
          <div className="bento-icon" style={{ background: 'var(--accent-emerald-subtle)', borderColor: 'rgba(5, 150, 105, 0.2)', color: 'var(--accent-emerald)' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="bento-title">Strict 0% Telemetry</h3>
          <p className="bento-text">
            No remote analytics, no tracking pixels, and no external network calls. All preferences stay stored strictly within your browser's local sandbox storage.
          </p>
        </div>

        {/* Card 3: Granular Distraction Matrix */}
        <div className="bento-card bento-card-4">
          <div className="bento-icon">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="bento-title">Surgical Customization</h3>
          <p className="bento-text">
            No forced all-or-nothing blocking. Keep your subscribed channels while wiping out algorithmic recommendations and Shorts everywhere.
          </p>
        </div>

        {/* Card 4: Dopamine De-stimulation */}
        <div className="bento-card bento-card-4">
          <div className="bento-icon" style={{ background: 'rgba(225, 29, 72, 0.1)', borderColor: 'rgba(225, 29, 72, 0.2)', color: 'var(--accent-red)' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="bento-title">Clickbait Neutralization</h3>
          <p className="bento-text">
            Replace screaming high-saturation thumbnails with calming placeholders while preserving critical video titles and duration tags.
          </p>
        </div>

        {/* Card 5: Mindful Time Limits */}
        <div className="bento-card bento-card-4">
          <div className="bento-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.2)', color: '#ca8a04' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="bento-title">Mindful Time Caps</h3>
          <p className="bento-text">
            Set soft interval toast reminders (15m, 30m, 45m) or a hard daily playback ceiling with automated midnight stat resets.
          </p>
        </div>
      </div>
    </section>
  )
}
