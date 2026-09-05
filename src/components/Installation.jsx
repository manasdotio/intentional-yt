import React, { useState } from 'react'

export default function Installation() {
  const [activeTab, setActiveTab] = useState('ff')

  return (
    <section id="install" className="install-section">
      <div className="section-head">
        <div className="section-eyebrow">Get Started in 30 Seconds</div>
        <h2 className="section-title">Install Intentional YT</h2>
        <p className="section-desc">Fully open-source. Load directly into your favorite browser.</p>
      </div>

      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'ff' ? 'active' : ''}`}
          onClick={() => setActiveTab('ff')}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.666 8.358c-.144 1.348-.718 2.597-1.637 3.541.205-.733.243-1.499.112-2.247-.074-.426-.226-.837-.446-1.21-.064.382-.213.746-.437 1.066-.312.444-.737.799-1.233 1.028.188-.696.168-1.433-.058-2.115-.175-.526-.49-.993-.909-1.352a4.49 4.49 0 00-.77 2.052c-.417-.611-1.025-1.066-1.733-1.298-.707-.232-1.472-.197-2.158.1a4.836 4.836 0 00-1.854 1.83 5.39 5.39 0 00-.638 2.544c.05 1.545.748 3.003 1.932 4.037 1.184 1.034 2.748 1.56 4.331 1.455a6.046 6.046 0 004.896-3.238 6.55 6.55 0 00.598-3.924c-.035-.297-.09-.592-.164-.882-.047-.19-.107-.376-.179-.558-.094.275-.224.536-.388.775-.246.36-.57.65-.947.85z" />
          </svg>
          <span>Firefox (Recommended)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'cr' ? 'active' : ''}`}
          onClick={() => setActiveTab('cr')}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.73c-1.884-3.987-5.966-6.545-10.73-6.545zM1.948 5.76A11.968 11.968 0 0 0 0 12c0 5.213 3.328 9.65 7.96 11.302l3.953-6.847a5.454 5.454 0 0 1-5.69-3.287L1.948 5.76zm10.052 6.24a5.454 5.454 0 0 1 2.727 4.727 5.454 5.454 0 0 1-2.727 4.728h10.052c1.238-1.52 1.948-3.447 1.948-5.552 0-3.666-1.642-6.953-4.227-9.155l-3.953 6.848A5.454 5.454 0 0 1 12 12z" />
          </svg>
          <span>Chrome / Brave / Edge / Arc</span>
        </button>
      </div>

      {/* Firefox instructions */}
      {activeTab === 'ff' && (
        <div className="tab-content">
          <div className="step-list">
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-content">
                <h4>Open the Mozilla Add-ons Store</h4>
                <p>
                  Intentional YT is verified and hosted directly on the official Firefox Add-ons marketplace.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <a
                    href="https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-amo"
                  >
                    <span>Install on Firefox</span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="step-item">
              <div className="step-num">2</div>
              <div className="step-content">
                <h4>Click "Add to Firefox"</h4>
                <p>
                  Confirm the prompt in your browser toolbar. The extension activates immediately with zero configuration needed.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-content">
                <h4>Open YouTube &amp; Focus</h4>
                <p>
                  Visit YouTube to enjoy an intentional, distraction-free environment. Click the toolbar icon anytime to customize your preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chromium instructions */}
      {activeTab === 'cr' && (
        <div className="tab-content">
          <div className="step-list">
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-content">
                <h4>Download &amp; Extract the Extension</h4>
                <p>
                  Download the ready-to-load ZIP file and extract (unzip) it to a folder on your computer.
                </p>
                <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href="/intentional-yt.zip"
                    download="intentional-yt-v2.1.0.zip"
                    className="btn btn-primary"
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download for Chrome (.zip)</span>
                  </a>
                  <a
                    href="https://github.com/manasdotio/intentional-yt/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <span>GitHub Releases</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="step-item">
              <div className="step-num">2</div>
              <div className="step-content">
                <h4>Enable Developer Mode</h4>
                <p>
                  Open <code>chrome://extensions</code> (or <code>brave://extensions</code>, <code>edge://extensions</code>) in your browser and switch on <strong>Developer mode</strong> in the top-right corner.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-content">
                <h4>Click "Load unpacked"</h4>
                <p>
                  Click the <strong>Load unpacked</strong> button in the top-left corner and select the extracted folder. Intentional YT is installed and ready!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
