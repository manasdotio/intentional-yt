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
              <th style={{ minWidth: '170px' }}>Standard Ad Blockers</th>
              <th style={{ minWidth: '180px' }}>Other Focus Plugins</th>
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
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Thumbnails flash for a second</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Sluggish Delay</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Elements jump as you scroll</div>
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
                <span className="status-badge status-bad">✗ Not Blocked</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Only targets video ads</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Incomplete</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Frequently breaks while navigating</div>
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
                <span className="status-badge status-bad">✗ No Controls</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Manual custom rule editing only</div>
              </td>
              <td>
                <span className="status-badge status-warn">⚠️ Rigid &amp; Limited</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Forced all-or-nothing settings</div>
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
                <span className="status-badge status-bad">✗ Not Supported</span>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Rarely Supported</span>
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
                <span className="status-badge status-bad">✗ No Time Limits</span>
              </td>
              <td>
                <span className="status-badge status-bad">✗ Missing</span>
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
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Some send network telemetry</div>
              </td>
              <td>
                <span className="status-badge status-neutral">Varies</span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Often requires accounts or tracking</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
