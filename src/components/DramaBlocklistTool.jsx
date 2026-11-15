'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { CURATED_PACKS } from '../data/curatedPacks'

const DRAMA_CATEGORIES = [
  { id: 'all', label: 'All Channels (80)' },
  { id: 'commentary', label: 'Commentary & Gossip' },
  { id: 'streamers', label: 'Streamer Ragebait' },
  { id: 'mills', label: 'Content Mills & Farms' },
  { id: 'pranks', label: 'Manufactured Pranks' },
  { id: 'kids', label: 'Algorithmic Kids Farms' }
]

const CHANNEL_DETAILS = [
  { handle: '@DramaAlert', category: 'commentary', note: 'Sensational internet feud coverage' },
  { handle: '@Keemstar', category: 'commentary', note: 'Conflict and gossip aggregation' },
  { handle: '@TMZ', category: 'commentary', note: 'Celebrity tabloid paparazzi clips' },
  { handle: '@TheShadeRoom', category: 'commentary', note: 'Social media drama reports' },
  { handle: '@SpillSesh', category: 'commentary', note: 'Influencer controversy updates' },
  { handle: '@NickiSwift', category: 'commentary', note: 'Celebrity downfall retrospectives' },
  { handle: '@PerezHilton', category: 'commentary', note: 'Tabloid gossip commentary' },
  { handle: '@TeaSpill', category: 'commentary', note: 'Beauty community and creator drama' },
  { handle: '@PopCulture', category: 'commentary', note: 'Speculative Hollywood news' },
  { handle: '@GossipBae', category: 'commentary', note: 'Creator rumor channels' },
  { handle: '@ReactionTime', category: 'commentary', note: 'Low-effort reaction clips' },
  { handle: '@HollywoodLife', category: 'commentary', note: 'Celebrity rumors and gossip' },
  { handle: '@DefNoodles', category: 'commentary', note: 'Internet court and debate clips' },
  { handle: '@SloanBella', category: 'commentary', note: 'Celebrity speculation videos' },
  { handle: '@KiannaNaomi', category: 'commentary', note: 'Lifestyle controversy analysis' },
  { handle: '@SunnyV2', category: 'commentary', note: 'Creator downfall video essays' },
  { handle: '@Moon-Real', category: 'commentary', note: 'Dystopian doom essays' },
  { handle: '@InternetAnarchist', category: 'commentary', note: 'Sensational scandal deep-dives' },
  { handle: '@ApertureThinking', category: 'commentary', note: 'Existential crisis clickbait' },
  { handle: '@PatrickCc', category: 'commentary', note: 'Rap and influencer feud essays' },
  { handle: '@MagnatesMedia', category: 'commentary', note: 'Over-dramatized corporate bios' },
  { handle: '@MoreSidemen', category: 'commentary', note: 'Reaction highlights and banter' },
  { handle: '@BillionaireLifestyles', category: 'commentary', note: 'Wealth flex compilation reels' },
  { handle: '@IShowSpeed', category: 'streamers', note: 'High-decibel rage reactions' },
  { handle: '@SpeedLive', category: 'streamers', note: 'Stream scream cutdowns' },
  { handle: '@AdinLive', category: 'streamers', note: 'Controversial streamer interviews' },
  { handle: '@AdinRossHighlights', category: 'streamers', note: 'Stream drama compilations' },
  { handle: '@KaiCenat', category: 'streamers', note: 'High-stimulation stream shorts' },
  { handle: '@xQcOW', category: 'streamers', note: 'Rapid commentary and debate cuts' },
  { handle: '@Sssniperwolf', category: 'streamers', note: 'Uncredited TikTok reactions' },
  { handle: '@SSSniperWolfClips', category: 'streamers', note: 'Shorts clip reuploads' },
  { handle: '@Sneako', category: 'streamers', note: 'Provocative culture war commentary' },
  { handle: '@FreshandFit', category: 'streamers', note: 'Confrontational podcast debates' },
  { handle: '@Neon', category: 'streamers', note: 'IRL streamer argument clips' },
  { handle: '@HasanAbiClips', category: 'streamers', note: 'Heated political livestream cuts' },
  { handle: '@MizkifClips', category: 'streamers', note: 'Twitch interpersonal drama' },
  { handle: '@AsmongoldClips', category: 'streamers', note: 'Outrage farming stream clips' },
  { handle: '@ValkyraeClips', category: 'streamers', note: 'Creator gossip and stream highlights' },
  { handle: '@DharMann', category: 'pranks', note: 'Manufactured moral melodrama' },
  { handle: '@BrentRivera', category: 'pranks', note: 'Staged relational prank shorts' },
  { handle: '@BenAzelart', category: 'pranks', note: 'Extreme stunt challenge loops' },
  { handle: '@StokesTwins', category: 'pranks', note: 'Clickbait identical twin setups' },
  { handle: '@StevenHe', category: 'pranks', note: 'Repetitive emotional damage skits' },
  { handle: '@TsurikiShow', category: 'pranks', note: 'Sensory prank shorts' },
  { handle: '@SmilesFamily', category: 'pranks', note: 'Staged family argument sketches' },
  { handle: '@CollinsKey', category: 'pranks', note: 'Hyper-kinetic DIY challenges' },
  { handle: '@Airrack', category: 'pranks', note: 'Extreme retention-engineered stunts' },
  { handle: '@TopperGuild', category: 'pranks', note: 'Food wasting challenge shorts' },
  { handle: '@AlanChikinChow', category: 'pranks', note: 'High-speed character skit loops' },
  { handle: '@MrBeast2', category: 'pranks', note: 'Secondary retention test shorts' },
  { handle: '@BeastReacts', category: 'pranks', note: 'Reaction speedrun content' },
  { handle: '@ZackDFilms', category: 'mills', note: 'Uncanny 3D medical animation reels' },
  { handle: '@MasterGoo', category: 'mills', note: 'Sensory kinetic slime reels' },
  { handle: '@WatchMojo', category: 'mills', note: 'Repetitive top 10 list filler' },
  { handle: '@MsMojo', category: 'mills', note: 'Pop culture countdown lists' },
  { handle: '@DailyMail', category: 'mills', note: 'Sensational tabloid video feed' },
  { handle: '@TheSun', category: 'mills', note: 'Clickbait newspaper clips' },
  { handle: '@BuzzFeedVideo', category: 'mills', note: 'Low-information lifestyle tests' },
  { handle: '@TroomTroom', category: 'mills', note: 'Impractical life hack compilations' },
  { handle: '@5MinuteCrafts', category: 'mills', note: 'Algorithmic DIY content mill' },
  { handle: '@123GO', category: 'mills', note: 'Brightly colored school prank reels' },
  { handle: '@BrightSide', category: 'mills', note: 'Speculative curiosity listicles' },
  { handle: '@ActuallyHappen', category: 'mills', note: 'Manufactured animated stories' },
  { handle: '@Truly', category: 'mills', note: 'Sensational human curiosity stories' },
  { handle: '@BoredPanda', category: 'mills', note: 'Reddit post voiceover scrapes' },
  { handle: '@LADbibleTV', category: 'mills', note: 'Viral reupload clips' },
  { handle: '@UNILAD', category: 'mills', note: 'Viral social media cuts' },
  { handle: '@VT', category: 'mills', note: 'Social aggregation content mill' },
  { handle: '@JungleBeat', category: 'mills', note: 'Repetitive slapstick animation loops' },
  { handle: '@Wengie', category: 'mills', note: 'Slime and makeup DIY shorts' },
  { handle: '@CraftySlimeCreator', category: 'mills', note: 'Infinite kinetic slime reels' },
  { handle: '@LankyBox', category: 'kids', note: 'Over-stimulating scream gaming' },
  { handle: '@LankyBoxWorld', category: 'kids', note: 'Secondary hyperactive clip feed' },
  { handle: '@Cocomelon', category: 'kids', note: 'Hyper-stimulating nursery loop' },
  { handle: '@RyanWorld', category: 'kids', note: 'Toy unboxing consumerism reels' },
  { handle: '@VladandNiki', category: 'kids', note: 'Fast-cut toy advertisement videos' },
  { handle: '@DianaandRoma', category: 'kids', note: 'Repetitive toddler sketch loops' },
  { handle: '@KidsDianaShow', category: 'kids', note: 'Infinite loop sensory shorts' },
  { handle: '@LikeNastya', category: 'kids', note: 'Consumer lifestyle kid videos' },
  { handle: '@BabyBus', category: 'kids', note: 'Automated 2D preschool factory' }
]

