'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { APP_CONFIG } from '../config/constants'

function decodeSetup(hashOrCode) {
  if (!hashOrCode) return null
  let code = hashOrCode.trim()
  if (code.startsWith('#')) code = code.slice(1)
  if (code.includes('s=')) code = code.split('s=')[1]
  if (code.includes('p=')) code = code.split('p=')[1]
  code = code.split('&')[0].trim()
  if (!code) return null

  try {
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=')
    const jsonStr = decodeURIComponent(
      Array.prototype.map.call(atob(padded), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
    const parsed = JSON.parse(jsonStr)
    if (parsed && parsed.v === 1 && parsed.settings) {
      return { rawCode: code, ...parsed }
    }
  } catch (_) {}
  return null
}

export default function SetupShare() {
  const [preset, setPreset] = useState(null)
  const [manualInput, setManualInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    const hash = window.location.hash
    if (hash) {
      const decoded = decodeSetup(hash)
      if (decoded) setPreset(decoded)
    }
  }, [])

  const handleManualDecode = (e) => {
    e.preventDefault()
    const decoded = decodeSetup(manualInput)
    if (decoded) {
      setPreset(decoded)
      window.location.hash = `s=${decoded.rawCode}`
    } else {
      alert('Invalid or corrupted setup link/code. Please check and try again.')
    }
  }

  const handleCopyCode = async () => {
    if (!preset) return
    try {
      await navigator.clipboard.writeText(preset.rawCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch (_) {}
  }

  const s = preset?.settings || {}

  const rules = [
    { label: 'Hide Shorts & Reels', active: s.blockShorts },
    { label: 'Redirect Shorts to Normal Player', active: s.redirectShorts },
    { label: 'Hide Home Feed', active: s.blockHomeFeed },
    { label: 'Limit Home Feed (15 Calm Videos)', active: s.limitHomeFeed },
    { label: 'Hide Suggested Videos Beside Player', active: s.blockRecommended },
    { label: 'Hide Left Sidebar', active: s.blockSidebar },
    { label: 'Hide Comments & Discussion', active: s.blockComments },
    { label: 'Hide Commenter Avatars', active: s.blockProfilePhotos },
    { label: 'Hide End Screen Recommendation Tiles', active: s.blockEndScreenVideowall },
    { label: 'Hide Creator End Screen Cards', active: s.blockEndScreenCards },
    { label: 'Hide Explore & Trending Feeds', active: s.blockExploreAndTrending },
    { label: 'Hide Search Clutter & Irrelevant Shelves', active: s.blockIrrelevantSearchResults },
    { label: 'Disable Video Autoplay', active: s.disableAutoplay },
    { label: 'Desaturate to Grayscale', active: s.grayscaleMode }
  ].filter(r => r.active)

  return (
    <article className="setup-share-page" style={{ maxWidth: '840px', margin: '0 auto', padding: '40px 16px 80px' }}>
      <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        ← Back to Home
      </Link>

      <div className="section-head" style={{ textAlign: 'left', margin: '28px 0 24px' }}>
        <h1 className="section-title">Shared Focus Setup</h1>
        <p className="section-desc">
          1-click YouTube configuration for students, study groups, classrooms, and creators.
        </p>
      </div>

      {preset ? (
        <div className="table-card" style={{ padding: '28px', borderRadius: '12px', background: 'var(--surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preset Configuration
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--ink-primary)', margin: '4px 0 0' }}>
                {preset.name || 'Custom Setup'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              {copied ? '✓ Code Copied!' : 'Copy Setup Code'}
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '650', marginBottom: '12px', color: 'var(--ink-primary)' }}>
              Active Focus Rules ({rules.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--surface-inset)',
                    border: '1px solid var(--rule-hairline)',
                    fontSize: '13px',
                    color: 'var(--ink-secondary)'
                  }}
                >
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>
          </div>

          {(s.channelBlocklist?.length > 0 || s.keywordBlocklist?.length > 0) && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '650', marginBottom: '12px', color: 'var(--ink-primary)' }}>
                Included Filters
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {s.channelBlocklist?.map((ch, i) => (
                  <span
                    key={`ch-${i}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--danger)',
                      fontSize: '12px',
                      fontWeight: '550'
                    }}
                  >
                    Channel: {ch}
                  </span>
                ))}
                {s.keywordBlocklist?.map((kw, i) => (
                  <span
                    key={`kw-${i}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--accent)',
                      fontSize: '12px',
                      fontWeight: '550'
                    }}
                  >
                    Keyword: {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              padding: '16px 20px',
              borderRadius: '8px',
              background: 'var(--surface-inset)',
              border: '1px solid var(--rule-hairline)',
              marginTop: '24px'
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: '650', marginBottom: '6px', color: 'var(--ink-primary)' }}>
              How to Apply in Intentional YT:
            </h4>
            <ol style={{ fontSize: '13px', color: 'var(--ink-secondary)', paddingLeft: '20px', lineHeight: '1.6', margin: 0 }}>
              <li>Click <strong>Copy Setup Code</strong> above.</li>
              <li>Open the <strong>Intentional YT</strong> extension popup on your browser toolbar.</li>
              <li>Go to <strong>Settings</strong> ➔ <strong>Import</strong> under "Share My Setup".</li>
              <li>Paste the code and click <strong>Apply Setup</strong>. Your YouTube experience is updated instantly!</li>
            </ol>
          </div>
        </div>
      ) : isLoaded ? (
        <div className="table-card" style={{ padding: '28px', borderRadius: '12px', background: 'var(--surface-elevated)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '650', marginBottom: '8px', color: 'var(--ink-primary)' }}>
            Inspect a Preset
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--ink-secondary)', marginBottom: '18px' }}>
            Paste a link or 1-click preset code below to preview its focus rules before applying it.
          </p>
          <form onSubmit={handleManualDecode} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste https://intentionalyt.me/setup#s=... or code"
              style={{
                flex: '1',
                minWidth: '240px',
                height: '42px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid var(--rule-hairline)',
                background: 'var(--surface-inset)',
                color: 'var(--ink-primary)',
                fontSize: '13px'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 20px' }}>
              Preview Preset
            </button>
          </form>
        </div>
      ) : null}

      <div style={{ marginTop: '36px', textAlign: 'center' }}>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-tertiary)', marginBottom: '12px' }}>
          Don't have the extension installed yet?
        </p>
        <div style={{ display: 'inline-flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={APP_CONFIG.chromeWebStoreUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Install for Chrome
          </a>
          <a href={APP_CONFIG.firefoxAddonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            Install for Firefox
          </a>
        </div>
      </div>
    </article>
  )
}
