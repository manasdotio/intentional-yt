'use client'
import { useRef, useState } from 'react'
const features = [
  { key: 'limits', label: 'Daily limits', title: 'Decide when to call it a day.', copy: 'Set a daily watch limit and playback pauses when you reach it. The timer counts time spent watching, so leaving a tab open won’t use up your limit.', detail: 'Want a heads-up first? Add a break reminder.', alt: 'Actual Focus tab showing a 45-minute daily limit and a reminder every 30 minutes' },
  { key: 'filters', label: 'Channel filters', title: 'Skip the channels you’re tired of seeing.', copy: 'Add a channel name, handle, or title keyword to your filters. Matching video cards disappear from supported feeds and search results.', detail: 'Remove an entry whenever you want to see those videos again.', alt: 'Actual Filters tab with an example channel and the keyword spoiler' },
  { key: 'schedule', label: 'Focus schedules', title: 'Keep YouTube out of study hours.', copy: 'Pick the days and hours when you want blocking to run. Use Strict Focus or block YouTube entirely during that time.', detail: 'Focus Lock can also add a PIN and a cooldown before settings change.', alt: 'Actual Scheduled Focus Sessions controls with a weekday study schedule from 9 AM to noon' }
]
export default function Features() {
  const [selected, setSelected] = useState(0)
  const tabs = useRef([])
  const feature = features[selected]
  function navigate(event, index) {
    const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null
    if (next === null) return
    event.preventDefault(); setSelected(next); tabs.current[next]?.focus()
  }
  return <section id="features" className="real-features"><div className="section-head"><h2 className="section-title">A few controls that make a difference.</h2><p className="section-desc">Use the ones you need. Leave the rest alone.</p></div>
    <div className="real-feature-tabs" role="tablist" aria-label="Extension features">{features.map((item, index) => <button type="button" key={item.key} ref={el => { tabs.current[index] = el }} role="tab" id={'feature-tab-' + item.key} aria-controls={'feature-panel-' + item.key} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => navigate(event, index)}>{item.label}</button>)}</div>
    <div className="real-feature-panel" key={feature.key} role="tabpanel" id={'feature-panel-' + feature.key} aria-labelledby={'feature-tab-' + feature.key} tabIndex={0}><div className="real-feature-copy"><h3>{feature.title}</h3><p>{feature.copy}</p><p>{feature.detail}</p><a href={'/screenshots/product-' + feature.key + '.webp'} target="_blank" rel="noopener noreferrer">Open full-size screenshot ↗</a></div><figure><img src={'/screenshots/product-' + feature.key + '.webp'} alt={feature.alt} width="1080" height="1060" loading="lazy" /><figcaption>Actual extension · Example settings</figcaption></figure></div>
  </section>
}
