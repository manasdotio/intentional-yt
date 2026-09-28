'use client'

import React, { useState } from 'react'

const FAQ_ITEMS = [
  {
    id: 'zero-flash',
    question: 'How does Intentional YT achieve zero-flash blocking on YouTube?',
    answer: (
      <>
        <p>
          Traditional distraction blockers wait for the webpage DOM to finish parsing before applying mutation observers or basic CSS rules. This creates an irritating visual flicker where clickbait thumbnails and recommendations flash for 100–300ms before vanishing.
        </p>
        <p>
          Intentional YT eliminates this by attaching CSS class tokens to the <code>&lt;html&gt;</code> root at <code>document_start</code>—before the browser paints even the very first pixel. Distracting components are styled away instantly at 0ms latency with zero layout jump.
        </p>
      </>
    ),
    defaultOpen: true
  },
  {
    id: 'unhook-diff',
    question: 'Why is Intentional YT considered the best Unhook and Untrap alternative?',
    answer: (
      <>
        <p>Unlike legacy blockers like Unhook or Untrap, Intentional YT is built with modern, zero-compromise architectural standards:</p>
        <ul className="faq-list">
          <li><strong>100% Free &amp; Open Source</strong>: Full source code is open on GitHub under the MIT license with zero paid tiers or subscriptions.</li>
          <li><strong>Zero-Flash DOM Ingestion</strong>: Injects high-specificity CSS at <code>document_start</code> before paint, eliminating the distracting 100–300ms feed flicker common in other tools.</li>
          <li><strong>Built-in Daily Limits &amp; Soft Reminders</strong>: Integrated playback time tracking without needing separate timer apps.</li>
          <li><strong>Channel &amp; Keyword Blocklists</strong>: Filter specific channels or noisy keywords directly from your feed.</li>
          <li><strong>Anti-Doomscroll Batching</strong>: Instead of only all-or-nothing blocking, enjoy a calm 15-video feed limit with an intentional caught-up banner.</li>
          <li><strong>Strict 0% Telemetry</strong>: All data and preferences stay 100% local inside your browser sandbox.</li>
        </ul>
      </>
    )
  },
  {
    id: 'focus-lock-schedule',
    question: 'How do Focus Lock and cooldown timers prevent impulsive overrides?',
    answer: (
      <>
        <p>
          When willpower dips, regular blocker toggles can be turned off in one click. <strong>Focus Lock</strong> stops this impulsiveness by requiring an intentional cooldown delay (e.g. 5, 10, or 30 minutes) before any focus rules can be unlocked.
        </p>
        <p>
          Combined with <strong>Scheduled Focus</strong>, you can automate distraction shielding to run during your exact work or study hours (e.g. Mon–Fri, 9:00 AM – 5:00 PM) automatically.
        </p>
      </>
    )
  },
  {
    id: 'privacy',
    question: 'Does Intentional YT collect any browsing history or watch data?',
    answer: (
      <p>
        Strictly zero. Intentional YT contains zero analytics libraries, zero tracking pixels, zero error reporting beacons, and zero telemetry. All settings, watch-time counters, and blocklists remain 100% sandboxed inside your local <code>browser.storage.local</code> storage.
      </p>
    )
  },
  {
    id: 'browsers',
    question: 'Which browsers and platforms are supported?',
    answer: (
      <p>
        Intentional YT is verified and published on the <strong>Chrome Web Store</strong> (for Google Chrome, Brave, Arc, and Opera), the official <strong>Microsoft Edge Add-ons</strong> store, and the <strong>Firefox Add-ons Store (AMO)</strong>. You can also inspect the source code or load it unpacked directly from GitHub.
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
        <div className="section-kicker">
          <span>✦ Got questions?</span>
        </div>
        <h2 className="section-title">Everything you might be wondering.</h2>
        <p className="section-desc">
          Straightforward answers about speed, privacy, and how it works.
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
                <svg className="faq-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
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
