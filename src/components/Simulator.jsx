import React, { useState } from 'react'
import { APP_CONFIG } from '../config/constants'
import { useTheme } from '../context/ThemeContext'

const PRESET_HELPERS = {
  balanced: {
    title: 'Balanced · Hides feeds & suggestions',
    details: 'Blocks Home Feed, Shorts & sidebar suggestions. Leaves subscriptions & comments accessible.'
  },
  zen: {
    title: 'Zen · Maximum focus & search-only',
    details: 'Pure search utility. All feeds, comments, thumbnails and sidebars are completely hidden.'
  },
  player: {
    title: 'Video Only · Minimalist player',
    details: 'Distraction-free theatre viewing. Hides recommendations and comments around the video.'
  },
  limited: {
    title: 'Anti-Doomscroll · Calm 15-video batch',
    details: 'Limits the home feed to 15 intentional videos and blocks infinite scroll with a serene caught-up banner.'
  },
  chaos: {
    title: 'Clutter · Protections disabled',
    details: 'Standard YouTube with infinite feeds, Shorts carousels, algorithmic sidebars, and autoplay.'
  },
  custom: {
    title: 'Custom · Personalized configuration',
    details: 'Custom toggle mix. Adjust individual distraction controls in the sections below.'
  }
}

export default function Simulator() {
  const { theme: siteTheme } = useTheme()
  const [ytThemeOverride, setYtThemeOverride] = useState(null) // null = match site theme
  const effectiveYtTheme = ytThemeOverride || siteTheme

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
    if (mode === 'balanced') {
      setExtensionEnabled(true)
      setActiveTab('block')
      setControls({
        homeFeed: true,
        limitHomeFeed: false,
        subscriptions: false,
        sidebar: true,
        shorts: true,
        thumbnails: false,
        grayscale: false,
        autoplay: true,
        comments: false
      })
    } else if (mode === 'chaos') {
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
          {/* Mock YouTube Window (Theme-Aware & Highly Authentic) */}
          <div
            className={`mock-yt-window ${effectiveYtTheme === 'light' ? 'yt-theme-light' : 'yt-theme-dark'} ${extensionEnabled && controls.grayscale ? 'grayscale-active' : ''}`}
            id="mock-yt-window"
          >
            {/* Mock Browser Title Bar */}
            <div className="mock-browser-bar">
              <div className="mock-browser-bar-left">
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

              {/* YouTube Theme Switcher (Light / Dark) */}
              <button
                type="button"
                className="mock-yt-theme-btn"
                onClick={() => setYtThemeOverride(effectiveYtTheme === 'dark' ? 'light' : 'dark')}
                title={`Switch YouTube to ${effectiveYtTheme === 'dark' ? 'Light' : 'Dark'} Theme`}
              >
                {effectiveYtTheme === 'dark' ? (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>

            {/* YouTube Authentic Header */}
            <div className="mock-yt-header">
              <div className="mock-yt-header-left">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mock-yt-hamburger">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <div className="mock-yt-brand">
                  <span className="mock-yt-logo-badge">▶</span>
                  <span>YouTube</span>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--yt-text-muted)', marginLeft: '-2px' }}>US</span>
                </div>
              </div>

              {/* YouTube Search Bar */}
              <div className="mock-yt-search-container">
                <div className="mock-yt-search">
                  <span className="mock-yt-search-text">
                    {extensionEnabled && controls.homeFeed ? 'Calculus 3 Lecture 4: Vector Fields' : 'Search'}
                  </span>
                  <button type="button" className="mock-yt-search-btn" title="Search">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                <button type="button" className="mock-yt-mic-btn" title="Search with your voice">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              </div>

              <div className="mock-yt-header-right">
                <div className="mock-yt-header-icon" title="Create">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="mock-yt-header-icon" title="Notifications">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {!extensionEnabled && <span className="mock-yt-notif-dot">9+</span>}
                </div>
                <div className="mock-yt-avatar">J</div>
              </div>
            </div>

            {/* YouTube Body */}
            <div className="mock-yt-body">
              {/* Left Sidebar */}
              {(!extensionEnabled || !controls.sidebar) && (
                <div className="mock-yt-sidebar">
                  <div className="mock-nav-item active">
                    <span className="mock-nav-icon">🏠</span>
                    <span>Home</span>
                  </div>
                  {(!extensionEnabled || !controls.shorts) && (
                    <div className="mock-nav-item">
                      <span className="mock-nav-icon" style={{ color: '#ff0000' }}>⚡</span>
                      <span>Shorts</span>
                    </div>
                  )}
                  {(!extensionEnabled || !controls.subscriptions) && (
                    <div className="mock-nav-item">
                      <span className="mock-nav-icon">📺</span>
                      <span>Subscriptions</span>
                    </div>
                  )}
                  <div className="mock-nav-divider"></div>
                  <div className="mock-nav-item">
                    <span className="mock-nav-icon">📁</span>
                    <span>You</span>
                  </div>
                  <div className="mock-nav-item">
                    <span className="mock-nav-icon">🕒</span>
                    <span>History</span>
                  </div>
                  <div className="mock-nav-divider"></div>
                  <div className="mock-nav-heading">Subscriptions</div>
                  <div className="mock-sub-row">
                    <span className="mock-sub-avatar" style={{ background: '#3b82f6' }}></span>
                    <span>3Blue1Brown</span>
                  </div>
                  <div className="mock-sub-row">
                    <span className="mock-sub-avatar" style={{ background: '#10b981' }}></span>
                    <span>Veritasium</span>
                  </div>
                  <div className="mock-sub-row">
                    <span className="mock-sub-avatar" style={{ background: '#f59e0b' }}></span>
                    <span>Fireship</span>
                  </div>
                </div>
              )}

              {/* Content Stage */}
              <div className="mock-yt-content">
                {/* Intentional Zen View */}
                {extensionEnabled && controls.homeFeed ? (
                  <div className="intentional-zen-view">
                    <img
                      src="/icons/icon.svg"
                      width="48"
                      height="48"
                      alt="Intentional YT Zen Icon"
                      style={{ marginBottom: '16px', opacity: 0.95 }}
                    />
                    <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--yt-text-primary)' }}>
                      Intentional Search Mode Active
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--yt-text-secondary)', maxWidth: '340px', marginBottom: '22px' }}>
                      No infinite recommendations or clickbait traps. Search directly for the topic you came here to learn.
                    </p>
                    <div className="zen-search-box">
                      <svg width="16" height="16" fill="none" stroke="var(--accent-blue)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>
                        Calculus 3 Lecture 4: Vector Fields
                      </span>
                    </div>
                    <span className="zen-quote">"Attention is the currency of intention."</span>
                  </div>
                ) : (
                  <>
                    {/* YouTube Filter Chips */}
                    <div className="yt-chips-bar">
                      <span className="yt-chip active">All</span>
                      <span className="yt-chip">Deep Work</span>
                      <span className="yt-chip">Calculus</span>
                      <span className="yt-chip">Computer Science</span>
                      <span className="yt-chip">Physics</span>
                      <span className="yt-chip">Podcasts</span>
                    </div>

                    {/* Feed Content */}
                    <div className="yt-feed-grid">
                      {!extensionEnabled ? (
                        /* Default Clutter / Chaos View */
                        <>
                          <div className="yt-card">
                            <div className="yt-thumb" style={{ background: 'linear-gradient(135deg, #450a0a, #7f1d1d)' }}>
                              <span style={{ color: '#fca5a5', fontWeight: 700 }}>😱 YOU WON'T BELIEVE THIS!</span>
                              <span className="yt-thumb-badge">12:40</span>
                            </div>
                            <div className="yt-card-body">
                              <div className="yt-channel-avatar" style={{ background: '#dc2626' }}>AH</div>
                              <div className="yt-card-info">
                                <div className="yt-card-title">How I Built a 10M SaaS In 48 Hours</div>
                                <div className="yt-card-channel">Algorithm Hacker • 8.4M views</div>
                              </div>
                            </div>
                          </div>

                          {/* Clutter Shorts Shelf */}
                          <div className="yt-shorts-shelf">
                            <div className="yt-shorts-header">
                              <span className="yt-shorts-badge">⚡</span>
                              <span className="yt-shorts-title">Shorts</span>
                            </div>
                            <div className="yt-shorts-grid">
                              <div className="yt-short-card">
                                <span className="yt-short-badge">0:45</span>
                                <div className="yt-short-title">Crazy 10-Second Life Hacks You Must Try</div>
                              </div>
                              <div className="yt-short-card">
                                <span className="yt-short-badge">0:30</span>
                                <div className="yt-short-title">Never drink water like this 💀</div>
                              </div>
                              <div className="yt-short-card">
                                <span className="yt-short-badge">0:58</span>
                                <div className="yt-short-title">Top 5 Hidden Phone Tricks in 2026</div>
                              </div>
                            </div>
                          </div>

                          <div className="yt-card">
                            <div className="yt-thumb" style={{ background: 'linear-gradient(135deg, #7c2d12, #c2410c)' }}>
                              <span style={{ color: '#fed7aa', fontWeight: 700 }}>🔥 STOP DOING THIS NOW!</span>
                              <span className="yt-thumb-badge">18:02</span>
                            </div>
                            <div className="yt-card-body">
                              <div className="yt-channel-avatar" style={{ background: '#ea580c' }}>FG</div>
                              <div className="yt-card-info">
                                <div className="yt-card-title">The Ultimate Productivity Trap That Ruins Focus</div>
                                <div className="yt-card-channel">Focus Guru • 3.1M views</div>
                              </div>
                            </div>
                          </div>

                          <div className="yt-card">
                            <div className="yt-thumb" style={{ background: 'linear-gradient(135deg, #713f12, #ca8a04)' }}>
                              <span style={{ color: '#fef08a', fontWeight: 700 }}>⚠️ 99% OF PEOPLE FAIL</span>
                              <span className="yt-thumb-badge">08:15</span>
                            </div>
                            <div className="yt-card-body">
                              <div className="yt-channel-avatar" style={{ background: '#ca8a04' }}>MH</div>
                              <div className="yt-card-info">
                                <div className="yt-card-title">Learn Deep Work in 10 Minutes Before It's Gone</div>
                                <div className="yt-card-channel">Mastery Hub • 4.8M views</div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Mindful / Intentional Feed (Anti-Doomscroll or Filtered) */
                        <>
                          <div className="yt-card">
                            <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                              {controls.thumbnails ? (
                                <span style={{ opacity: 0.6 }}>Focus Placeholder</span>
                              ) : (
                                <span>🧠 4 Hours of Unbroken Focus</span>
                              )}
                              <span className="yt-thumb-badge">18:45</span>
                            </div>
                            <div className="yt-card-body">
                              <div className="yt-channel-avatar" style={{ background: '#10b981' }}>V</div>
                              <div className="yt-card-info">
                                <div className="yt-card-title">How to Build 4 Hours of Unbroken Focus Every Day</div>
                                <div className="yt-card-channel">Veritasium ✓</div>
                                <div className="yt-card-meta">1.4M views • 3 days ago</div>
                              </div>
                            </div>
                          </div>

                          <div className="yt-card">
                            <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                              {controls.thumbnails ? (
                                <span style={{ opacity: 0.6 }}>Focus Placeholder</span>
                              ) : (
                                <span>📐 Vector Fields &amp; Flux</span>
                              )}
                              <span className="yt-thumb-badge">24:10</span>
                            </div>
                            <div className="yt-card-body">
                              <div className="yt-channel-avatar" style={{ background: '#3b82f6' }}>3B</div>
                              <div className="yt-card-info">
                                <div className="yt-card-title">The Intuition Behind Vector Fields &amp; Fluid Flow</div>
                                <div className="yt-card-channel">3Blue1Brown ✓</div>
                                <div className="yt-card-meta">890K views • 1 week ago</div>
                              </div>
                            </div>
                          </div>

                          <div className="yt-card">
                            <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                              {controls.thumbnails ? (
                                <span style={{ opacity: 0.6 }}>Focus Placeholder</span>
                              ) : (
                                <span>⚡ Systems With Zero Dependencies</span>
                              )}
                              <span className="yt-thumb-badge">31:15</span>
                            </div>
                            <div className="yt-card-body">
                              <div className="yt-channel-avatar" style={{ background: '#f59e0b' }}>FS</div>
                              <div className="yt-card-info">
                                <div className="yt-card-title">Designing Distributed Systems with Zero Dependencies</div>
                                <div className="yt-card-channel">Fireship ✓</div>
                                <div className="yt-card-meta">420K views • 5 days ago</div>
                              </div>
                            </div>
                          </div>

                          <div className="yt-card">
                            <div className={`yt-thumb ${controls.thumbnails ? 'yt-thumb-placeholder' : ''}`}>
                              {controls.thumbnails ? (
                                <span style={{ opacity: 0.6 }}>Focus Placeholder</span>
                              ) : (
                                <span>🌿 Digital Detox &amp; Calm</span>
                              )}
                              <span className="yt-thumb-badge">14:02</span>
                            </div>
                            <div className="yt-card-body">
                              <div className="yt-channel-avatar" style={{ background: '#8b5cf6' }}>AA</div>
                              <div className="yt-card-info">
                                <div className="yt-card-title">Why Leaving Algorithmic Feeds Restored My Attention Span</div>
                                <div className="yt-card-channel">Ali Abdaal ✓</div>
                                <div className="yt-card-meta">680K views • 2 weeks ago</div>
                              </div>
                            </div>
                          </div>

                          {/* Anti-Doomscroll Calm Caught-up Banner */}
                          {controls.limitHomeFeed && (
                            <div className="calm-end-banner">
                              <div className="calm-end-badge">✦ You're all caught up</div>
                              <div className="calm-end-text">Home feed limit active • Infinite scroll blocked</div>
                              <p className="calm-end-sub">Take a deep breath, or search directly for what you came here to learn.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
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
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
                        <option value="balanced">Balanced</option>
                        <option value="zen">Zen</option>
                        <option value="player">Video Only</option>
                        <option value="limited">Anti-Doomscroll</option>
                        <option value="chaos">Clutter (Off)</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {/* Preset Mode Active Helper Banner */}
                    <div className="mock-preset-helper-card">
                      <div className="mock-preset-helper-icon">
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </div>
                      <div className="mock-preset-helper-info">
                        <span className="mock-preset-helper-title">{PRESET_HELPERS[selectedPreset]?.title || 'Preset Active'}</span>
                        <span className="mock-preset-helper-details">{PRESET_HELPERS[selectedPreset]?.details || ''}</span>
                      </div>
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
              <span>{APP_CONFIG.version ? `v${APP_CONFIG.version}` : 'v2.2.0'}</span>
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
