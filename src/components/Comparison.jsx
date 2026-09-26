import React from 'react'

export default function Comparison() {
  return (
    <section id="comparison" className="comparison-section">
      <div className="section-head">
        <div className="section-eyebrow">Unhook &amp; Untrap Alternative</div>
        <h2 className="section-title">Intentional YT vs Unhook vs Untrap</h2>
        <p className="section-desc">
          Looking for a modern, open source Unhook alternative or Untrap alternative? See how Intentional YT compares against legacy YouTube distraction blockers.
        </p>
      </div>

      <div className="table-card">
        <table className="comp-table">
          <thead>
            <tr>
              <th style={{ minWidth: '220px' }}>Key Capability</th>
              <th className="highlight-col" style={{ minWidth: '220px' }}>Intentional YT</th>
              <th style={{ minWidth: '180px' }}>Unhook</th>
              <th style={{ minWidth: '180px' }}>Untrap</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="table-feat-name">Pricing &amp; Open Source</span>
                <span className="table-feat-desc">Is the code auditable and free without paywalls?</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ 100% Free &amp; Open Source</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Permissive MIT license, zero paid tiers</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Closed Source</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Free but proprietary codebase</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Freemium</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Locks advanced features behind paywall</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Zero-Flash Content Blocking</span>
                <span className="table-feat-desc">Does distracting content briefly appear before vanishing?</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Instant (0ms Flicker)</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Injected at document_start before paint</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Flickers on Load</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Feeds flash for a fraction of a second</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Occasional Flash</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>DOM mutation delays on fast loads</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Blocks YouTube Shorts</span>
                <span className="table-feat-desc">Removes Shorts shelves, sidebar tabs, search results &amp; player links</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Complete Suppression</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Deep suppression across all views</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Incomplete</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Frequently reappears during SPA navigation</div>
              </td>
              <td>
                <span className="status-badge status-good">✓ Supported</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Hides Shorts entry points</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Daily Watch Timer &amp; Limits</span>
                <span className="table-feat-desc">Mindful toast reminders and automated daily playback limits</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Built-in</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Gentle interval toasts &amp; daily cap</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>No watch time tracking or timers</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>No playback time limiter</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Anti-Doomscroll Feed Limit</span>
                <span className="table-feat-desc">Limits homepage to 15 calm videos &amp; stops infinite scroll with a banner</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Built-in (15 Videos)</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Peaceful caught-up banner</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>All-or-nothing toggle only</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>No batching or infinite scroll stop</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Channel &amp; Keyword Blocklists</span>
                <span className="table-feat-desc">Filter specific channels or video titles by custom keywords</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Built-in (Local Filter)</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Quick-block buttons + keyword chips</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Cannot filter specific channels/keywords</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Limited</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Basic filtering, complex setup</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Focus Lock &amp; Scheduling</span>
                <span className="table-feat-desc">Mandatory delay before unlocking rules, plus scheduled weekly focus sessions</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Included</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>PIN protection, cooldown &amp; scheduler</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Toggles easily turned off impulsively</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Basic PIN</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Simple password protection only</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Privacy &amp; Data Security</span>
                <span className="table-feat-desc">Is your browsing activity monitored or sent to remote servers?</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ 100% Private (0% Telemetry)</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Stored strictly inside local browser storage</div>
              </td>
              <td>
                <span className="status-badge status-neutral">Closed Source</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Cannot independently verify telemetry</div>
              </td>
              <td>
                <span className="status-badge status-neutral">Closed Source</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Proprietary extension runtime</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
