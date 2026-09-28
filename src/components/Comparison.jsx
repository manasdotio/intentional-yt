import Link from 'next/link'

const rows = [
  ['Main focus', 'Local controls, daily watch budgets, and Focus Lock', 'Hiding suggestion feeds and other distractions', 'Page customization, filtering, and automation'],
  ['Recommendations and Shorts', 'Separate hiding controls', 'Distraction hiding controls', 'Distraction hiding controls'],
  ['Time management', 'Daily playback limits and scheduled blocking', 'Check current listing for available controls', 'Advertises session durations and scheduling'],
  ['Content filters', 'Channel and keyword blocklists', 'Check current listing for available controls', 'Advertises channel, video, comment, and post filters'],
  ['License and cost', 'Free, MIT-licensed source code', 'Check official listing for current terms', 'Free essentials with optional Plus features']
]

export default function Comparison() {
  return (
    <section id="comparison" className="comparison-section">
      <div className="section-head">
        <h2 className="section-title">Intentional YT, Unhook, and UnTrap compared</h2>
        <p className="section-desc">Compare the controls you need. This overview is written by the developer of Intentional YT.</p>
      </div>
      <div className="table-scroll-hint">Scroll horizontally to compare tools</div>
      <div className="table-card" tabIndex={0} role="region" aria-label="Browser extension comparison">
        <table className="comp-table">
          <caption className="comparison-caption">Feature overview, checked September 28, 2026. Plans and browser support can change.</caption>
          <thead><tr><th scope="col" className="comp-col-feat">Capability</th><th scope="col" className="highlight-col comp-col-intentional">Intentional YT</th><th scope="col" className="comp-col-competitor">Unhook</th><th scope="col" className="comp-col-competitor">UnTrap</th></tr></thead>
          <tbody>{rows.map(([label, ...values]) => <tr key={label}><th scope="row">{label}</th>{values.map((value, index) => <td key={index} className={index === 0 ? 'highlight-col' : undefined}>{value}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="comparison-sources">Sources: <a href="https://unhook.app/">Unhook</a>, <a href="https://untrap.app/">UnTrap</a>, and <a href="https://github.com/manasdotio/intentional-yt">Intentional YT source code</a>. This is a feature overview, not a performance benchmark. <Link href="/blog/intentional-yt-vs-unhook-vs-untrap">Read the full comparison</Link>.</p>
    </section>
  )
}
