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
    question: 'Why is Intentional YT considered the best Unhook and Untrap alternative?',
    answer: (
      <>
        <p>Unlike legacy blockers like Unhook or Untrap, Intentional YT is built with modern, zero-compromise architectural standards:</p>
        <p>• <strong>100% Free &amp; Open Source</strong>: Full source code is open on GitHub under the MIT license with zero paid tiers or subscriptions.</p>
        <p>• <strong>Zero-Flash DOM Ingestion</strong>: Injects high-specificity CSS at <code>document_start</code> before paint, eliminating the distracting 100–300ms feed flicker common in other tools.</p>
        <p>• <strong>Built-in Daily Limits &amp; Soft Reminders</strong>: Integrated playback time tracking without needing separate timer apps.</p>
        <p>• <strong>Channel &amp; Keyword Blocklists</strong>: Filter specific channels or noisy keywords directly from your feed.</p>
        <p>• <strong>Anti-Doomscroll Batching</strong>: Instead of only all-or-nothing blocking, enjoy a calm 15-video feed limit with an intentional caught-up banner.</p>
        <p>• <strong>Strict 0% Telemetry</strong>: All data and preferences stay 100% local inside your browser sandbox.</p>
      </>
    )
  },
  {
    id: 'time-limit',
    question: 'How does the YouTube daily time limit feature work?',
    answer: (
      <p>
        Intentional YT includes a local watch-time tracker that monitors active video playback in real time. You can configure mindful soft reminders (e.g. gentle toasts every 15, 30, or 45 minutes) or set a firm daily watch limit (e.g. 30m, 60m, 90m) that automatically halts video playback once your daily threshold is reached.
      </p>
    )
  },
  {
    id: 'anti-doomscroll',
    question: 'What is Anti-Doomscroll mode and how does it work?',
    answer: (
      <p>
        Instead of completely blanking out the homepage feed, Anti-Doomscroll limits the recommendations to a single calm batch of 15 videos and hard-blocks infinite scroll pagination. When you reach the end of the batch, a peaceful <em>"✦ You're all caught up"</em> banner appears, preventing mindless endless scrolling while still allowing you to quickly check the home page.
      </p>
    )
  },
  {
    id: 'focus-lock-schedule',
    question: 'How do Focus Lock and Scheduled Focus sessions work?',
    answer: (
      <>
        <p>
          <strong>Focus Lock</strong> prevents impulsive override by enforcing an intentional cooldown delay (e.g. 5, 10, or 30 minutes) before you can disable any focus rules during deep work or study sessions.
        </p>
        <p>
          <strong>Scheduled Focus</strong> lets you automate distraction shielding by setting specific active days and time ranges (e.g. Mon–Fri, 9:00 AM – 5:00 PM), automatically applying your focus settings during work hours.
        </p>
      </>
    )
  },
  {
    id: 'presets',
    question: 'What one-click Focus Presets are included?',
    answer: (
      <p>
        Intentional YT includes 3 instant presets: <strong>Deep Work</strong> (maximum distraction shielding, home feed hidden, recommendations and comments blocked), <strong>Balanced Focus</strong> (home feed limited to 15 calm videos, Shorts blocked, subscriptions preserved), and <strong>Video Only</strong> (pure cinematic player with all recommendations and sidebar wiped out). You can also customize any individual toggle.
      </p>
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
        Intentional YT is verified and published on both the <strong>Chrome Web Store</strong> (for Google Chrome, Brave, Microsoft Edge, Opera, and Arc) and the <strong>Firefox Add-ons Store (AMO)</strong>. It can also be loaded unpacked from source in Developer Mode.
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
