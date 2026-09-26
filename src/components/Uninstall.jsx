import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { APP_CONFIG, UNINSTALL_FEEDBACK_CONFIG } from '../config/constants'

const REASON_OPTIONS = [
  {
    id: 'performance',
    title: 'It slowed down YouTube or felt laggy',
    icon: '⚡',
    label: 'What felt slow? (Click tags to add or type below)',
    tags: ['Typing lag in comments', 'Video stutter on 4K/60fps', 'Initial YouTube page load', 'High browser memory']
  },
  {
    id: 'bugs',
    title: "Something broke or didn't work as expected",
    icon: '🐛',
    label: 'What glitched? (Click tags to add or type below)',
    tags: ['Shorts still appeared', 'Comments failed to load', 'Player controls issue', 'Search page problem']
  },
  {
    id: 'strict',
    title: 'Too strict or missing a toggle I needed',
    icon: '🎛️',
    label: 'Which toggle did you miss?',
    tags: ['Wanted home feed back', 'PIN lock was too strict', 'Needed quick pause', 'Sidebar missing']
  },
  {
    id: 'privacy',
    title: 'Privacy or permissions concern',
    icon: '🔒',
    label: 'Mind sharing what felt concerning?',
    tags: ['Permission scope too broad', 'Wanted local-only guarantee']
  },
  {
    id: 'not_needed',
    title: "I just don't need it anymore",
    icon: '🎯',
    label: 'Did you achieve your focus goal?',
    tags: ['Broke the habit', 'Taking a break from YouTube', 'Switched browser/device']
  },
  {
    id: 'other',
    title: 'Other reason',
    icon: '💬',
    label: 'Mind sharing what happened?',
    tags: []
  }
]

function detectBrowserInfo() {
  if (typeof navigator === 'undefined') {
    return { name: 'Chrome', storeName: 'Chrome Web Store', storeUrl: APP_CONFIG.chromeWebStoreUrl }
  }
  const ua = navigator.userAgent || ''
  if (ua.includes('Firefox')) {
    return { name: 'Firefox', storeName: 'Firefox Add-ons', storeUrl: APP_CONFIG.firefoxAddonUrl }
  }
  if (ua.includes('Edg/')) {
    return { name: 'Edge', storeName: 'Edge Add-ons (Chrome Web Store)', storeUrl: APP_CONFIG.chromeWebStoreUrl }
  }
  return { name: 'Chrome', storeName: 'Chrome Web Store', storeUrl: APP_CONFIG.chromeWebStoreUrl }
}

