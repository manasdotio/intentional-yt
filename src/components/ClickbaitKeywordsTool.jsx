'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { CURATED_PACKS } from '../data/curatedPacks'

const KEYWORD_CATEGORIES = [
  { id: 'all', label: 'All Keywords (61)' },
  { id: 'urgency', label: 'Urgency & FOMO' },
  { id: 'shock', label: 'Shock & Sensational' },
  { id: 'catastrophe', label: 'Crisis & Melodrama' },
  { id: 'gossip', label: 'Gossip & Confrontation' },
  { id: 'stunts', label: 'Retention Stunts' }
]

const KEYWORD_DETAILS = [
  { word: "YOU WON'T BELIEVE", category: 'urgency', note: 'Artificial curiosity gap' },
  { word: "YOU WONT BELIEVE", category: 'urgency', note: 'Unpunctuated variation' },
  { word: 'WATCH BEFORE ITS DELETED', category: 'urgency', note: 'False scarcity pressure' },
  { word: "WATCH BEFORE IT'S DELETED", category: 'urgency', note: 'Punctuated scarcity trigger' },
  { word: 'DONT WATCH THIS', category: 'urgency', note: 'Reverse psychology hook' },
  { word: "DON'T WATCH THIS", category: 'urgency', note: 'Punctuated reverse psychology' },
  { word: 'MUST WATCH', category: 'urgency', note: 'Forced imperative prompt' },
  { word: 'FINALLY REVEALED', category: 'urgency', note: 'Delayed disclosure trick' },
  { word: 'NO ONE IS TALKING ABOUT', category: 'urgency', note: 'Conspiracy and secret claim' },
  { word: 'SECRET REVEALED', category: 'urgency', note: 'Manufactured insider knowledge' },
  { word: 'OMG', category: 'shock', note: 'Loud exclamation hook' },
  { word: 'SHOCKING', category: 'shock', note: 'Adjective bait' },
  { word: 'INSANE', category: 'shock', note: 'Hyperbolic description' },
  { word: 'UNBELIEVABLE', category: 'shock', note: 'Exaggerated reaction claim' },
  { word: 'CANT MAKE THIS UP', category: 'shock', note: 'Manufactured reality bias' },
  { word: "CAN'T MAKE THIS UP", category: 'shock', note: 'Punctuated variation' },
  { word: 'CAUGHT ON CAMERA', category: 'shock', note: 'Paparazzi framing' },
  { word: 'CAUGHT IN 4K', category: 'shock', note: 'Gotcha evidence trope' },
  { word: '3AM', category: 'shock', note: 'Spooky myth format' },
  { word: 'IN REAL LIFE', category: 'shock', note: 'Video game to reality trope' },
  { word: 'TRY NOT TO LAUGH', category: 'shock', note: 'Gamified reaction bait' },
  { word: 'EMOTIONAL', category: 'shock', note: 'Manufactured sentiment label' },
  { word: 'GONE WRONG', category: 'catastrophe', note: 'Disaster foreshadowing' },
  { word: 'RUINED MY LIFE', category: 'catastrophe', note: 'Fatalistic melodrama' },
  { word: 'COPS CALLED', category: 'catastrophe', note: 'False legal authority prompt' },
  { word: 'POLICE INVOLVED', category: 'catastrophe', note: 'Manufactured criminal threat' },
  { word: 'I ALMOST DIED', category: 'catastrophe', note: 'Life-threatening exaggeration' },
  { word: 'WORST MISTAKE', category: 'catastrophe', note: 'Regret bait' },
  { word: 'BIGGEST MISTAKE', category: 'catastrophe', note: 'Regret superlative' },
  { word: 'LOST EVERYTHING', category: 'catastrophe', note: 'Catastrophic loss claim' },
  { word: 'DESTROYED', category: 'catastrophe', note: 'Hyperbolic conflict resolution' },
  { word: 'I REGRET THIS', category: 'catastrophe', note: 'Personal failure lure' },
  { word: 'WE BROKE UP', category: 'catastrophe', note: 'Relationship melodrama' },
  { word: 'CHEATING ON', category: 'catastrophe', note: 'Infidelity allegation' },
  { word: 'LEAVING FOREVER', category: 'catastrophe', note: 'False retirement announcement' },
  { word: 'END OF AN ERA', category: 'catastrophe', note: 'Artificial milestone drama' },
  { word: 'APOLOGY VIDEO', category: 'catastrophe', note: 'Controversy capitalisation' },
  { word: 'WE NEED TO TALK', category: 'catastrophe', note: 'Ominous channel address' },
  { word: 'WHY I QUIT', category: 'catastrophe', note: 'Channel abandonment clickbait' },
  { word: 'MY FINAL MESSAGE', category: 'catastrophe', note: 'Morbid finality trope' },
  { word: 'IM SORRY', category: 'catastrophe', note: 'Guilt reflex trap' },
  { word: "I'M SORRY", category: 'catastrophe', note: 'Punctuated guilt reflex' },
  { word: 'CANCELLED', category: 'catastrophe', note: 'Public outrage bait' },
  { word: 'EXPOSED', category: 'gossip', note: 'Alleged downfall investigation' },
  { word: 'THE TRUTH ABOUT', category: 'gossip', note: 'Subjective exposé framing' },
  { word: 'HE CONFRONTED ME', category: 'gossip', note: 'Manufactured physical face-off' },
  { word: 'DRAMA EXPLAINED', category: 'gossip', note: 'Parasocial conflict digest' },
  { word: 'WHAT REALLY HAPPENED', category: 'gossip', note: 'Revisionist gossip hook' },
  { word: 'HE ADMITTED IT', category: 'gossip', note: 'Forced confession phrasing' },
  { word: 'SHE ADMITTED IT', category: 'gossip', note: 'Forced confession variant' },
  { word: 'SHE DID WHAT', category: 'gossip', note: 'Indignant gossip prompt' },
  { word: 'HE DID WHAT', category: 'gossip', note: 'Indignant gossip variant' },
  { word: 'GONE TOO FAR', category: 'gossip', note: 'Moral boundary violation hook' },
  { word: 'BANNED FROM', category: 'gossip', note: 'Trespassing and exclusion trope' },
  { word: 'KICKED OUT', category: 'gossip', note: 'Security confrontation claim' },
  { word: 'PRANK', category: 'stunts', note: 'Staged harassment comedy' },
  { word: 'I SPENT 24 HOURS', category: 'stunts', note: 'MrBeast retention formula' },
  { word: 'SURVIVING 100 DAYS', category: 'stunts', note: 'Gaming/survival challenge trope' },
  { word: 'I GAVE AWAY', category: 'stunts', note: 'Charity flex retention hook' },
  { word: 'LAST TO LEAVE', category: 'stunts', note: 'Endurance contest format' },
  { word: 'NEVER DO THIS', category: 'urgency', note: 'Fear-based prohibition' }
]

