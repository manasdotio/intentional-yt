import React, { useState } from 'react'
import { APP_CONFIG } from '../config/constants'

export default function Installation() {
  const [activeTab, setActiveTab] = useState('cr')

  return (
    <section id="install" className="install-section">
      <div className="section-head">
        <div className="section-eyebrow">Get Started in 30 Seconds</div>
        <h2 className="section-title">Install Intentional YT</h2>
        <p className="section-desc">Fully open-source. Install directly from official stores or load from source.</p>
      </div>

      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'cr' ? 'active' : ''}`}
          onClick={() => setActiveTab('cr')}
        >
          <img src="/icons/chrome.svg" width="16" height="16" alt="Chrome" />
          <span>Chrome / Brave / Edge</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'ff' ? 'active' : ''}`}
          onClick={() => setActiveTab('ff')}
        >
          <img src="/icons/firefox.svg" width="16" height="16" alt="Firefox" />
          <span>Firefox (AMO)</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Manual / Source (.zip)</span>
        </button>
      </div>

      {/* Chrome instructions */}
      {activeTab === 'cr' && (
        <div className="tab-content">
          <div className="step-list">
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-content">
                <h3>Open the Chrome Web Store</h3>
                <p>
                  Intentional YT is verified and hosted directly on the official Chrome Web Store for Google Chrome, Brave, Microsoft Edge, and Arc.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <a
                    href={APP_CONFIG.chromeWebStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-chrome"
                  >
                    <img src="/icons/chrome-store.svg" width="18" height="18" alt="Chrome Web Store" />
                    <span>Install on Chrome</span>
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
                <h3>Click "Add to Chrome"</h3>
                <p>
                  Confirm the prompt in your browser toolbar. The extension activates immediately with zero configuration needed.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-content">
                <h3>Open YouTube &amp; Focus</h3>
                <p>
                  Visit YouTube to enjoy an intentional, distraction-free environment. Click the toolbar icon anytime to customize your preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Firefox instructions */}
      {activeTab === 'ff' && (
        <div className="tab-content">
          <div className="step-list">
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-content">
                <h3>Open the Mozilla Add-ons Store</h3>
                <p>
                  Intentional YT is verified and hosted directly on the official Firefox Add-ons marketplace.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <a
                    href={APP_CONFIG.firefoxAddonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-amo"
                  >
                    <img src="/icons/firefox.svg" width="18" height="18" alt="Firefox" />
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
                <h3>Click "Add to Firefox"</h3>
                <p>
                  Confirm the prompt in your browser toolbar. The extension activates immediately with zero configuration needed.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-content">
                <h3>Open YouTube &amp; Focus</h3>
                <p>
                  Visit YouTube to enjoy an intentional, distraction-free environment. Click the toolbar icon anytime to customize your preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual / Developer Mode instructions */}
      {activeTab === 'manual' && (
        <div className="tab-content">
          <div className="step-list">
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-content">
                <h3>Download &amp; Extract the Extension</h3>
                <p>
                  Download the ready-to-load ZIP file and extract (unzip) it to a folder on your computer.
                </p>
                <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href={APP_CONFIG.chromeZipUrl}
                    download={APP_CONFIG.chromeZipFilename}
                    className="btn btn-primary"
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Chrome (.zip)</span>
                  </a>
                  <a
                    href={APP_CONFIG.githubReleasesUrl}
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
                <h3>Enable Developer Mode</h3>
                <p>
                  Open <code>chrome://extensions</code> (or <code>brave://extensions</code>, <code>edge://extensions</code>) in your browser and switch on <strong>Developer mode</strong> in the top-right corner.
                </p>
              </div>
            </div>

            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-content">
                <h3>Click "Load unpacked"</h3>
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