export default function Uninstall() {
  const { theme, toggleTheme } = useTheme()
  const [selectedReason, setSelectedReason] = useState(null)
  const [detailsText, setDetailsText] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const hasSubmittedRef = React.useRef(false)
  const [browserInfo, setBrowserInfo] = useState({
    name: 'Chrome',
    storeName: 'Chrome Web Store',
    storeUrl: APP_CONFIG.chromeWebStoreUrl
  })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.title = 'Uninstall Feedback — Intentional YT'
    setBrowserInfo(detectBrowserInfo())
  }, [])

  const sendPayload = (reasonTitle, details = '') => {
    if (!UNINSTALL_FEEDBACK_CONFIG?.formActionUrl) return

    let finalString = reasonTitle
    if (details && details.trim()) {
      finalString += ` — Details: ${details.trim()}`
    }
    finalString += ` [${browserInfo.name || 'Browser'}]`

    try {
      const formData = new URLSearchParams()
      if (UNINSTALL_FEEDBACK_CONFIG.reasonEntryId) {
        formData.append(UNINSTALL_FEEDBACK_CONFIG.reasonEntryId, finalString)
      }

      fetch(UNINSTALL_FEEDBACK_CONFIG.formActionUrl, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      }).catch(() => {})
    } catch (e) {
      // Non-blocking
    }
  }

  // Auto-send on page close if option was selected but not submitted
  useEffect(() => {
    const handleLeave = () => {
      if (selectedReason && !hasSubmittedRef.current) {
        hasSubmittedRef.current = true
        const activeOption = REASON_OPTIONS.find((r) => r.id === selectedReason)
        if (activeOption) {
          sendPayload(activeOption.title)
        }
      }
    }
    window.addEventListener('pagehide', handleLeave)
    return () => {
      window.removeEventListener('pagehide', handleLeave)
    }
  }, [selectedReason])

  const handleSelectReason = (option) => {
    setSelectedReason(option.id)
    setSelectedTags([])
    setDetailsText('')
  }

  const handleTagClick = (tag) => {
    const isSelected = selectedTags.includes(tag)
    const nextTags = isSelected
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]

    setSelectedTags(nextTags)

    let current = detailsText.trim()
    if (!isSelected) {
      setDetailsText(current ? `${current}, ${tag}` : tag)
    } else {
      const updated = current
        .replace(tag, '')
        .replace(/,\s*,/g, ',')
        .replace(/^,\s*|,\s*$/g, '')
        .trim()
      setDetailsText(updated)
    }
  }

  const handleSubmitDetails = (e) => {
    if (e) e.preventDefault()
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true

    const activeOption = REASON_OPTIONS.find((r) => r.id === selectedReason)
    if (activeOption) {
      sendPayload(activeOption.title, detailsText)
    }
    setIsSubmitted(true)
  }

  const handleSkip = () => {
    if (hasSubmittedRef.current) return
    hasSubmittedRef.current = true

    const activeOption = REASON_OPTIONS.find((r) => r.id === selectedReason)
    if (activeOption) {
      sendPayload(activeOption.title)
    }
    setIsSubmitted(true)
  }

  return (
    <div className="uninstall-screen">
      {/* Top Header */}
      <header className="uninstall-nav">
        <a href="/" className="brand" aria-label="Intentional YT Home">
          <img src="/icons/icon.svg" alt="Intentional YT Logo" className="brand-logo" width="24" height="24" />
          <span className="brand-name">Intentional YT</span>
        </a>

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label="Toggle light/dark theme"
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      {/* Main Feedback Card Container */}
      <main className="uninstall-card-wrap">
        <div className="uninstall-card">
          {!isSubmitted ? (
            <>
              <div className="uninstall-head">
                <div className="uninstall-badge">
                  <span>✦ Community Feedback</span>
                </div>
                <h1 className="uninstall-title">
                  Sorry to see you go — mind telling us why?
                </h1>
                <p className="uninstall-desc">
                  Intentional YT is free & open-source. A single click helps us fix bugs and improve focus for everyone.
                </p>
              </div>

              <div className="uninstall-options-list" role="radiogroup" aria-label="Reason for uninstalling">
                {REASON_OPTIONS.map((option) => {
                  const isSelected = selectedReason === option.id
                  return (
                    <div key={option.id} className="opt-group">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={`uninstall-opt-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectReason(option)}
                      >
                        <div className="uninstall-opt-left">
                          <span className="uninstall-opt-icon">{option.icon}</span>
                          <span className="opt-title">{option.title}</span>
                        </div>
                        <div className="uninstall-opt-radio">
                          <div className="uninstall-opt-radio-dot" />
                        </div>
                      </button>

                      {/* Progressive Follow-up Drawer */}
                      {isSelected && (
                        <div className="uninstall-drawer">
                          <span className="uninstall-drawer-label">{option.label}</span>
                          {option.tags.length > 0 && (
                            <div className="uninstall-quick-tags">
                              {option.tags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  className={`uninstall-tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                                  onClick={() => handleTagClick(tag)}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          )}
                          <form onSubmit={handleSubmitDetails} className="uninstall-drawer-form">
                            <textarea
                              className="uninstall-textarea"
                              rows="2"
                              autoFocus
                              placeholder="Any details to share? (Optional)"
                              value={detailsText}
                              onChange={(e) => setDetailsText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSubmitDetails()
                                }
                              }}
                            />
                            <div className="uninstall-form-actions">
                              <button type="button" className="uninstall-skip-btn" onClick={handleSkip}>
                                Skip & Finish
                              </button>
                              <button type="submit" className="uninstall-submit-btn">
                                Send Details →
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            /* Instant Thank-You State */
            <div className="uninstall-success-state">
              <div className="uninstall-success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="uninstall-success-title">Thank you for your feedback</h2>
              <p className="uninstall-success-desc">
                Your response has been noted. We truly appreciate the time you took trying Intentional YT.
              </p>
            </div>
          )}

          {/* Reinstall & Open Source Footer */}
          <div className="uninstall-reinstall-footer">
            <div>
              <span>Changed your mind? </span>
              <a
                href={browserInfo.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="uninstall-reinstall-link"
              >
                Reinstall from {browserInfo.storeName} ↗
              </a>
            </div>
            <a
              href={APP_CONFIG.githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-nav-link"
              style={{ fontSize: '12px' }}
            >
              Inspect source on GitHub
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
