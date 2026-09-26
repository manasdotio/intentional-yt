import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { APP_CONFIG, UNINSTALL_FEEDBACK_CONFIG } from '../config/constants'

const UNINSTALL_REASONS = [
  'It slowed down my browser',
  "It didn't work as expected / had a bug",
  "I didn't find it useful",
  'Privacy or permissions concern',
  "I just don't need it anymore",
  'Other'
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
  const [otherText, setOtherText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
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

  const submitFeedback = async (reason, comment = '') => {
    if (isSubmitting || isSubmitted) return
    setIsSubmitting(true)

    const finalDetails = comment.trim() 
      ? `Uninstall Reason: ${reason} — Comment: ${comment.trim()}`
      : `Uninstall Reason: ${reason}`

    try {
      if (UNINSTALL_FEEDBACK_CONFIG?.formActionUrl) {
        const formData = new URLSearchParams()

        if (UNINSTALL_FEEDBACK_CONFIG.reasonEntryId) {
          formData.append(UNINSTALL_FEEDBACK_CONFIG.reasonEntryId, reason)
        }
        if (UNINSTALL_FEEDBACK_CONFIG.detailsEntryId) {
          const detailValue = comment.trim() 
            ? `${comment.trim()} [${browserInfo.name}]`
            : `[${browserInfo.name}]`
          formData.append(UNINSTALL_FEEDBACK_CONFIG.detailsEntryId, detailValue)
        }

        // Backward compatibility
        if (UNINSTALL_FEEDBACK_CONFIG.typeEntryId) {
          formData.append(UNINSTALL_FEEDBACK_CONFIG.typeEntryId, UNINSTALL_FEEDBACK_CONFIG.typeValue || '💬 General Feedback')
        }
        if (UNINSTALL_FEEDBACK_CONFIG.browserEntryId) {
          formData.append(UNINSTALL_FEEDBACK_CONFIG.browserEntryId, browserInfo.name)
        }

        // Fire-and-forget headless submission directly into connected Google Sheet
        fetch(UNINSTALL_FEEDBACK_CONFIG.formActionUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        }).catch(() => {})
      }
    } catch (e) {
      // Non-blocking fail-safe
    }

    // Immediate optimistic UX transition
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 180)
  }

  const handleSelectReason = (reason) => {
    setSelectedReason(reason)
    if (reason !== 'Other') {
      submitFeedback(reason)
    }
  }

  const handleOtherSubmit = (e) => {
    e.preventDefault()
    submitFeedback('Other', otherText)
  }

  return (
    <div className="uninstall-screen">
      {/* Minimal Top Header */}
      <header className="uninstall-nav">
        <a href="/" className="brand" aria-label="Intentional YT Home">
          <img src="/icons/icon.svg" alt="Intentional YT Logo" className="brand-logo" width="26" height="26" />
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
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                <h1 className="uninstall-title">
                  Sorry to see you go — mind telling me why?
                </h1>
                <p className="uninstall-desc">
                  One click helps us understand what to improve. No follow-ups, no spam.
                </p>
              </div>

              <div className="uninstall-options-list" role="radiogroup" aria-label="Reason for uninstalling">
                {UNINSTALL_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason
                  return (
                    <button
                      key={reason}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isSubmitting}
                      className={`uninstall-opt-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectReason(reason)}
                    >
                      <span className="uninstall-opt-text">{reason}</span>
                      <span className="uninstall-opt-indicator">
                        {isSelected && reason !== 'Other' ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <span className="uninstall-dot" />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Revealed 'Other' text field */}
              {selectedReason === 'Other' && (
                <form onSubmit={handleOtherSubmit} className="uninstall-other-form">
                  <textarea
                    className="uninstall-textarea"
                    rows="3"
                    autoFocus
                    placeholder="Mind sharing a few details? (Optional)"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                  />
                  <div className="uninstall-form-actions">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary uninstall-submit-btn"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Feedback'}
                    </button>
                  </div>
                </form>
              )}
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
                Your response has been noted. We appreciate the time you spent trying Intentional YT.
              </p>
            </div>
          )}

          {/* Honest Reinstall Link with User-Agent Store Detection */}
          <div className="uninstall-reinstall-footer">
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
        </div>
      </main>
    </div>
  )
}
