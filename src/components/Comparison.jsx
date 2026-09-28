import React from 'react'

function CheckIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function Comparison() {
  return (
    <section id="comparison" className="comparison-section">
      <div className="section-head">
        <div className="section-kicker">
          <span>✦ An honest comparison</span>
        </div>
        <h2 className="section-title">Why people switch from Unhook &amp; Untrap.</h2>
        <p className="section-desc">
          Both are popular tools, but we built Intentional YT because we wanted something genuinely open-source, with zero paywalls, zero flickering, and zero tracking.
        </p>
      </div>

      <div className="table-scroll-hint">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>Scroll horizontally to compare columns</span>
      </div>

      <div className="table-card">
        <table className="comp-table">
          <thead>
            <tr>
              <th className="comp-col-feat">Key Capability</th>
              <th className="highlight-col comp-col-intentional">
                <div className="comp-col-header">
                  <span>Intentional YT</span>
                  <span className="comp-col-badge">Open Source</span>
                </div>
              </th>
              <th className="comp-col-competitor">Unhook</th>
              <th className="comp-col-competitor">Untrap</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="table-feat-name">Pricing &amp; Open Source</span>
                <span className="table-feat-desc">Is the code auditable and free without paywalls?</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>100% Free &amp; Open Source</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Permissive MIT license, zero paid tiers</div>
              </td>
              <td>
                <span className="status-badge status-warn">
                  <LockIcon />
                  <span>Closed Source</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Free but proprietary codebase</div>
              </td>
              <td>
                <span className="status-badge status-warn">
                  <WarnIcon />
                  <span>Freemium</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Locks advanced features behind paywall</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Zero-Flash Content Blocking</span>
                <span className="table-feat-desc">Does distracting content briefly appear before vanishing?</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>Instant (0ms Flicker)</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Injected at document_start before paint</div>
              </td>
              <td>
                <span className="status-badge status-warn">
                  <WarnIcon />
                  <span>Flickers on Load</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Feeds flash for a fraction of a second</div>
              </td>
              <td>
                <span className="status-badge status-warn">
                  <WarnIcon />
                  <span>Occasional Flash</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>DOM mutation delays on fast loads</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Blocks YouTube Shorts</span>
                <span className="table-feat-desc">Removes Shorts shelves, sidebar tabs, search results &amp; player links</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>Complete Suppression</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Deep suppression across all views</div>
              </td>
              <td>
                <span className="status-badge status-warn">
                  <WarnIcon />
                  <span>Incomplete</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Frequently reappears during SPA navigation</div>
              </td>
              <td>
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>Supported</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Hides Shorts entry points</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Daily Watch Timer &amp; Limits</span>
                <span className="table-feat-desc">Mindful toast reminders and automated daily playback limits</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>Built-in</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Gentle interval toasts &amp; daily cap</div>
              </td>
              <td>
                <span className="status-badge status-bad">
                  <CrossIcon />
                  <span>Missing</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>No watch time tracking or timers</div>
              </td>
              <td>
                <span className="status-badge status-bad">
                  <CrossIcon />
                  <span>Missing</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>No playback time limiter</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Anti-Doomscroll Feed Limit</span>
                <span className="table-feat-desc">Limits homepage to 15 calm videos &amp; stops infinite scroll with a banner</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>Built-in (15 Videos)</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Peaceful caught-up banner</div>
              </td>
              <td>
                <span className="status-badge status-bad">
                  <CrossIcon />
                  <span>Missing</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>All-or-nothing toggle only</div>
              </td>
              <td>
                <span className="status-badge status-bad">
                  <CrossIcon />
                  <span>Missing</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>No batching or infinite scroll stop</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Channel &amp; Keyword Blocklists</span>
                <span className="table-feat-desc">Filter specific channels or video titles by custom keywords</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>Built-in (Local Filter)</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Quick-block buttons + keyword chips</div>
              </td>
              <td>
                <span className="status-badge status-bad">
                  <CrossIcon />
                  <span>Missing</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Cannot filter specific channels/keywords</div>
              </td>
              <td>
                <span className="status-badge status-warn">
                  <WarnIcon />
                  <span>Limited</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Basic filtering, complex setup</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Focus Lock &amp; Scheduling</span>
                <span className="table-feat-desc">Mandatory delay before unlocking rules, plus scheduled weekly focus sessions</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>Included</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>PIN protection, cooldown &amp; scheduler</div>
              </td>
              <td>
                <span className="status-badge status-bad">
                  <CrossIcon />
                  <span>Missing</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Toggles easily turned off impulsively</div>
              </td>
              <td>
                <span className="status-badge status-warn">
                  <WarnIcon />
                  <span>Basic PIN</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Simple password protection only</div>
              </td>
            </tr>

            <tr>
              <td>
                <span className="table-feat-name">Privacy &amp; Data Security</span>
                <span className="table-feat-desc">Is your browsing activity monitored or sent to remote servers?</span>
              </td>
              <td className="highlight-col">
                <span className="status-badge status-good">
                  <CheckIcon />
                  <span>100% Private (0% Telemetry)</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Stored strictly inside local browser storage</div>
              </td>
              <td>
                <span className="status-badge status-neutral">
                  <LockIcon />
                  <span>Closed Source</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Cannot independently verify telemetry</div>
              </td>
              <td>
                <span className="status-badge status-neutral">
                  <LockIcon />
                  <span>Closed Source</span>
                </span>
                <div className="table-feat-desc" style={{ marginTop: '4px' }}>Proprietary extension runtime</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