export default function ClickbaitKeywordsTool() {
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [copiedWords, setCopiedWords] = useState(false)
  const [testTitle, setTestTitle] = useState("I SPENT 24 HOURS AT A HAUNTED HOTEL (GONE WRONG) - HE ADMITTED IT!!")

  const clickbaitPack = CURATED_PACKS.find(p => p.id === 'clickbait-ragebait-cleanser') || CURATED_PACKS[1]

  const filteredWords = useMemo(() => {
    return KEYWORD_DETAILS.filter(item => {
      const matchCat = selectedCat === 'all' || item.category === selectedCat
      const matchSearch = item.word.toLowerCase().includes(search.toLowerCase()) ||
                          item.note.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [selectedCat, search])

  // Real-time title analysis
  const matchedTriggers = useMemo(() => {
    const upper = testTitle.toUpperCase()
    return KEYWORD_DETAILS.filter(item => upper.includes(item.word))
  }, [testTitle])

  const clickbaitScore = useMemo(() => {
    if (!testTitle.trim()) return 0
    let score = matchedTriggers.length * 28
    if (/[!?]{2,}/.test(testTitle)) score += 15
    const letters = testTitle.replace(/[^a-zA-Z]/g, '')
    if (letters.length > 0) {
      const caps = letters.replace(/[^A-Z]/g, '').length
      if (caps / letters.length > 0.6) score += 25
    }
    return Math.min(100, Math.round(score))
  }, [testTitle, matchedTriggers])

  const cleanTitle = useMemo(() => {
    if (!testTitle.trim()) return ''
    let cleaned = testTitle
      .replace(/[!?]{2,}/g, '.')
      .replace(/[\(\[\{].*?(GONE WRONG|EXPOSED|3AM|INSANE|COPS CALLED|NOT CLICKBAIT).*?[\)\]\}]/gi, '')
    cleaned = cleaned.trim().toLowerCase()
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    }
    return cleaned
  }, [testTitle])

  const handleCopyAll = async () => {
    try {
      const text = KEYWORD_DETAILS.map(k => k.word).join(', ')
      await navigator.clipboard.writeText(text)
      setCopiedWords(true)
      setTimeout(() => setCopiedWords(false), 2500)
    } catch (_) {}
  }

  const handleDownloadJson = () => {
    const payload = {
      name: 'YouTube Clickbait and Ragebait Keyword Filter',
      version: 1,
      generated: new Date().toISOString(),
      keywords: KEYWORD_DETAILS.map(k => k.word)
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'intentional-yt-clickbait-keywords.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ margin: '30px 0' }}>
      {/* Live Title Tester */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '30px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em' }}>
              Interactive Sandbox
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: '700' }}>
              Live Clickbait Headline Tester
            </h3>
          </div>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: '800',
              fontSize: '13px',
              background: clickbaitScore > 50 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: clickbaitScore > 50 ? '#ef4444' : '#22c55e',
              border: `1px solid ${clickbaitScore > 50 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
            }}
          >
            Clickbait Score: {clickbaitScore}/100
          </div>
        </div>

        <input
          type="text"
          value={testTitle}
          onChange={(e) => setTestTitle(e.target.value)}
          placeholder="Paste any YouTube video title to check..."
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '14px',
            color: 'var(--text)',
            marginBottom: '14px'
          }}
        />

        {matchedTriggers.length > 0 ? (
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Detected Trigger Phrases:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {matchedTriggers.map(item => (
                <span
                  key={item.word}
                  style={{
                    background: 'rgba(249, 115, 22, 0.15)',
                    color: '#f97316',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  ⚠ {item.word} ({item.note})
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#22c55e', margin: '0 0 14px' }}>
            ✓ No known psychological clickbait keywords detected.
          </p>
        )}

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          <strong>Sanitized Title Preview:</strong> <span style={{ color: 'var(--text)' }}>{cleanTitle || 'No title entered'}</span>
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '30px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f97316'
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#f97316', textTransform: 'uppercase' }}>
              61 Keywords in Filter Pack
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Intentional YT hides or dims matching cards across recommendations, sidebars, and search feeds.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={handleCopyAll}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            {copiedWords ? '✓ Copied All Words' : 'Copy All Keywords'}
          </button>
          <button
            onClick={handleDownloadJson}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            Download .JSON
          </button>
          <Link
            href={`/setup#s=${clickbaitPack.code}`}
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            1-Click Extension Setup →
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {KEYWORD_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              style={{
                background: selectedCat === cat.id ? 'var(--text)' : 'var(--surface)',
                color: selectedCat === cat.id ? 'var(--bg)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter keywords (e.g. EXPOSED, 3AM)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '7px 14px',
            fontSize: '13px',
            color: 'var(--text)',
            minWidth: '260px'
          }}
        />
      </div>

      {/* Keywords Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '14px'
        }}
      >
        {filteredWords.map(item => (
          <div
            key={item.word}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--site-mono)',
                  fontWeight: '700',
                  fontSize: '13px',
                  color: 'var(--text)'
                }}
              >
                &ldquo;{item.word}&rdquo;
              </span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  textTransform: 'uppercase'
                }}
              >
                {item.category}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {item.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
