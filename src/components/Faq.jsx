import React, { useState } from 'react'

const FAQ_ITEMS = [
  {
    id: 'zero-flash',
    question: 'How does Intentional YT achieve zero-flash blocking on YouTube?',
    answer: (
      <>
        <p>
          Traditional distraction blockers wait for the webpage DOM to finish parsing before applying mutation observers or basic CSS rules. This creates an irritating, visual "flicker" where clickbait thumbnails and recommendations flash for 100–300ms before vanishing.
        </p>
        <p>
          Intentional YT eliminates this by attaching CSS class tokens to the <code>&lt;html&gt;</code> root at <code>document_start</code>—before the browser paints even the very first pixel. Distracting components are styled away instantly at 0ms latency with zero layout jump.
        </p>
      </>
    ),
    defaultOpen: true
  },
  {
    id: 'block-shorts',
    question: 'Can I block YouTube Shorts completely across the entire site?',
    answer: (
      <p>
        Yes. Intentional YT implements comprehensive suppression for Shorts across all surfaces: homepage shelves, sidebar navigation items, search result carousels, channel tab navigation, and watch-page recommendations.
      </p>
    )
  },
  {
    id: 'unhook-diff',
    question: 'How is Intentional YT different from Unhook or DF Tube?',
    answer: (
      <>
        <p>While legacy extensions offer basic binary toggles, Intentional YT is built with modern web architecture in mind:</p>
        <p>• <strong>20+ Granular Toggles</strong>: Freely hide what distracts you while preserving what you need (e.g. keeping subscriptions while hiding recommended feeds).</p>
        <p>• <strong>Clickbait De-stimulation</strong>: Gray out or mask shouting thumbnails while keeping video durations intact.</p>
        <p>• <strong>Mindful Watch Timers</strong>: Real-time daily active playback counter and gentle interval reminders.</p>
        <p>• <strong>Zero Telemetry</strong>: No external server calls, tracking scripts, or data collection whatsoever.</p>
      </>
    )
  },
  {
    id: 'privacy',
    question: 'Does Intentional YT collect any data or browsing history?',
    answer: (
      <p>
        Strictly zero. Intentional YT does not include any analytics libraries, telemetry, error reporting beacons, or remote tracking. All your settings and watch-time counters remain 100% local inside your browser's private <code>browser.storage.local</code> storage.
      </p>
    )
  },
  {
    id: 'browsers',
    question: 'Which browsers are supported?',
    answer: (
      <p>
        Intentional YT is verified and published on the <strong>Firefox Add-ons Store</strong>. It also runs smoothly across all Chromium-based browsers (Google Chrome, Brave, Microsoft Edge, Opera, and Arc) by loading the unpacked folder in Developer Mode.
      </p>
    )
  },
  {
    id: 'open-source',
    question: 'Is Intentional YT open source and free to use?',
    answer: (
      <p>
        Yes. Intentional YT is free, fully open source under the MIT License, and maintained publicly on GitHub. You can view, audit, fork, or contribute to the code anytime.
      </p>
    )
  }
]

export default function Faq() {
  const [openItems, setOpenItems] = useState({
    'zero-flash': true
  })

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <section id="faq" className="faq-section">
      <div className="section-head">
        <div className="section-eyebrow">Got Questions?</div>
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-desc">
          Everything you need to know about Intentional YT's architecture, privacy, and distraction blocking capabilities.
        </p>
      </div>

      <div className="faq-grid">
        {FAQ_ITEMS.map((item) => {
          const isOpen = !!openItems[item.id]
          return (
            <div key={item.id} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
              <button
                className="faq-question"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <svg className="faq-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && <div className="faq-answer">{item.answer}</div>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
