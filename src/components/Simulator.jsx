import React, { useState } from 'react'
import { APP_CONFIG } from '../config/constants'

export default function Simulator() {
  const [extensionEnabled, setExtensionEnabled] = useState(true)
  const [activeTab, setActiveTab] = useState('block') // 'block' | 'filters' | 'focus' | 'stats' | 'settings'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('zen')
  const [toastMessage, setToastMessage] = useState('')

  const [controls, setControls] = useState({
    homeFeed: true,
    limitHomeFeed: false,
    subscriptions: false,
    sidebar: false,
    shorts: true,
    thumbnails: false,
    grayscale: false,
    autoplay: true,
    comments: false
  })

  // Simulated focus settings
  const [softReminder, setSoftReminder] = useState(true)
  const [dailyLimit, setDailyLimit] = useState(true)
  const [focusLock, setFocusLock] = useState(false)
  const [scheduledFocus, setScheduledFocus] = useState(false)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2200)
  }

  const handleToggle = (key) => {
    setControls((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      // Enforce mutual exclusivity between hiding home feed and limiting home feed
      if (key === 'homeFeed' && next.homeFeed) {
        next.limitHomeFeed = false
      } else if (key === 'limitHomeFeed' && next.limitHomeFeed) {
        next.homeFeed = false
      }
      return next
    })
    setSelectedPreset('custom')
  }

  const setPreset = (mode) => {
    setSelectedPreset(mode)
    if (mode === 'chaos') {
      setExtensionEnabled(false)
      setControls({
        homeFeed: false,
        limitHomeFeed: false,
        subscriptions: false,
        sidebar: false,
        shorts: false,
        thumbnails: false,
        grayscale: false,
        autoplay: false,
        comments: false
      })
    } else if (mode === 'limited') {
      setExtensionEnabled(true)
      setActiveTab('block')
      setControls({
        homeFeed: false,
        limitHomeFeed: true,
        subscriptions: false,
        sidebar: false,
        shorts: true,
        thumbnails: false,
        grayscale: false,
        autoplay: true,
        comments: false
      })
    } else if (mode === 'player') {
      setExtensionEnabled(true)
      setActiveTab('block')
      setControls({
        homeFeed: true,
        limitHomeFeed: false,
        subscriptions: true,
        sidebar: true,
        shorts: true,
        thumbnails: true,
        grayscale: false,
        autoplay: true,
        comments: true
      })
    } else {
      // Zen
      setExtensionEnabled(true)
      setActiveTab('block')
      setControls({
        homeFeed: true,
        limitHomeFeed: false,
        subscriptions: false,
        sidebar: false,
        shorts: true,
        thumbnails: false,
        grayscale: false,
        autoplay: true,
        comments: true
      })
    }
  }

  // Active state flags for UI
  const isChaos = !extensionEnabled || (!controls.homeFeed && !controls.limitHomeFeed && !controls.shorts && !controls.sidebar && !controls.thumbnails && !controls.grayscale)
  const isLimited = extensionEnabled && !controls.homeFeed && controls.limitHomeFeed
  const isZen = extensionEnabled && controls.homeFeed && !controls.limitHomeFeed && !controls.sidebar && !controls.thumbnails
  const isPlayer = extensionEnabled && controls.sidebar && controls.thumbnails

  // Search filter helper
  const filterMatches = (text, keywords = '') => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return text.toLowerCase().includes(q) || keywords.toLowerCase().includes(q)
  }

  return (
    <section id="demo" className="playground-section">
      <div className="playground-card">
        <div className="playground-header">
          <div className="playground-title-group">
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Live Interactive Simulator</h3>
            <div className="status-indicator">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: extensionEnabled ? 'currentColor' : '#ef4444' }}></span>
              <span>{extensionEnabled ? 'Simulation Active' : 'Extension Disabled'}</span>
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
              className={`mode-btn ${isLimited ? 'active' : ''}`}
              onClick={() => setPreset('limited')}
            >
              Anti-Doomscroll
            </button>
            <button
              className={`mode-btn ${isZen ? 'active' : ''}`}
              onClick={() => setPreset('zen')}
            >
              Intentional Zen
            </button>
            <button
              className={`mode-btn ${isPlayer ? 'active' : ''}`}
              onClick={() => setPreset('player')}
            >
              Video Only
            </button>
          </div>
        </div>

        <div className="simulator-grid">
          {/* Mock YouTube Window */}
          <div
            className={`mock-yt-window ${extensionEnabled && controls.grayscale ? 'grayscale-active' : ''}`}
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
              <div className="mock-yt-header-left">
                <svg width="20" height="20" fill="none" stroke="#aaa" viewBox="0 0 24 24" className="mock-yt-hamburger">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <div className="mock-yt-brand">
                  <span style={{ color: '#ff0000', fontSize: '16px' }}>▶</span> YouTube
                </div>
              </div>
              <div className="mock-yt-search">
                <span className="mock-yt-search-text">
                  {extensionEnabled && controls.homeFeed ? 'Calculus 3 Lecture 4: Vector Fields' : 'Search videos...'}
                </span>
                <svg width="14" height="14" fill="none" stroke="#777" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="mock-yt-header-right">
                <div className="mock-yt-bell">
                  <svg width="16" height="16" fill="none" stroke="#aaa" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="mock-yt-avatar"></div>
              </div>
            </div>

            <div className="mock-yt-body">
              {/* Left Sidebar */}
              {(!extensionEnabled || !controls.sidebar) && (
                <div className="mock-yt-sidebar">
                  <div className="mock-nav-item active">
                    <span>🏠</span> <span>Home</span>
                  </div>
                  {(!extensionEnabled || !controls.shorts) && (
                    <div className="mock-nav-item">
                      <span>⚡</span> <span>Shorts</span>
                    </div>
                  )}
                  {(!extensionEnabled || !controls.subscriptions) && (
                    <div className="mock-nav-item">
                      <span>📺</span> <span>Subscriptions</span>
                    </div>
                  )}
                  <div style={{ height: '1px', background: '#222', margin: '6px 0' }}></div>
                  <div className="mock-nav-item">
                    <span>🔥</span> <span>Trending</span>
                  </div>
                </div>
              )}

              {/* Content Stage */}
              <div className="mock-yt-content">
                {!extensionEnabled ? (
                  /* YouTube Default Clutter View (When extension is toggled OFF) */
                  <div className="yt-feed-grid">
                    <div className="yt-card">
                      <div className="yt-thumb">
                        <span>😱 YOU WON'T BELIEVE THIS!</span>
                        <span className="yt-thumb-badge">12:40</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">How I Built a 10M SaaS In 48 Hours</div>
                        <div className="yt-card-sub">Algorithm Hacker • 840K views</div>
                      </div>
                    </div>

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

                    <div className="yt-card">
                      <div className="yt-thumb">
                        <span>🔥 STOP DOING THIS NOW!</span>
                        <span className="yt-thumb-badge">18:02</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">The Ultimate Productivity Trap</div>
                        <div className="yt-card-sub">Focus Guru • 310K views</div>
                      </div>
                    </div>

                    <div className="yt-card">
                      <div className="yt-thumb">
                        <span>⚠️ 99% OF PEOPLE FAIL</span>
                        <span className="yt-thumb-badge">08:15</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">Learn Deep Work in 10 Minutes</div>
                        <div className="yt-card-sub">Mastery Hub • 1.2M views</div>
                      </div>
                    </div>
                  </div>
                ) : controls.homeFeed ? (
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
                ) : controls.limitHomeFeed ? (
                  /* Anti-Doomscroll Limited Feed (15 Videos Max + Calm Caught-up Banner) */
                  <div className="yt-feed-grid">
                    <div className="yt-card">
                      <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                        <span style={{ opacity: controls.thumbnails ? 0.3 : 1 }}>🧠 DEEP WORK HABITS</span>
                        <span className="yt-thumb-badge">18:45</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">How to Build 4 Hours of Unbroken Focus Every Day</div>
                        <div className="yt-card-sub">Mindful Creator • 420K views</div>
                      </div>
                    </div>

                    <div className="yt-card">
                      <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                        <span style={{ opacity: controls.thumbnails ? 0.3 : 1 }}>📐 VECTOR CALCULUS</span>
                        <span className="yt-thumb-badge">24:10</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">Multivariable Calculus: Intuition Behind Vector Fields</div>
                        <div className="yt-card-sub">Academic Hub • 180K views</div>
                      </div>
                    </div>

                    <div className="yt-card">
                      <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                        <span style={{ opacity: controls.thumbnails ? 0.3 : 1 }}>⚡ SYSTEM ARCHITECTURE</span>
                        <span className="yt-thumb-badge">31:15</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">Designing Distributed Systems with Zero Dependencies</div>
                        <div className="Tech Lead">Tech Lead • 95K views</div>
                      </div>
                    </div>

                    <div className="yt-card">
                      <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                        <span style={{ opacity: controls.thumbnails ? 0.3 : 1 }}>🌿 DIGITAL DETOX</span>
                        <span className="yt-thumb-badge">14:02</span>
                      </div>
                      <div className="yt-card-info">
                        <div className="yt-card-title">Why Leaving Algorithmic Feeds Restored My Attention Span</div>
                        <div className="yt-card-sub">Slow Living • 310K views</div>
                      </div>
                    </div>

                    {/* Calm End of Feed Banner */}
                    <div className="calm-end-banner">
                      <div className="calm-end-badge">✦ You're all caught up</div>
                      <div className="calm-end-text">Home feed limit active • Infinite scroll blocked</div>
                      <p className="calm-end-sub">Take a breath, or search directly for what you came here to learn.</p>
                    </div>
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

          {/* Realistic Modern MV3 Extension Popup Replica */}
          <div className="mock-popup-container">
            {/* Popup Header */}
            <div className="mock-popup-hd">
              <div className="mock-popup-hd-left">
                <img src="/icons/icon.svg" width="18" height="18" alt="Intentional YT Icon" />
                <span className="mock-popup-title">Intentional YT</span>
                <span className={`mock-ext-badge ${extensionEnabled ? 'active' : 'inactive'}`}>
                  <span className="mock-badge-dot"></span>
                  <span>{extensionEnabled ? 'Active' : 'Off'}</span>
                </span>
              </div>
              <div className="mock-master-switch-wrap">
                <span className="demo-switch">
                  <input
                    type="checkbox"
                    checked={extensionEnabled}
                    onChange={() => {
                      const next = !extensionEnabled
                      setExtensionEnabled(next)
                      showToast(next ? 'Intentional YT Enabled' : 'Intentional YT Disabled')
                    }}
                    title="Toggle Extension Power"
                  />
                  <span className="demo-slider"></span>
                </span>
              </div>
            </div>

            {/* Sidebar Navigation Layout */}
            <div className="mock-popup-layout">
              {/* Sidebar Tabs */}
              <nav className="mock-sidebar-nav" aria-label="Extension Tabs">
                <button
                  type="button"
                  className={`mock-nav-tab-btn ${activeTab === 'block' ? 'active' : ''}`}
                  onClick={() => setActiveTab('block')}
                  title="Block Toggles"
                >
                  <svg className="mock-nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Block</span>
                </button>

                <button
                  type="button"
                  className={`mock-nav-tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
                  onClick={() => setActiveTab('filters')}
                  title="Content Filters Roadmap"
                >
                  <svg className="mock-nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  <span>Filters</span>
                </button>

                <button
                  type="button"
                  className={`mock-nav-tab-btn ${activeTab === 'focus' ? 'active' : ''}`}
                  onClick={() => setActiveTab('focus')}
                  title="Focus & Limits"
                >
                  <svg className="mock-nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Focus</span>
                </button>

                <button
                  type="button"
                  className={`mock-nav-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                  title="Daily Watch Stats"
                >
                  <svg className="mock-nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span>Stats</span>
                </button>

                <button
                  type="button"
                  className={`mock-nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                  title="Settings & Reviews"
                >
                  <svg className="mock-nav-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Settings</span>
                </button>
              </nav>

              {/* Tab Panels */}
              <div className="mock-content-area">
                {/* ── TAB 1: BLOCK ──────────────────────────────── */}
                {activeTab === 'block' && (
                  <div className="mock-tab-panel">
                    {/* Live Search & Preset Selector */}
                    <div className="mock-search-filter-card">
                      <div className="mock-search-box">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                          type="text"
                          className="mock-search-input"
                          placeholder="Search 20+ toggles..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <select
                        className="mock-preset-dropdown"
                        value={selectedPreset}
                        onChange={(e) => setPreset(e.target.value)}
                        title="Focus Preset"
                      >
                        <option value="zen">Zen</option>
                        <option value="limited">Anti-Doomscroll</option>
                        <option value="player">Video Only</option>
                        <option value="chaos">Clutter (Off)</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {/* Section: Feed */}
                    <div className="mock-accordion-sec">
                      <div className="mock-sec-title">Feed Controls</div>

                      {filterMatches('Hide home feed', 'recommendations algorithmic homepage') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">Hide home feed</span>
                            <span className="mock-toggle-desc">Hides recommendation feeds on homepage</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.homeFeed}
                              onChange={() => handleToggle('homeFeed')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}

                      {filterMatches('Limit home feed', 'anti-doomscroll 15 videos infinite scroll') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">
                              <span>Limit home feed</span>
                              <span className="mock-badge-tag">NEW</span>
                            </span>
                            <span className="mock-toggle-desc">Caps home feed to 15 calm videos &amp; stops scroll</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.limitHomeFeed}
                              onChange={() => handleToggle('limitHomeFeed')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}

                      {filterMatches('Hide subscriptions', 'subs channels') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">Hide subscriptions</span>
                            <span className="mock-toggle-desc">Suppresses the subscriptions feed grid</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.subscriptions}
                              onChange={() => handleToggle('subscriptions')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}

                      {filterMatches('Hide recommended sidebar', 'up next watch suggestions') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">Hide recommended sidebar</span>
                            <span className="mock-toggle-desc">Strips the infinite sidebar on video pages</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.sidebar}
                              onChange={() => handleToggle('sidebar')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Section: Shorts */}
                    <div className="mock-accordion-sec">
                      <div className="mock-sec-title">Shorts Suppression</div>
                      {filterMatches('Hide Shorts everywhere', 'reels tiktok vertical video') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">Hide Shorts everywhere</span>
                            <span className="mock-toggle-desc">Deep suppression in feeds, sidebar, and search</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.shorts}
                              onChange={() => handleToggle('shorts')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Section: Appearance */}
                    <div className="mock-accordion-sec">
                      <div className="mock-sec-title">Appearance &amp; Dopamine</div>
                      {filterMatches('Neutralize thumbnails', 'clickbait images covers') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">Neutralize thumbnails</span>
                            <span className="mock-toggle-desc">Replaces screaming thumbnails with calm cards</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.thumbnails}
                              onChange={() => handleToggle('thumbnails')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}

                      {filterMatches('Grayscale mode', 'monochrome black and white') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">Grayscale mode</span>
                            <span className="mock-toggle-desc">Hardware-accelerated black-and-white filter</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.grayscale}
                              onChange={() => handleToggle('grayscale')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}

                      {filterMatches('Disable autoplay', 'pause automatically') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">Disable autoplay</span>
                            <span className="mock-toggle-desc">Prevents videos from auto-advancing</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.autoplay}
                              onChange={() => handleToggle('autoplay')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}

                      {filterMatches('Hide comments', 'discussions community') && (
                        <label className="mock-toggle-row">
                          <div className="mock-toggle-info">
                            <span className="mock-toggle-label">Hide comments</span>
                            <span className="mock-toggle-desc">Wipes out comment threads below videos</span>
                          </div>
                          <span className="demo-switch">
                            <input
                              type="checkbox"
                              checked={controls.comments}
                              onChange={() => handleToggle('comments')}
                            />
                            <span className="demo-slider"></span>
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* ── TAB 2: FILTERS (ROADMAP PREVIEW) ─────────── */}
                {activeTab === 'filters' && (
                  <div className="mock-tab-panel">
                    <div className="mock-filters-card">
                      <div className="mock-filters-pill">
                        <span className="mock-badge-dot"></span>
                        <span>In Development</span>
                      </div>
                      <h4 className="mock-filters-title">Custom Content Filters</h4>
                      <p className="mock-filters-sub">
                        Client-side rules to filter out unwanted creators, clickbait topics, and spoiler channels.
                      </p>
                      <div className="mock-filters-list">
                        <div className="mock-filters-item">
                          <span>🚫</span>
                          <div>
                            <strong>Channel Muting</strong>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Mute specific YouTube creators across all feeds.</div>
                          </div>
                        </div>
                        <div className="mock-filters-item">
                          <span>🔍</span>
                          <div>
                            <strong>Keyword Blocking</strong>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Hide videos with blocked words or spoilers in titles.</div>
                          </div>
                        </div>
                        <div className="mock-filters-item">
                          <span>⚡</span>
                          <div>
                            <strong>In-Page Quick Mute</strong>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>One-click mute directly from YouTube's 3-dot menu.</div>
                          </div>
                        </div>
                      </div>
                      <div className="mock-filters-ft">
                        <span>100% Local · Zero Telemetry</span>
                        <a
                          href={APP_CONFIG.feedbackFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-blue)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          Suggest ideas ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: FOCUS (LIMITS & LOCK) ─────────────── */}
                {activeTab === 'focus' && (
                  <div className="mock-tab-panel">
                    {/* Time Limits */}
                    <div className="mock-focus-card">
                      <div className="mock-focus-card-hd">
                        <div className="mock-focus-hd-left">
                          <span className="mock-focus-icon icon-purple">⏱️</span>
                          <span>Time &amp; Limits</span>
                        </div>
                        <span className="mock-badge-tag">Active</span>
                      </div>
                      <label className="mock-toggle-row" style={{ margin: '4px 0' }}>
                        <div className="mock-toggle-info">
                          <span className="mock-toggle-label">Soft break nudges</span>
                          <span className="mock-toggle-desc">Gentle floating toast every 15m</span>
                        </div>
                        <span className="demo-switch">
                          <input
                            type="checkbox"
                            checked={softReminder}
                            onChange={() => setSoftReminder(!softReminder)}
                          />
                          <span className="demo-slider"></span>
                        </span>
                      </label>
                      <label className="mock-toggle-row" style={{ margin: '4px 0' }}>
                        <div className="mock-toggle-info">
                          <span className="mock-toggle-label">Daily playback limit</span>
                          <span className="mock-toggle-desc">Lock player after 45 min</span>
                        </div>
                        <span className="demo-switch">
                          <input
                            type="checkbox"
                            checked={dailyLimit}
                            onChange={() => setDailyLimit(!dailyLimit)}
                          />
                          <span className="demo-slider"></span>
                        </span>
                      </label>
                    </div>

                    {/* Focus Lock */}
                    <div className="mock-focus-card">
                      <div className="mock-focus-card-hd">
                        <div className="mock-focus-hd-left">
                          <span className="mock-focus-icon icon-amber">🔒</span>
                          <span>Focus Lock Shield</span>
                        </div>
                        <span className={`mock-ext-badge ${focusLock ? 'active' : 'inactive'}`}>
                          {focusLock ? 'Armed' : 'Off'}
                        </span>
                      </div>
                      <label className="mock-toggle-row" style={{ margin: '4px 0' }}>
                        <div className="mock-toggle-info">
                          <span className="mock-toggle-label">Cooldown delay</span>
                          <span className="mock-toggle-desc">Require 10m pause before turning off rules</span>
                        </div>
                        <span className="demo-switch">
                          <input
                            type="checkbox"
                            checked={focusLock}
                            onChange={() => {
                              setFocusLock(!focusLock)
                              showToast(!focusLock ? 'Focus Lock Enabled (10m delay)' : 'Focus Lock Disabled')
                            }}
                          />
                          <span className="demo-slider"></span>
                        </span>
                      </label>
                    </div>

                    {/* Scheduled Focus */}
                    <div className="mock-focus-card">
                      <div className="mock-focus-card-hd">
                        <div className="mock-focus-hd-left">
                          <span className="mock-focus-icon icon-indigo">📅</span>
                          <span>Weekly Schedule</span>
                        </div>
                        <span className={`mock-ext-badge ${scheduledFocus ? 'active' : 'inactive'}`}>
                          {scheduledFocus ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Work Hours: Mon–Fri, 09:00 – 17:00
                      </div>
                      <div className="mock-day-chips">
                        <span className="mock-day-chip active">Mon</span>
                        <span className="mock-day-chip active">Tue</span>
                        <span className="mock-day-chip active">Wed</span>
                        <span className="mock-day-chip active">Thu</span>
                        <span className="mock-day-chip active">Fri</span>
                        <span className="mock-day-chip">Sat</span>
                        <span className="mock-day-chip">Sun</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: STATS ─────────────────────────────── */}
                {activeTab === 'stats' && (
                  <div className="mock-tab-panel">
                    <div className="mock-stats-box">
                      <div className="mock-stats-metric">
                        <div>
                          <div style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            Active Watch Time Today
                          </div>
                          <div className="mock-stats-num">18 min</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Daily Ceiling: <strong>45 min</strong>
                        </div>
                      </div>

                      <div className="mock-progress-track">
                        <div className="mock-progress-fill" style={{ width: '40%' }}></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                        <span>🔥 3-Day Focus Streak</span>
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>~1h 15m Saved</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => showToast('Daily stats reset to 0 min')}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '11.5px', marginTop: '6px' }}
                      >
                        Reset Daily Counter
                      </button>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: SETTINGS ──────────────────────────── */}
                {activeTab === 'settings' && (
                  <div className="mock-tab-panel">
                    {/* Hero Rating Card */}
                    <div className="mock-settings-hero">
                      <div className="mock-stars">★★★★★</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        Rate Intentional YT
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                        Help more students and makers escape algorithmic rabbit holes.
                      </p>
                      <a
                        href={APP_CONFIG.chromeWebStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mock-rate-btn"
                        style={{ textDecoration: 'none' }}
                      >
                        Rate on Extension Store ↗
                      </a>
                    </div>

                    {/* Shortcuts card */}
                    <div className="mock-focus-card">
                      <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                        Keyboard Shortcuts
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Toggle Extension</span>
                        <kbd style={{ background: 'var(--surface-hover)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>Alt + Y</kbd>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Focus Search</span>
                        <kbd style={{ background: 'var(--surface-hover)', padding: '1px 5px', borderRadius: '4px', border: '1px solid var(--border)' }}>/</kbd>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Popup Footer */}
            <div className="mock-popup-ft">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>100% Local · Zero Telemetry</span>
              </span>
              <span>{APP_CONFIG.version ? `v${APP_CONFIG.version}` : 'v2.1.2'}</span>
            </div>
          </div>
        </div>

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--text-primary)',
            color: 'var(--bg)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </section>
  )
}
