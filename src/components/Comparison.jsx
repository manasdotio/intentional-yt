import React from 'react'

export default function Comparison() {
  return (
    <section id="comparison" className="comparison-section">
      <div className="section-head">
        <div className="section-eyebrow">Clear Comparison</div>
        <h2 className="section-title">How Intentional YT compares.</h2>
        <p className="section-desc">
          See why Intentional YT gives you a calmer, faster, and more private YouTube experience without compromises.
        </p>
      </div>

      <div className="table-card">
        <table className="comp-table">
          <thead>
            <tr>
              <th style={{ minWidth: '220px' }}>Key Capability</th>
              <th className="highlight-col" style={{ minWidth: '220px' }}>Intentional YT</th>
              <th style={{ minWidth: '180px' }}>Other Focus Plugins</th>
              <th style={{ minWidth: '170px' }}>Default YouTube</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="table-feat-name">No Screen Flashing</span>
                <span className="table-feat-desc">Does distracting content briefly appear before vanishing?</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Instant (0 Flicker)</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Blocked before the page paints</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Flickers on Load</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Feeds flash for a fraction of a second</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Distraction Loaded</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Full feeds load instantly</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Blocks YouTube Shorts</span>
                <span className="table-feat-desc">Removes Shorts shelves, sidebar tabs, search results &amp; player links</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ 100% Removed</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Strips Shorts across all pages</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Incomplete</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Frequently breaks while navigating</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Full Exposure</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Shorts pushed across every view</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Flexible Controls</span>
                <span className="table-feat-desc">Keep your subscriptions while hiding recommendations</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ 20+ Independent Toggles</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>You choose what to keep or hide</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Rigid &amp; Limited</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Forced all-or-nothing settings</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Zero Control</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>YouTube decides what you see</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Calm Clickbait Thumbnails</span>
                <span className="table-feat-desc">Mask screaming covers without losing video titles or timestamps</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Included</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Preserves duration tags &amp; titles</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Rarely Supported</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Leaves shouting covers visible</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ High Stimulation</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Bright, saturated clickbait covers</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Daily Watch Timer &amp; Limits</span>
                <span className="table-feat-desc">Mindful toast reminders and automated daily watch time limits</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Built-in</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Gentle nudge toasts &amp; hard limits</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>No playback time tracking</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Infinite Bingeing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Engineered for endless watch time</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Anti-Doomscroll Feed Limit</span>
                <span className="table-feat-desc">Limits homepage to 15 calm videos &amp; stops infinite scroll with a serene banner</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Built-in (15 Videos)</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Peaceful caught-up banner</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>All-or-nothing only</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Infinite Scroll</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Endless recommendations</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Focus Lock &amp; Automation</span>
                <span className="table-feat-desc">Mandatory delay before unlocking rules, plus scheduled weekly focus sessions</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ Included</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Cooldown delay &amp; schedule planner</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Toggles easily turned off impulsively</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ None</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Constant algorithmic pull</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Privacy &amp; Data Security</span>
                <span className="table-feat-desc">Is your browsing history or extension activity monitored?</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">✓ 100% Private (0% Telemetry)</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Stored solely on your device</div>
              </td>
              <td>
                <span className="status-badge status-neutral">Varies</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Often requires accounts or tracking</div>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Full Profiling</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Full algorithmic user tracking</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
