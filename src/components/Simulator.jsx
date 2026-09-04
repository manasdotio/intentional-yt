import React, { useState } from 'react'

export default function Simulator() {
  const [controls, setControls] = useState({
    homeFeed: true,
    shorts: true,
    sidebar: false,
    thumbnails: false,
    grayscale: false,
    autoplay: true,
    comments: true
  })

  const isChaos = !controls.homeFeed && !controls.shorts && !controls.sidebar && !controls.thumbnails && !controls.grayscale
  const isZen = controls.homeFeed && controls.shorts && !controls.sidebar && !controls.thumbnails && !controls.grayscale

  const handleToggle = (key) => {
    setControls((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const setPreset = (mode) => {
    if (mode === 'chaos') {
      setControls({
        homeFeed: false,
        shorts: false,
        sidebar: false,
        thumbnails: false,
        grayscale: false,
        autoplay: false,
        comments: false
      })
    } else {
      setControls({
        homeFeed: true,
        shorts: true,
        sidebar: false,
        thumbnails: false,
        grayscale: false,
        autoplay: true,
        comments: true
      })
    }
  }

  return (
    <section id="demo" className="playground-section">
      <div className="playground-card">
        <div className="playground-header">
          <div className="playground-title-group">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Live Interactive Simulator</h3>
            <div className="status-indicator">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
              <span>Simulation Active</span>
            </div>
          </div>
          <div className="mode-switch-group">
            <button
              className={`mode-btn ${isChaos ? 'active' : ''}`}
              onClick={() => setPreset('chaos')}
            >
              Default Clutter
            </button>
            <button
              className={`mode-btn ${isZen ? 'active' : ''}`}
              onClick={() => setPreset('intentional')}
            >
              Intentional Zen
            </button>
          </div>
        </div>

        <div className="simulator-grid">
          {/* Mock YouTube Window */}
          <div
            className={`mock-yt-window ${controls.grayscale ? 'grayscale-active' : ''}`}
            id="mock-yt-window"
          >
            <div className="mock-browser-bar">
              <div className="traffic-dots">
                <span className="traffic-dot dot-red"></span>
                <span className="traffic-dot dot-yellow"></span>
                <span className="traffic-dot dot-green"></span>
              </div>
              <div className="mock-url-bar">
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>https://www.youtube.com</span>
              </div>
            </div>

            <div className="mock-yt-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" fill="none" stroke="#aaa" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '13px', color: '#fff' }}>
                  <span style={{ color: '#ff0000', fontSize: '16px' }}>▶</span> YouTube
                </div>
              </div>
              <div className="mock-yt-search">
                <span>Search intentional videos...</span>
                <svg width="14" height="14" fill="none" stroke="#777" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                  <svg width="16" height="16" fill="none" stroke="#aaa" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#444' }}></div>
              </div>
            </div>

            <div className="mock-yt-body">
              {/* Left Sidebar */}
              {!controls.sidebar && (
                <div className="mock-yt-sidebar">
                  <div className="mock-nav-item active">
                    <span>🏠</span> <span>Home</span>
                  </div>
                  {!controls.shorts && (
                    <div className="mock-nav-item">
                      <span>⚡</span> <span>Shorts</span>
                    </div>
                  )}
                  <div className="mock-nav-item">
                    <span>📺</span> <span>Subscriptions</span>
                  </div>
                  <div style={{ height: '1px', background: '#222', margin: '6px 0' }}></div>
                  <div className="mock-nav-item">
                    <span>🔥</span> <span>Trending</span>
                  </div>
                </div>
              )}

              {/* Content Stage */}
              <div className="mock-yt-content">
                {controls.homeFeed ? (
                  /* Intentional Minimal Zen View */
                  <div className="intentional-zen-view">
                    <img
                      src="/icons/icon.svg"
                      width="48"
                      height="48"
                      alt="Intentional YT Zen Icon"
                      style={{ marginBottom: '16px', opacity: 0.9 }}
                    />
                    <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#f1f5f9' }}>
                      Intentional Search Mode Active
                    </h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '320px', marginBottom: '24px' }}>
                      No infinite feed, no algorithmic rabbit holes. Search directly for what you came here to learn.
                    </p>
                    <div className="zen-search-box">
                      <svg width="16" height="16" fill="none" stroke="#60a5fa" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>
                        Calculus 3 Lecture 4: Vector Fields
                      </span>
                    </div>
                    <span className="zen-quote">"Attention is the currency of intention."</span>
                  </div>
                ) : (
                  /* Infinite Recommendations (Chaos View) */
                  <div className="yt-feed-grid">
                    <div className="yt-card">
                      <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                        <span style={{ opacity: controls.thumbnails ? 0.3 : 1 }}>😱 YOU WON'T BELIEVE THIS!</span>
                        <span className="yt-thumb-badge">12:40</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">How I Built a 10M SaaS In 48 Hours</div>
                        <div className="yt-card-sub">Algorithm Hacker • 840K views</div>
                      </div>
                    </div>

                    {!controls.shorts && (
                      <div className="yt-card">
                        <div className="yt-thumb" style={{ background: '#3b1d28' }}>
                          <span style={{ color: '#f43f5e', fontWeight: 700 }}>⚡ SHORTS SHELF</span>
                          <span className="yt-thumb-badge">0:45</span>
                        </div>
                        <div className="yt-card-info">
                          <div className="yt-card-title">Crazy Life Hacks You Must Try</div>
                          <div className="yt-card-sub">Dopamine Rush • 2.4M views</div>
                        </div>
                      </div>
                    )}

                    <div className="yt-card">
                      <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                        <span style={{ opacity: controls.thumbnails ? 0.3 : 1 }}>🔥 STOP DOING THIS NOW!</span>
                        <span className="yt-thumb-badge">18:02</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">The Ultimate Productivity Trap</div>
                        <div className="yt-card-sub">Focus Guru • 310K views</div>
                      </div>
                    </div>

                    <div className="yt-card">
                      <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                        <span style={{ opacity: controls.thumbnails ? 0.3 : 1 }}>⚠️ 99% OF PEOPLE FAIL</span>
                        <span className="yt-thumb-badge">08:15</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">Learn Deep Work in 10 Minutes</div>
                        <div className="yt-card-sub">Mastery Hub • 1.2M views</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Popup Replica Controller */}
          <div className="mock-popup-container">
            <div className="mock-popup-hd">
              <img src="/icons/icon.svg" width="18" height="18" alt="Intentional YT Icon" />
              <strong style={{ fontSize: '13px', flex: 1 }}>Intentional YT</strong>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', background: '#dcfce7', color: '#15803d', borderRadius: '12px' }}>
                Active
              </span>
            </div>

            <div className="mock-popup-scroll">
              <div className="mock-popup-sh">Feed Controls</div>

              <label className="mock-popup-row">
                <span>Hide home feed</span>
                <span className="demo-switch">
                  <input
                    type="checkbox"
                    checked={controls.homeFeed}
                    onChange={() => handleToggle('homeFeed')}
                  />
                  <span className="demo-slider"></span>
                </span>
              </label>

              <label className="mock-popup-row">
                <span>Hide Shorts</span>
                <span className="demo-switch">
                  <input
                    type="checkbox"
                    checked={controls.shorts}
                    onChange={() => handleToggle('shorts')}
                  />
                  <span className="demo-slider"></span>
                </span>
              </label>

              <label className="mock-popup-row">
                <span>Hide sidebar</span>
                <span className="demo-switch">
                  <input
                    type="checkbox"
                    checked={controls.sidebar}
                    onChange={() => handleToggle('sidebar')}
                  />
                  <span className="demo-slider"></span>
                </span>
              </label>

              <div className="mock-popup-sh">Appearance</div>

              <label className="mock-popup-row">
                <span>Hide thumbnails</span>
                <span className="demo-switch">
                  <input
                    type="checkbox"
                    checked={controls.thumbnails}
                    onChange={() => handleToggle('thumbnails')}
                  />
                  <span className="demo-slider"></span>
                </span>
              </label>

              <label className="mock-popup-row">
                <span>Grayscale mode</span>
                <span className="demo-switch">
                  <input
                    type="checkbox"
                    checked={controls.grayscale}
                    onChange={() => handleToggle('grayscale')}
                  />
                  <span className="demo-slider"></span>
                </span>
              </label>

              <div className="mock-popup-sh">Playback &amp; Social</div>

              <label className="mock-popup-row">
                <span>Disable autoplay</span>
                <span className="demo-switch">
                  <input
                    type="checkbox"
                    checked={controls.autoplay}
                    onChange={() => handleToggle('autoplay')}
                  />
                  <span className="demo-slider"></span>
                </span>
              </label>

              <label className="mock-popup-row">
                <span>Hide comments</span>
                <span className="demo-switch">
                  <input
                    type="checkbox"
                    checked={controls.comments}
                    onChange={() => handleToggle('comments')}
                  />
                  <span className="demo-slider"></span>
                </span>
              </label>
            </div>

            <div className="mock-popup-stats">
              <div className="mock-stats-label">Today's Active Watch Time</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="mock-stats-val">18 min</div>
                <span style={{ fontSize: '11px', color: '#888' }}>Cap: 45 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
