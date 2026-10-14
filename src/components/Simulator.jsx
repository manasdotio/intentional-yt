'use client'

import { useState } from 'react'
import Link from 'next/link'

const PRESETS = {
  balanced: { home: true, recommendations: true, shorts: true, subscriptions: false, comments: false, thumbnails: false, autoplay: true, grayscale: false },
  zen: { home: true, recommendations: true, shorts: true, subscriptions: true, comments: true, thumbnails: true, autoplay: true, grayscale: false },
  player: { home: true, recommendations: true, shorts: true, subscriptions: false, comments: true, thumbnails: false, autoplay: true, grayscale: false }
}
const PRESET_NAMES = { balanced: 'Balanced', zen: 'Zen', player: 'Video Only', custom: 'Custom' }
const TOGGLES = { home: 'Hide home feed', recommendations: 'Hide recommended sidebar', shorts: 'Hide Shorts', subscriptions: 'Hide subscriptions feed', comments: 'Hide comments', thumbnails: 'Hide thumbnails', autoplay: 'Disable autoplay', grayscale: 'Grayscale' }
const VIDEOS = [
  { id: 'lesson', title: 'Understanding vector fields', channel: 'Learning Lab', handle: '@learninglab', duration: '12:00' },
  { id: 'drawing', title: 'Draw a mountain landscape', channel: 'Sketch Desk', handle: '@sketchdesk', duration: '18:00' },
  { id: 'reaction', title: 'Reaction to a surprising experiment', channel: 'Learning Lab Daily', handle: '@learninglabdaily', duration: '8:00' },
  { id: 'short', title: 'One quick drawing tip', channel: 'Sketch Desk', handle: '@sketchdesk', duration: '0:30', shorts: true }
]
const WATCH_TIME = 'Counts playback across YouTube tabs, including background tabs. Simultaneous videos add together. Counting continues when protections are off. Resets at midnight.'

function matchesKeyword(title, keyword) {
  const value = keyword.trim().toLowerCase()
  if (!value) return false
  if (value.length > 3) return title.toLowerCase().includes(value)
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp('(?:^|[\\s.,!?:;"\'()[\\]{}<>/\\\\#@\\-_])(' + escaped + ')(?:$|[\\s.,!?:;"\'()[\\]{}<>/\\\\#@\\-_])', 'i').test(title)
}

