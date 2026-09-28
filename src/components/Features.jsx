import React from 'react'

export default function Features() {
  return (
    <section id="features" className="features-section">
      <div className="section-head">
        <div className="section-kicker">
          <span>✦ Designed for calm</span>
        </div>
        <h2 className="section-title">Watch YouTube without distractions</h2>
        <p className="section-desc">
          Keep tutorials and lectures within reach while reducing recommended videos, Shorts, and unplanned watch time.
        </p>
      </div>

      <div className="bento-grid">
        {/* Card 1: Zero Flash */}
        <div className="bento-card">
          <div className="bento-icon bento-icon-blue">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="bento-title">Hide YouTube Recommendations</h3>
          <p className="bento-text">
            Remove the YouTube home feed and recommended sidebar with separate controls. Keep search and subscriptions available, with blocking styles loaded early in the page load.
          </p>
          <div className="bento-card-badge">
            <span>Hide Home Feed</span>
            <span className="bento-badge-sep">&middot;</span>
            <span>Hide Sidebar</span>
          </div>
        </div>

        {/* Card 2: 100% Shorts Eradication */}
        <div className="bento-card">
          <div className="bento-icon bento-icon-red">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="3" />
              <line x1="9" y1="18" x2="15" y2="18" />
            </svg>
          </div>
          <h3 className="bento-title">YouTube Shorts Blocker</h3>
          <p className="bento-text">
            Hide YouTube Shorts from feeds, search results, channels, and the sidebar. Watch ordinary videos without browsing short-form recommendations.
          </p>
          <div className="bento-card-badge">
            <span>Home</span>
            <span className="bento-badge-sep">&middot;</span>
            <span>Search</span>
            <span className="bento-badge-sep">&middot;</span>
            <span>Sidebar</span>
            <span className="bento-badge-sep">&middot;</span>
            <span>Watch</span>
          </div>
        </div>

        {/* Card 3: Limits & Focus Lock */}
        <div className="bento-card">
          <div className="bento-icon bento-icon-purple">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 className="bento-title">Daily YouTube Time Limits</h3>
          <p className="bento-text">
            Track active playback and set a daily watch budget that pauses video at your limit. Add break reminders or a Focus Lock cooldown before changing protected settings.
          </p>
          <div className="bento-card-badge">
            <span>Soft Reminders</span>
            <span className="bento-badge-sep">&middot;</span>
            <span>Cooldown Locks</span>
          </div>
        </div>

        {/* Card 4: 100% Local Privacy */}
        <div className="bento-card">
          <div className="bento-icon bento-icon-emerald">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="bento-title">Your Data Stays Yours</h3>
          <p className="bento-text">
            Zero accounts, zero analytics beacons, and zero tracking pixels. Everything stays safely inside your local browser sandbox, exactly where it belongs.
          </p>
          <div className="bento-card-badge">
            <span>0% Telemetry</span>
            <span className="bento-badge-sep">&middot;</span>
            <span>MIT Open Source</span>
          </div>
        </div>
      </div>
    </section>
  )
}
