import { ShieldCheck, SlidersHorizontal, Check, Play, Search } from 'lucide-react'

// Decorative examples; real interactive controls remain in the simulator.
export default function ProductArt({ kind = 'feed' }) {
  return <div className={`product-art product-art-${kind}`} aria-hidden="true">
    {kind === 'feed' && <div className="art-browser"><div className="art-browser-bar"><i /><i /><i /><span>youtube.com</span></div><div className="art-search"><Search size={14} /> Find what you came for</div><div className="art-video"><img src="/screenshots/hero-calm-landscape.webp" alt="" width="1000" height="667" loading="lazy" /><span><Play size={22} fill="currentColor" /></span></div><div className="art-stamp"><Check size={14} /> Recommendations hidden</div></div>}
    {kind === 'time' && <><div className="art-timer"><span><strong>45</strong><small>MIN / DAY</small></span></div><span className="art-time-label">Your time. Your limit.</span><div className="art-time-options"><span>30 min</span><strong>45 min</strong><span>60 min</span></div></>}
    {kind === 'filters' && <div className="art-filter-panel"><div><SlidersHorizontal size={20} /><strong>Your filters</strong></div><span className="art-filter-label">CHANNELS & KEYWORDS</span><span className="art-filter-chip">@examplecreator <b>×</b></span><span className="art-filter-chip">spoiler <b>×</b></span><small><Check size={14} /> A feed that fits you</small></div>}
    {kind === 'compare' && <div className="art-compare-panels">{['Hide', 'Limit', 'Focus'].map((label, i) => <div key={label}><span>{['01', '02', '03'][i]}</span>{i === 0 ? <Play size={24} /> : i === 1 ? <SlidersHorizontal size={24} /> : <ShieldCheck size={24} />}<strong>{label}</strong><i /></div>)}</div>}
  </div>
}