export default function Simulator() {
  const [enabled, setEnabled] = useState(true)
  const [preset, setPreset] = useState('balanced')
  const [controls, setControls] = useState({ ...PRESETS.balanced })
  const [view, setView] = useState('home')
  const [channel, setChannel] = useState('')
  const [keyword, setKeyword] = useState('')
  const [channels, setChannels] = useState([])
  const [keywords, setKeywords] = useState([])
  const [dailyLimit, setDailyLimit] = useState(false)
  const [limit, setLimit] = useState(60)
  const [reminder, setReminder] = useState(false)
  const [minutes, setMinutes] = useState(0)
  const [notice, setNotice] = useState('')
  const reached = enabled && dailyLimit && minutes >= limit
  const almost = enabled && dailyLimit && minutes < limit && limit - minutes <= 5
  const hidden = key => enabled && controls[key]
  const filtered = video => enabled && (channels.some(value => [video.channel.toLowerCase(), video.handle.toLowerCase()].includes(value.toLowerCase())) || keywords.some(value => matchesKeyword(video.title, value)))
  const cards = VIDEOS.filter(video => !(video.shorts && hidden('shorts')) && !filtered(video))
  const choosePreset = value => { setPreset(value); setControls({ ...PRESETS[value] }); setEnabled(true) }
  const toggle = key => { setControls(previous => ({ ...previous, [key]: !previous[key] })); setPreset('custom') }
  const addFilter = (event, kind) => {
    event.preventDefault()
    const value = (kind === 'channel' ? channel : keyword).trim()
    if (!value) return
    const update = kind === 'channel' ? setChannels : setKeywords
    update(previous => previous.some(item => item.toLowerCase() === value.toLowerCase()) ? previous : [...previous, value])
    if (kind === 'channel') setChannel(''); else setKeyword('')
    setView('search')
    setNotice('Filter added to the sample search results.')
  }
  const advance = () => {
    if (reached) return
    const next = enabled && dailyLimit ? Math.min(minutes + 5, limit) : minutes + 5
    setMinutes(next)
    setNotice(enabled && reminder && Math.floor(next / 30) > Math.floor(minutes / 30) ? 'Example break reminder: take a moment away from the video.' : '')
  }
  const card = video => <article className="demo-video-card" key={video.id} data-video={video.id}>
    <div className="demo-thumbnail">{hidden('thumbnails') ? <span>Thumbnail hidden</span> : <img src="/screenshots/hero-calm-landscape.webp" alt="" width="1000" height="667" loading="lazy" />}<span className="demo-duration">{video.duration}</span></div>
    <strong>{video.title}</strong><span>{video.channel}{video.shorts ? ' · Short' : ''}</span>
  </article>

  return <section id="simulator" className="simulator-v2" aria-labelledby="simulator-title">
    <div className="section-head"><h2 id="simulator-title" className="section-title">Try the controls</h2><p className="section-desc">An illustrated preview with fictional videos. These settings only change this demo, not YouTube or your installed extension.</p></div>
    <div className="demo-toolbar">
      <label>Preset <select aria-label="Demo preset" value={preset} onChange={event => choosePreset(event.target.value)}>{Object.entries(PRESET_NAMES).map(([value, name]) => <option key={value} value={value} disabled={value === 'custom'}>{name}</option>)}</select></label>
      <label className="demo-control-switch"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Protections on</label>
      <span role="status">{enabled ? PRESET_NAMES[preset] : 'Protections off'}</span>
    </div>
    <div className="demo-layout">
      <div className={'demo-youtube' + (hidden('grayscale') ? ' demo-grayscale' : '')}>
        <div className="demo-youtube-header"><strong><span aria-hidden="true">▶</span> YouTube preview</strong><label>Page <select aria-label="Preview page" value={view} onChange={event => setView(event.target.value)}><option value="home">Home</option><option value="search">Search results</option><option value="subscriptions">Subscriptions</option><option value="watch">Watch video</option></select></label></div>
        <div className="demo-preview-body">
          {view === 'watch' ? <>
            <div className="demo-player"><img src="/screenshots/hero-calm-landscape.webp" alt="Illustrated video preview of a mountain landscape" width="1000" height="667" loading="lazy" /><span>Sample video · {hidden('autoplay') ? 'Autoplay off' : 'Autoplay on'}</span>{reached && <div className="demo-limit-overlay" role="status"><strong>Daily limit reached</strong><p>Playback would pause here.</p></div>}</div>
            <h3>Understanding vector fields</h3><p>Learning Lab · Fictional sample video</p>
            {almost && <p className="demo-notice" role="status">Example warning: {limit - minutes} minutes left today.</p>}
            {!hidden('recommendations') && <section aria-label="Recommended videos"><h4>Up next</h4><div className="demo-video-grid">{cards.filter(video => video.id !== 'lesson').map(card)}</div></section>}
            {!hidden('comments') && <section className="demo-comments"><h4>Comments</h4><p>Sample viewer: This explanation helped me understand the lesson.</p></section>}
          </> : (view === 'home' && hidden('home')) || (view === 'subscriptions' && hidden('subscriptions')) ? <div className="demo-empty"><strong>{view === 'home' ? 'Home feed hidden' : 'Subscriptions feed hidden'}</strong><p>You can still search for a video or open a direct link.</p><button className="btn btn-secondary" type="button" onClick={() => setView('search')}>See sample search results</button></div> : <><h3>{view === 'search' ? 'Sample search results' : view === 'subscriptions' ? 'Sample subscriptions' : 'Sample home feed'}</h3><div className="demo-video-grid">{cards.map(card)}</div>{!cards.length && <p role="status">Your filters hide these sample results. Remove a filter to bring them back.</p>}</>}
        </div>
        <p className="demo-caption">Preview of selected controls. Actual YouTube layouts can vary.</p>
      </div>
      <div className="demo-controls">
        <section><h3>Choose what to hide</h3><div className="demo-toggles">{Object.entries(TOGGLES).map(([key, label]) => <label key={key}><input type="checkbox" checked={controls[key]} onChange={() => toggle(key)} />{label}</label>)}</div></section>
        <section><h3>Try a filter</h3><p>Channel names and handles match exactly. Try “Learning Lab”; “Learning Lab Daily” stays visible.</p>
          <form onSubmit={event => addFilter(event, 'channel')}><label htmlFor="demo-channel">Channel name or handle</label><div className="demo-input-row"><input id="demo-channel" value={channel} onChange={event => setChannel(event.target.value)} maxLength={100} placeholder="Learning Lab" /><button type="submit" className="btn btn-secondary">Add</button></div></form>
          <div className="demo-filter-list">{channels.map(value => <button type="button" key={value} onClick={() => setChannels(items => items.filter(item => item !== value))} aria-label={'Remove channel ' + value}>{value} ×</button>)}</div>
          <form onSubmit={event => addFilter(event, 'keyword')}><label htmlFor="demo-keyword">Title keyword</label><div className="demo-input-row"><input id="demo-keyword" value={keyword} onChange={event => setKeyword(event.target.value)} maxLength={100} placeholder="reaction" /><button type="submit" className="btn btn-secondary">Add</button></div></form>
          <div className="demo-filter-list">{keywords.map(value => <button type="button" key={value} onClick={() => setKeywords(items => items.filter(item => item !== value))} aria-label={'Remove keyword ' + value}>{value} ×</button>)}</div>
        </section>
        <section><h3>Try a watch budget</h3>
          <label className="demo-control-switch"><input type="checkbox" checked={dailyLimit} onChange={event => { setDailyLimit(event.target.checked); setView('watch') }} />Daily limit</label>
          <label className="demo-budget">Daily budget <select aria-label="Demo daily budget" value={limit} onChange={event => setLimit(Number(event.target.value))}>{[15, 30, 45, 60].map(value => <option key={value} value={value}>{value} min</option>)}</select></label>
          <label className="demo-control-switch"><input type="checkbox" checked={reminder} onChange={event => setReminder(event.target.checked)} />Break reminder every 30 minutes</label>
          <p className="demo-counter" aria-live="polite">Sample watch time: <strong>{minutes} min</strong>{dailyLimit ? ' / ' + limit + ' min' : ' · No daily limit'}</p>
          <div className="demo-time-actions"><button type="button" className="btn btn-primary" disabled={reached} onClick={() => { setView('watch'); advance() }}>Simulate 5 minutes</button><button type="button" className="btn btn-secondary" onClick={() => { setMinutes(0); setNotice('Sample counter reset.') }}>Reset sample time</button></div>
          <p>{WATCH_TIME}</p><p>In the extension, the limit overlay may offer “Finish this video” or “Dismiss for today.” Focus Lock can add a delay before protected changes.</p>
          <Link href="/blog/set-youtube-daily-time-limit">How daily limits work →</Link>
        </section>
      </div>
    </div>
    <p className="demo-notice" role="status">{notice}</p>
  </section>
}