export default function DramaBlocklistTool() {
  const [selectedCat, setSelectedCat] = useState('all')
  const [search, setSearch] = useState('')
  const [copiedHandles, setCopiedHandles] = useState(false)
  const [copiedSingle, setCopiedSingle] = useState(null)

  const dramaPack = CURATED_PACKS.find(p => p.id === 'brainrot-drama-purge') || CURATED_PACKS[0]

  const filteredChannels = useMemo(() => {
    return CHANNEL_DETAILS.filter(item => {
      const matchCat = selectedCat === 'all' || item.category === selectedCat
      const matchSearch = item.handle.toLowerCase().includes(search.toLowerCase()) ||
                          item.note.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [selectedCat, search])

  const handleCopyAll = async () => {
    try {
      const text = CHANNEL_DETAILS.map(c => c.handle).join('\n')
      await navigator.clipboard.writeText(text)
      setCopiedHandles(true)
      setTimeout(() => setCopiedHandles(false), 2500)
    } catch (_) {}
  }

  const handleCopySingle = async (handle) => {
    try {
      await navigator.clipboard.writeText(handle)
      setCopiedSingle(handle)
      setTimeout(() => setCopiedSingle(null), 1800)
    } catch (_) {}
  }

  const handleDownloadJson = () => {
    const payload = {
      name: 'Brainrot and Drama Channel Blocklist',
      version: 1,
      generated: new Date().toISOString(),
      channels: CHANNEL_DETAILS.map(c => c.handle)
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'intentional-yt-drama-blocklist.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ margin: '30px 0' }}>
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
                background: '#ef4444'
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase' }}>
              80 Vetted Handles Included
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Blocks matches across video recommendations, sidebar suggestions, and search result cards.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={handleCopyAll}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            {copiedHandles ? '✓ Copied 80 Handles' : 'Copy All Handles'}
          </button>
          <button
            onClick={handleDownloadJson}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px' }}
          >
            Download .JSON
          </button>
          <Link
            href={`/setup#s=${dramaPack.code}`}
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
          {DRAMA_CATEGORIES.map(cat => (
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
          placeholder="Filter channels (e.g. @SunnyV2, gossip)..."
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

      {/* Channel Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 180px 1fr 100px',
            padding: '12px 18px',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border)',
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}
        >
          <div>Handle</div>
          <div>Category</div>
          <div>Why It Is Flagged</div>
          <div style={{ textAlign: 'right' }}>Action</div>
        </div>

        <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
          {filteredChannels.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No channels match your filter.
            </div>
          ) : (
            filteredChannels.map(item => (
              <div
                key={item.handle}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 180px 1fr 100px',
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '13px',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontFamily: 'var(--site-mono)', fontWeight: '600', color: 'var(--text)' }}>
                  {item.handle}
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  {item.note}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleCopySingle(item.handle)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: copiedSingle === item.handle ? 'var(--accent)' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedSingle === item.handle ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
