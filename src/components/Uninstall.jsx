'use client'

import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { APP_CONFIG, UNINSTALL_FEEDBACK_CONFIG } from '../config/constants'

const REASON_OPTIONS = [
  {
    id: 'performance',
    title: 'It slowed down YouTube or felt laggy',
    icon: '⚡',
    label: 'What felt slow?',
    tags: ['Typing lag in comments', 'Video stutter on 4K/60fps', 'Initial YouTube page load', 'High browser memory']
  },
  {
    id: 'bugs',
    title: "Blocking didn't work reliably",
    icon: '🐛',
    label: 'What was not working?',
    tags: ['Shorts still appeared', 'Comments failed to load', 'Player controls issue', 'Search page problem']
  },
  {
    id: 'strict',
    title: 'It hid something I wanted to see',
    icon: '🎛️',
    label: 'What did you want to keep visible?',
    tags: ['Home feed', 'Recommended videos', 'Comments', 'Shorts']
  },
  {
    id: 'configuration',
    title: 'It was difficult to configure',
    icon: '⚙️',
    label: 'What was difficult to set up or change?',
    tags: ['Too many settings', 'Unclear setting names', 'Focus Lock', 'Schedules or time limits']
  },
  {
    id: 'missing_feature',
    title: 'A feature I need is missing',
    icon: '💡',
    label: 'What would you like Intentional YT to do?',
    tags: []
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
    label: 'What changed for you?',
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
    return { name: 'Edge', storeName: 'Microsoft Edge Add-ons', storeUrl: APP_CONFIG.edgeAddonUrl }
  }
  return { name: 'Chrome', storeName: 'Chrome Web Store', storeUrl: APP_CONFIG.chromeWebStoreUrl }
}

export default function Uninstall() {
  const { theme, toggleTheme } = useTheme()
  const [selectedReason, setSelectedReason] = useState(null)
  const [detailsText, setDetailsText] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
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

  const sendPayload = async (reasonTitle, details = '') => {
    if (!UNINSTALL_FEEDBACK_CONFIG?.formActionUrl || !UNINSTALL_FEEDBACK_CONFIG.reasonEntryId) {
      throw new Error('Feedback form is unavailable')
    }

    let finalString = reasonTitle
    if (details && details.trim()) {
      finalString += ` — Details: ${details.trim()}`
    }
    finalString += ` [${browserInfo.name || 'Browser'}]`

    const formData = new URLSearchParams()
    formData.append(UNINSTALL_FEEDBACK_CONFIG.reasonEntryId, finalString)

    // Google Forms returns an opaque response; only network failures are detectable.
    await fetch(UNINSTALL_FEEDBACK_CONFIG.formActionUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })
  }

  const handleSelectReason = (option) => {
    if (option.id === selectedReason) return
    setSelectedReason(option.id)
    setSelectedTags([])
    setDetailsText('')
    setSubmitError(false)
  }

  const handleTagClick = (tag) => {
    const isSelected = selectedTags.includes(tag)
    const nextTags = isSelected
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]

    setSelectedTags(nextTags)
  }

  const handleSubmitDetails = async (e, reasonOnly = false) => {
    if (e) e.preventDefault()
    if (hasSubmittedRef.current) return
    const activeOption = REASON_OPTIONS.find((r) => r.id === selectedReason)
    if (!activeOption) return
    hasSubmittedRef.current = true
    setIsSubmitting(true)
    setSubmitError(false)
    const details = reasonOnly ? '' : [
      selectedTags.length ? `${activeOption.label} ${selectedTags.join('; ')}` : '',
      detailsText.trim() ? `Comment: ${detailsText.trim()}` : ''
    ].filter(Boolean).join(' | ')
    try {
      await sendPayload(activeOption.title, details)
      setIsSubmitted(true)
    } catch {
      hasSubmittedRef.current = false
      setSubmitError(true)
    } finally {
      setIsSubmitting(false)
    }
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
                  What made you uninstall Intentional YT?
                </h1>
                <p className="uninstall-desc">
                  Choose the main reason. A little feedback helps me decide what to improve next.
                </p>
              </div>

              <div className="uninstall-options-list" role="group" aria-label="Reason for uninstalling">
                {REASON_OPTIONS.map((option) => {
                  const isSelected = selectedReason === option.id
                  return (
                    <div key={option.id} className="opt-group">
                      <button
                        type="button"
                        aria-expanded={isSelected}
                        aria-controls={isSelected ? `follow-up-${option.id}` : undefined}
                        disabled={isSubmitting}
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
                        <div className="uninstall-drawer" id={`follow-up-${option.id}`}>
                          <label htmlFor={`details-${option.id}`} className="uninstall-drawer-label">{option.label} (Optional)</label>
                          {option.tags.length > 0 && (
                            <div className="uninstall-quick-tags">
                              {option.tags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  aria-pressed={selectedTags.includes(tag)}
                                  disabled={isSubmitting}
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
                              id={`details-${option.id}`}
                              rows="2"
                              maxLength={2000}
                              disabled={isSubmitting}
                              placeholder="Add anything else you would like me to know."
                              value={detailsText}
                              onChange={(e) => setDetailsText(e.target.value)}
                            />
                            <div className="uninstall-form-actions">
                              <button type="button" className="uninstall-skip-btn" disabled={isSubmitting} onClick={() => handleSubmitDetails(null, true)}>
                                Send reason only
                              </button>
                              <button type="submit" className="uninstall-submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending…' : 'Send feedback'}
                              </button>
                            </div>
                            {submitError && (
                              <p role="alert" className="uninstall-desc">
                                Could not send your feedback. Try again or <a href={UNINSTALL_FEEDBACK_CONFIG.fallbackFormUrl} target="_blank" rel="noopener noreferrer">open the Google Form</a>.
                              </p>
                            )}
                          </form>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="uninstall-desc">
                Only sent when you press Send: your chosen reason, any details you include, and browser name go to Google Forms. Please leave out personal information.
              </p>
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
                Thanks for taking the time to help improve Intentional YT. You can close this page.
              </p>
            </div>
          )}

          {/* Reinstall and feedback footer */}
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
              href={APP_CONFIG.feedbackFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-nav-link"
              style={{ fontSize: '12px' }}
            >
              Share feedback
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
