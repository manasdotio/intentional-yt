'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { CURATED_PACKS } from '../data/curatedPacks'
import { APP_CONFIG } from '../config/constants'

const TOOL_TABS = [
  { id: 'packs', label: 'Curated Blocklists', icon: '📦', badge: '7 Packs' },
  { id: 'builder', label: 'Preset Builder', icon: '🛠️', badge: 'Web-to-Extension' },
  { id: 'calculator', label: 'Screen-Time Audit', icon: '⏱️', badge: 'Interactive' },
  { id: 'analyzer', label: 'Clickbait Tester', icon: '🧪', badge: 'Headline Audit' }
]

const PACK_CATEGORIES = [
  { id: 'all', label: 'All Packs (7)', icon: '✨' },
  { id: 'channels', label: 'Stop Drama & Ragebait', icon: '🚫' },
  { id: 'keywords', label: 'Clickbait Filter', icon: '✂️' },
  { id: 'study', label: 'Study & Academia', icon: '📚' },
  { id: 'kids', label: 'Kids Safety', icon: '🛡️' },
  { id: 'minimal', label: 'Anti-Doomscroll', icon: '📰' }
]

function encodeSetupPayload(name, settings) {
  const payload = {
    v: 1,
    name: (name || 'Custom Setup').trim().slice(0, 50),
    created: Date.now(),
    settings
  }
  const jsonStr = JSON.stringify(payload)
  try {
    return btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch (_) {
    return ''
  }
}

export default function ToolsLibrary() {
  const [activeTab, setActiveTab] = useState('packs')

  // --- TAB 1: CURATED PACKS STATE ---
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCodeId, setCopiedCodeId] = useState(null)
  const [copiedListId, setCopiedListId] = useState(null)
  const [expandedPacks, setExpandedPacks] = useState({})
  const [packFilterQueries, setPackFilterQueries] = useState({})

  // --- TAB 2: BUILDER STATE ---
  const [customName, setCustomName] = useState('My Focus Preset')
  const [builderRules, setBuilderRules] = useState({
    blockShorts: true,
    redirectShorts: true,
    limitHomeFeed: true,
    blockRecommended: true,
    neutralThumbnails: true,
    fullWindowPlayer: true,
    blockComments: false,
    blockMixPlaylists: true,
    disableAutoplay: true
  })
  const [builderChannelsRaw, setBuilderChannelsRaw] = useState('@DramaAlert\n@SunnyV2\n@IShowSpeed\n@WatchMojo')
  const [builderKeywordsRaw, setBuilderKeywordsRaw] = useState('OMG, YOU WONT BELIEVE, EXPOSED, GONE WRONG, 3AM')
  const [builderFilterMode, setBuilderFilterMode] = useState('blocklist')
  const [builderCopied, setBuilderCopied] = useState(false)
  const [builderUrlCopied, setBuilderUrlCopied] = useState(false)

  // --- TAB 3: CALCULATOR STATE ---
  const [calcMinutesPerDay, setCalcMinutesPerDay] = useState(90)
  const [calcAlgorithmPct, setCalcAlgorithmPct] = useState(65)
  const [calcHourlyValue, setCalcHourlyValue] = useState(30)

  // --- TAB 4: ANALYZER STATE ---
  const [headlineInput, setHeadlineInput] = useState('YOU WONT BELIEVE WHAT HAPPENED AT 3AM!! (GONE WRONG)')

  // ----------------------------------------------------
  // COMPUTED: CURATED PACKS
  // ----------------------------------------------------
  const toggleExpand = (id) => {
    setExpandedPacks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopyCode = async (pack) => {
    try {
      await navigator.clipboard.writeText(pack.code)
      setCopiedCodeId(pack.id)
      setTimeout(() => setCopiedCodeId(null), 2500)
    } catch (_) {}
  }

  const handleCopyList = async (pack) => {
    try {
      const items = pack.channels.length > 0 ? pack.channels : pack.keywords
      await navigator.clipboard.writeText(items.join('\n'))
      setCopiedListId(pack.id)
      setTimeout(() => setCopiedListId(null), 2500)
    } catch (_) {}
  }

  const handleDownloadJson = (pack) => {
    const backupObj = {
      schemaVersion: 1,
      name: pack.name,
      exportedAt: new Date().toISOString(),
      settings: pack.settings
    }
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intentional-yt-${pack.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredPacks = useMemo(() => {
    return CURATED_PACKS.filter(pack => {
      const matchesCategory = activeCategory === 'all' || pack.category === activeCategory
      if (!matchesCategory) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchesName = pack.name.toLowerCase().includes(q)
      const matchesDesc = pack.description.toLowerCase().includes(q)
      const matchesChannels = pack.channels.some(ch => ch.toLowerCase().includes(q))
      const matchesKeywords = pack.keywords.some(kw => kw.toLowerCase().includes(q))

      return matchesName || matchesDesc || matchesChannels || matchesKeywords
    })
  }, [activeCategory, searchQuery])

  // ----------------------------------------------------
  // COMPUTED: BUILDER
  // ----------------------------------------------------
  const builderParsedChannels = useMemo(() => {
    return builderChannelsRaw
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.startsWith('@') ? s : `@${s}`)
  }, [builderChannelsRaw])

  const builderParsedKeywords = useMemo(() => {
    return builderKeywordsRaw
      .split(/[\n,]+/)
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)
  }, [builderKeywordsRaw])

  const generatedBuilderSettings = useMemo(() => {
    const base = {
      ...builderRules,
      filterMode: builderFilterMode,
      channelBlocklist: builderFilterMode === 'blocklist' ? builderParsedChannels : [],
      keywordBlocklist: builderParsedKeywords,
      channelAllowlist: builderFilterMode === 'allowlist' ? builderParsedChannels : []
    }
    return base
  }, [builderRules, builderFilterMode, builderParsedChannels, builderParsedKeywords])

  const generatedBuilderCode = useMemo(() => {
    return encodeSetupPayload(customName, generatedBuilderSettings)
  }, [customName, generatedBuilderSettings])

  const generatedBuilderUrl = useMemo(() => {
    return `https://www.intentionalyt.me/setup#s=${generatedBuilderCode}`
  }, [generatedBuilderCode])

  const handleCopyBuilderCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedBuilderCode)
      setBuilderCopied(true)
      setTimeout(() => setBuilderCopied(false), 2400)
    } catch (_) {}
  }

  const handleCopyBuilderUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedBuilderUrl)
      setBuilderUrlCopied(true)
      setTimeout(() => setBuilderUrlCopied(false), 2400)
    } catch (_) {}
  }

  const handleDownloadBuilderJson = () => {
    const backupObj = {
      schemaVersion: 1,
      name: customName,
      exportedAt: new Date().toISOString(),
      settings: generatedBuilderSettings
    }
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intentional-yt-custom-setup.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ----------------------------------------------------
  // COMPUTED: CALCULATOR
  // ----------------------------------------------------
  const calcStats = useMemo(() => {
    const totalHoursPerYear = Math.round((calcMinutesPerDay * 365) / 60)
    const algorithmHoursPerYear = Math.round((totalHoursPerYear * calcAlgorithmPct) / 100)
    const savedHoursPerYear = Math.round(algorithmHoursPerYear * 0.8)
    const economicCostPerYear = Math.round(algorithmHoursPerYear * calcHourlyValue)
    const contextSwitches = Math.round(algorithmHoursPerYear * 45) // ~45 micro-interruptions per hour of rabbit hole

    return {
      totalHoursPerYear,
      algorithmHoursPerYear,
      savedHoursPerYear,
      economicCostPerYear,
      contextSwitches
    }
  }, [calcMinutesPerDay, calcAlgorithmPct, calcHourlyValue])

  // ----------------------------------------------------
  // COMPUTED: ANALYZER
  // ----------------------------------------------------
  const analyzedHeadline = useMemo(() => {
    const input = headlineInput.trim()
    if (!input) return null

    const triggers = [
      'OMG', 'YOU WONT BELIEVE', 'YOU WON\'T BELIEVE', 'EXPOSED', 'GONE WRONG',
      '3AM', 'SHOCKING', 'MUST WATCH', 'PRANK', 'SHE DID WHAT', 'HE DID WHAT',
      'CAUGHT ON CAMERA', 'NEVER DO THIS', 'I REGRET THIS', 'RUINED MY LIFE',
      'COPS CALLED', 'IN REAL LIFE', 'TRY NOT TO LAUGH', 'SECRET REVEALED',
      'WE BROKE UP', 'CHEATING ON', 'INSANE', 'UNBELIEVABLE', 'DONT WATCH THIS',
      'WORST MISTAKE', 'I ALMOST DIED', 'THE TRUTH ABOUT', 'APOLOGY VIDEO',
      'WE NEED TO TALK', 'FINALLY REVEALED', 'POLICE INVOLVED', 'BANNED FROM',
      'KICKED OUT', 'DESTROYED', 'CAUGHT IN 4K', 'LOST EVERYTHING', 'CANCELLED'
    ]

    const upper = input.toUpperCase()
    const detected = triggers.filter(t => upper.includes(t))

    // Count exclamation marks and all-caps words
    const exclamations = (input.match(/!/g) || []).length
    const words = input.split(/\s+/).filter(Boolean)
    const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /^[A-Z]+$/.test(w))
    const capsRatio = words.length ? capsWords.length / words.length : 0

    let score = 10
    score += detected.length * 28
    score += Math.min(25, exclamations * 8)
    if (capsRatio > 0.4) score += 30
    score = Math.min(100, Math.max(5, score))

    // Normalized title preview
    let cleaned = input.toLowerCase()
    cleaned = cleaned.replace(/!{2,}/g, '.')
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)

    return {
      score,
      detected,
      exclamations,
      capsWordsCount: capsWords.length,
      cleanedTitle: cleaned
    }
  }, [headlineInput])

  return (
    <div className="tools-library-container" style={{ maxWidth: '1080px', margin: '0 auto', padding: '32px 16px 80px' }}>
      {/* Top Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}>
          ← Back to Home
        </Link>
      </nav>

      {/* Hero Header */}
      <header className="section-head" style={{ textAlign: 'left', marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '16px', background: 'var(--accent-blue-subtle)', border: '1px solid var(--border-accent)', color: 'var(--accent-blue)', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
          <span>100% Free &amp; Open Source</span>
          <span>•</span>
          <span>Zero Telemetry</span>
          <span>•</span>
          <span>Runs On-Device</span>
        </div>
        <h1 className="section-title" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: '800', lineHeight: '1.2', margin: '0 0 10px', color: 'var(--text-primary)' }}>
          YouTube Focus &amp; Clutter Toolkit
        </h1>
        <p className="section-desc" style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '760px', lineHeight: '1.6', margin: 0 }}>
          An open-source utility suite for desktop YouTube. Import vetted blocklists, generate custom shareable rules, calculate your annual rabbit-hole cost, and audit clickbait headlines.
        </p>
      </header>

      {/* Main Suite Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '32px', overflowX: 'auto' }}>
        {TOOL_TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--accent-blue)' : 'var(--surface)',
                color: isActive ? '#ffffff' : 'var(--text-primary)',
                fontWeight: isActive ? '650' : '500',
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)'
                }}
              >
                {tab.badge}
              </span>
            </button>
          )
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CURATED BLOCKLISTS                                */}
      {/* ======================================================== */}
      {activeTab === 'packs' && (
        <section>
          {/* Quick 3-Step Walkthrough Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-blue)', color: '#ffffff', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                1
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '550' }}>
                Pick a vetted pack below
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-blue)', color: '#ffffff', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                2
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '550' }}>
                Click <strong>Copy Setup Code</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: 'var(--accent-blue)', color: '#ffffff', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                3
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '550' }}>
                Paste into Intentional YT (Options &gt; Import)
              </span>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all 300+ channels and keywords (e.g. '@DramaAlert', 'skibidi', 'math', 'mitocw')..."
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {PACK_CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '12.5px',
                      fontWeight: isActive ? '600' : '500',
                      border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                      background: isActive ? 'var(--accent-blue)' : 'var(--surface)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredPacks.map(pack => {
              const hasChannels = pack.channels.length > 0
              const items = hasChannels ? pack.channels : pack.keywords
              const isExpanded = expandedPacks[pack.id]
              const filterQuery = (packFilterQueries[pack.id] || '').toLowerCase()
              const displayedItems = filterQuery
                ? items.filter(it => it.toLowerCase().includes(filterQuery))
                : items

              return (
                <article
                  key={pack.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'var(--bg-subtle)',
                          color: pack.badgeColor,
                          border: `1px solid ${pack.badgeColor}33`
                        }}
                      >
                        {pack.categoryLabel}
                      </span>
                      <span style={{ fontSize: '18px' }}>{pack.icon}</span>
                    </div>

                    <h2 style={{ fontSize: '17.5px', fontWeight: '700', margin: '0 0 8px', color: 'var(--text-primary)', lineHeight: '1.3' }}>
                      {pack.name}
                    </h2>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.55', margin: '0 0 14px' }}>
                      {pack.description}
                    </p>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {pack.rules.map((rule, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '5px',
                              background: 'var(--bg-subtle)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border)'
                            }}
                          >
                            ✓ {rule}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Items Drawer */}
                    {items.length > 0 && (
                      <div style={{ marginBottom: '18px' }}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(pack.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span>
                            {isExpanded ? 'Close item inspector' : `Inspect all ${items.length} ${hasChannels ? 'channels' : 'keywords'}`}
                          </span>
                          <span>{isExpanded ? '▲' : '▼'}</span>
                        </button>

                        {isExpanded && (
                          <div style={{ marginTop: '8px', padding: '10px', borderRadius: '6px', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                            {items.length > 12 && (
                              <input
                                type="text"
                                placeholder={`Filter ${items.length} items...`}
                                value={packFilterQueries[pack.id] || ''}
                                onChange={(e) => setPackFilterQueries({ ...packFilterQueries, [pack.id]: e.target.value })}
                                style={{
                                  width: '100%',
                                  padding: '5px 8px',
                                  fontSize: '11px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--surface)',
                                  color: 'var(--text-primary)',
                                  marginBottom: '8px'
                                }}
                              />
                            )}

                            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {displayedItems.map((item, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: hasChannels ? 'rgba(239, 68, 68, 0.08)' : 'rgba(249, 115, 22, 0.08)',
                                    color: hasChannels ? 'var(--accent-red)' : 'var(--text-primary)',
                                    border: hasChannels ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(249, 115, 22, 0.2)'
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                              {displayedItems.length === 0 && (
                                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>No matching items.</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(pack)}
                      className="btn btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        padding: '9px 14px',
                        width: '100%',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{copiedCodeId === pack.id ? '✓ Code Copied! Ready to import' : '📋 Copy Setup Code'}</span>
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      <Link
                        href={pack.setupUrl}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '11.5px',
                          padding: '6px 4px',
                          textAlign: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none'
                        }}
                      >
                        Preview ↗
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDownloadJson(pack)}
                        className="btn btn-secondary"
                        style={{
                          fontSize: '11.5px',
                          padding: '6px 4px',
                          textAlign: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Download JSON file for extension import"
                      >
                        Save .JSON
                      </button>

                      {items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCopyList(pack)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '11.5px',
                            padding: '6px 4px',
                            textAlign: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Copy list as newline-separated plain text"
                        >
                          {copiedListId === pack.id ? '✓ Done' : 'Plain Text'}
                        </button>
                      )}
                    </div>

                    {pack.guideUrl && (
                      <Link
                        href={pack.guideUrl}
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          textAlign: 'center',
                          paddingTop: '2px',
                          fontWeight: '600',
                          display: 'block'
                        }}
                      >
                        Deep-Dive Guide &amp; Channels →
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 2: INTERACTIVE CUSTOM PRESET BUILDER                 */}
      {/* ======================================================== */}
      {activeTab === 'builder' && (
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              WEB-TO-EXTENSION COMPILER
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 8px' }}>
              Custom YouTube Preset Builder
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              Configure your desired rules and blocklists below. This tool generates a shareable URL and encoded preset code that can be imported directly into Intentional YT.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Form Left: Metadata & Toggles */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Preset Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  marginBottom: '18px'
                }}
              />

              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: 'var(--text-primary)' }}>
                Active Protection Rules
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'blockShorts', label: 'Hide Shorts shelves and navigation' },
                  { key: 'redirectShorts', label: 'Redirect Shorts links to regular player' },
                  { key: 'limitHomeFeed', label: 'Limit Home Feed (15-video finish marker)' },
                  { key: 'blockRecommended', label: 'Hide suggested videos beside player' },
                  { key: 'neutralThumbnails', label: 'Neutral thumbnails (anti-clickbait frames)' },
                  { key: 'fullWindowPlayer', label: 'Expand player (theater mode)' },
                  { key: 'blockMixPlaylists', label: 'Hide YouTube Mix & Radio playlists' },
                  { key: 'blockComments', label: 'Hide video comments section' },
                  { key: 'disableAutoplay', label: 'Disable next video autoplay' }
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={builderRules[item.key]}
                      onChange={(e) => setBuilderRules({ ...builderRules, [item.key]: e.target.checked })}
                      style={{ accentColor: 'var(--accent-blue)', width: '16px', height: '16px' }}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Right: Channels & Keywords */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Channels ({builderParsedChannels.length})
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setBuilderFilterMode('blocklist')}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      background: builderFilterMode === 'blocklist' ? 'var(--accent-red)' : 'var(--bg-subtle)',
                      color: builderFilterMode === 'blocklist' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Blocklist
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuilderFilterMode('allowlist')}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      background: builderFilterMode === 'allowlist' ? 'var(--accent-blue)' : 'var(--bg-subtle)',
                      color: builderFilterMode === 'allowlist' ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Allowlist
                  </button>
                </div>
              </div>
              <textarea
                rows={5}
                value={builderChannelsRaw}
                onChange={(e) => setBuilderChannelsRaw(e.target.value)}
                placeholder="Enter @channel handles, one per line..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontFamily: 'monospace',
                  marginBottom: '16px',
                  resize: 'vertical'
                }}
              />

              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>
                Clickbait Keywords ({builderParsedKeywords.length})
              </label>
              <textarea
                rows={4}
                value={builderKeywordsRaw}
                onChange={(e) => setBuilderKeywordsRaw(e.target.value)}
                placeholder="Enter keywords separated by commas..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Generated Outputs Card */}
          <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', margin: '0 0 12px', color: 'var(--text-primary)' }}>
              Generated Preset Deliverables
            </h3>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleCopyBuilderCode}
                className="btn btn-primary"
                style={{ fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
              >
                {builderCopied ? '✓ Setup Code Copied!' : '📋 Copy Setup Code'}
              </button>

              <button
                type="button"
                onClick={handleCopyBuilderUrl}
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
              >
                {builderUrlCopied ? '✓ Link Copied!' : '🔗 Copy Shareable Link'}
              </button>

              <button
                type="button"
                onClick={handleDownloadBuilderJson}
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px', cursor: 'pointer' }}
              >
                💾 Download .JSON Backup
              </button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Share URL:</strong> <code style={{ wordBreak: 'break-all', color: 'var(--accent-blue)' }}>{generatedBuilderUrl.slice(0, 85)}...</code>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SCREEN-TIME AUDIT CALCULATOR                      */}
      {/* ======================================================== */}
      {activeTab === 'calculator' && (
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '28px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ATTENTION METRICS &amp; OPPORTUNITY COST
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 8px' }}>
              YouTube Distraction Audit Calculator
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              Quantify how much time YouTube recommendations take from your year, and what reclaiming that focus is worth.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '32px' }}>
            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Daily YouTube playback</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-blue)' }}>{calcMinutesPerDay} minutes/day</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="360"
                  step="15"
                  value={calcMinutesPerDay}
                  onChange={(e) => setCalcMinutesPerDay(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Includes home feed, suggested videos, and Shorts.</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Recommendation reliance</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-red)' }}>{calcAlgorithmPct}% algorithmic</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  step="5"
                  value={calcAlgorithmPct}
                  onChange={(e) => setCalcAlgorithmPct(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-red)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Percentage of videos watched from suggestions rather than targeted search.</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Estimated hourly value of your time</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-emerald)' }}>${calcHourlyValue}/hour</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={calcHourlyValue}
                  onChange={(e) => setCalcHourlyValue(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>For freelance, study, or professional career building.</span>
              </div>
            </div>

            {/* Live Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TOTAL PER YEAR</span>
                <strong style={{ fontSize: '26px', color: 'var(--text-primary)', display: 'block', lineHeight: '1.2' }}>{calcStats.totalHoursPerYear} hrs</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>~{Math.round(calcStats.totalHoursPerYear / 24)} full 24-hr days</span>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-red)', display: 'block', marginBottom: '4px' }}>ALGORITHM RABBIT HOLES</span>
                <strong style={{ fontSize: '26px', color: 'var(--accent-red)', display: 'block', lineHeight: '1.2' }}>{calcStats.algorithmHoursPerYear} hrs</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Pulled by recommendations</span>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-emerald)', display: 'block', marginBottom: '4px' }}>HOURS YOU CAN RECLAIM</span>
                <strong style={{ fontSize: '26px', color: 'var(--accent-emerald)', display: 'block', lineHeight: '1.2' }}>+{calcStats.savedHoursPerYear} hrs</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Using daily limits &amp; clean feeds</span>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TIME VALUE IMPACT</span>
                <strong style={{ fontSize: '26px', color: 'var(--text-primary)', display: 'block', lineHeight: '1.2' }}>${calcStats.economicCostPerYear.toLocaleString()}</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Annual opportunity cost</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--surface-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                Recommended Action: Set a 45-minute daily watch budget
              </strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Intentional YT automatically pauses playback when your minutes expire, keeping your hours protected without blocking deliberate research.
              </span>
            </div>
            <Link href="/blog/set-youtube-daily-time-limit" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
              Read Daily Limit Guide →
            </Link>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* TAB 4: CLICKBAIT HEADLINE ANALYZER                       */}
      {/* ======================================================== */}
      {activeTab === 'analyzer' && (
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              LOCAL DECLICKBAIT ENGINE
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 8px' }}>
              Clickbait Headline Analyzer &amp; Sanitizer
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              Test how YouTube title filters work. Paste any sensational video title to evaluate its psychological triggers and preview the normalized version.
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Paste a YouTube Video Title to Test:
            </label>
            <input
              type="text"
              value={headlineInput}
              onChange={(e) => setHeadlineInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {analyzedHeadline && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Score Gauge Card */}
              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  CLICKBAIT RISK SCORE
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontSize: '38px',
                      fontWeight: '800',
                      color: analyzedHeadline.score > 60 ? 'var(--accent-red)' : analyzedHeadline.score > 30 ? '#f59e0b' : 'var(--accent-emerald)'
                    }}
                  >
                    {analyzedHeadline.score}
                  </span>
                  <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ 100</span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: analyzedHeadline.score > 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: analyzedHeadline.score > 60 ? 'var(--accent-red)' : 'var(--accent-emerald)'
                    }}
                  >
                    {analyzedHeadline.score > 60 ? 'HIGH SENSATIONALISM' : analyzedHeadline.score > 30 ? 'MODERATE HOOK' : 'CALM TITLE'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {analyzedHeadline.detected.length > 0 ? (
                    <div>
                      <strong>Detected triggers:</strong>{' '}
                      {analyzedHeadline.detected.map(d => (
                        <span key={d} style={{ display: 'inline-block', fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', margin: '2px' }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span>No known manufactured emergency keywords detected.</span>
                  )}
                </div>
              </div>

              {/* Title Sanitizer Card */}
              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  INTENTIONAL YT NORMALIZED PREVIEW
                </span>
                <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 12px', lineHeight: '1.4' }}>
                  "{analyzedHeadline.cleanedTitle}"
                </p>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                  Intentional YT's <strong>Neutral thumbnails (anti-clickbait)</strong> switch converts screaming ALL-CAPS titles into readable sentence case and swaps custom marketing thumbnails with neutral video captures.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setHeadlineInput('I SPENT 24 HOURS IN ABANDONED PRISON (COPS CALLED)!')}
            >
              Test Example 1
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setHeadlineInput('THE TRUTH ABOUT MY APOLOGY... (LEAVING FOREVER)')}
            >
              Test Example 2
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setHeadlineInput('Python Data Structures and Algorithms Full Course')}
            >
              Test Calm Example
            </button>
          </div>
        </section>
      )}

      {/* Featured Deep-Dive Tools Hub */}
      <section style={{ marginTop: '56px', marginBottom: '16px' }}>
        <div style={{ marginBottom: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em' }}>
            Deep-Dive Guides &amp; Programmatic Tools
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0 0', color: 'var(--text)' }}>
            Specialized YouTube Focus &amp; Declutter Pages
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <Link
            href="/tools/youtube-drama-blocklist"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase' }}>
                80 Channels
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', margin: '6px 0 8px' }}>
                YouTube Drama Blocklist
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Purge reaction streamers, commentary feuds, and retention mills from search and recommendations.
              </p>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
              Open Guide &amp; Handles →
            </div>
          </Link>

          <Link
            href="/tools/youtube-clickbait-keywords"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#f97316', textTransform: 'uppercase' }}>
                61 Phrases
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', margin: '6px 0 8px' }}>
                Clickbait Keyword Filter
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Filter psychological urgency triggers, shouting ALL-CAPS titles, and manufactured emergency hooks.
              </p>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
              Open Filter &amp; Tester →
            </div>
          </Link>

          <Link
            href="/tools/study-allowlist"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase' }}>
                93 Channels
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', margin: '6px 0 8px' }}>
                Study-Only Allowlist
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Turn YouTube into an academic reference library for CS, mathematics, engineering, and university lectures.
              </p>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
              Open Allowlist &amp; Subjects →
            </div>
          </Link>

          <Link
            href="/tools/screen-time-calculator"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>
                Interactive Tool
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', margin: '6px 0 8px' }}>
                Screen Time Calculator
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Audit annual hours lost to recommendations, economic opportunity costs, and calculate focus recovery.
              </p>
            </div>
            <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
              Calculate Focus Score →
            </div>
          </Link>
        </div>
      </section>

      {/* Footer Info Box */}
      <section style={{ marginTop: '56px', padding: '28px', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Built for privacy. Runs 100% in your browser.
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
              All presets, blocklists, and calculations are computed locally on your device without cookies, telemetry, or server tracking.
            </p>
          </div>
          <Link href="/setup" className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>
            Open Preset Decoder →
          </Link>
        </div>
      </section>
    </div>
  )
}
