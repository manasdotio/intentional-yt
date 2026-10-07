'use client'
import { useState } from 'react'
import { Play, Search } from 'lucide-react'

export default function BeforeAfter() {
  const [enabled, setEnabled] = useState(false)
  return <section id="before-after" className="before-after-section" aria-labelledby="before-after-title">
    <div className="section-head"><h2 id="before-after-title" className="section-title">Keep watching what you came for.</h2><p className="section-desc">Hide the suggestions and Shorts that send you somewhere else.</p></div>
    <div className="before-after-switch" role="group" aria-label="Compare YouTube with and without blocking"><button type="button" aria-pressed={!enabled} onClick={() => setEnabled(false)}>Without Intentional YT</button><button type="button" aria-pressed={enabled} onClick={() => setEnabled(true)}>With Intentional YT</button></div>
    <div className={'watch-comparison' + (enabled ? ' is-calm' : '')} aria-hidden="true">
      <div className="watch-comparison-bar"><span><b>▶</b> YouTube</span><span className="watch-comparison-search"><Search size={15} /> A walk in the mountains</span><span className="watch-comparison-dot" /></div>
      <div className="watch-comparison-body"><div className="watch-comparison-main"><div className="watch-comparison-video"><img src="/screenshots/hero-calm-landscape.webp" alt="" width="1000" height="667" loading="lazy" /><Play size={38} fill="currentColor" /></div><strong>A walk in the mountains</strong><span>Just the video you chose.</span>
        {!enabled && <div className="watch-comparison-shorts"><strong>Shorts</strong><div>{['A quick detour', 'One more clip', 'Keep scrolling'].map(label => <span key={label}><Play size={21} /><small>{label}</small></span>)}</div></div>}
      </div>{!enabled && <div className="watch-comparison-sidebar"><strong>Up next</strong>{['Something else to watch', 'You might also like', 'Another recommendation'].map((label,i) => <div key={label}><span className={'suggestion-thumb suggestion-thumb-' + i}><Play size={18} /></span><span>{label}<small>Suggested for you</small></span></div>)}</div>}</div>
    </div>
    <p className="watch-comparison-caption" aria-live="polite">{enabled ? 'Recommendations and Shorts are hidden. Your selected video stays.' : 'Recommendations and Shorts appear around the video.'}<span>Illustrated example of the YouTube website.</span></p>
  </section>
}
