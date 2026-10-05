export const faqItems = [
  ['Can I hide YouTube Shorts without blocking ordinary videos?', 'Yes. Enable Hide Shorts in the extension popup to hide Shorts entry points in feeds, search results, channels, and the sidebar. Ordinary videos remain available. This controls YouTube in your browser; it does not change the native YouTube phone app.'],
  ['Can I remove recommendations and keep my subscriptions?', 'Yes. Hide home feed and Hide recommended sidebar are separate from Hide subscriptions. Leave Hide subscriptions off to keep access to videos from channels you follow.'],
  ['How does the YouTube daily time limit work?', 'Open Focus & Limits, enable Daily limit, and choose your watch budget. Intentional YT tracks active video playback and pauses playback when the daily threshold is reached. Watch-time counters are stored locally and reset at midnight.'],
  ['Does Intentional YT collect my data?', 'No. Settings, blocklists, and watch-time counters stay in your browser. The extension has no telemetry and does not require an account.'],
  ['Which browsers are supported?', 'Install Intentional YT from the Chrome Web Store, Microsoft Edge Add-ons, or Firefox Add-ons. Chrome-compatible desktop browsers can use the Chrome extension. There is no native iOS or Android app.'],
  ['How does Focus Lock work?', 'Focus Lock adds a PIN and a cooldown before changing protected settings. Scheduled blocking can apply rules during selected hours and days. These features add friction to changing your preferences; they do not prevent you from disabling or uninstalling the extension.'],
  ['How does early content blocking work?', 'The extension loads its blocking stylesheet at document_start to hide distracting interface elements early in page loading. YouTube layout changes can affect individual rules; report missed elements through the feedback form.']
]

export default function Faq() {
  return (
    <section id="faq" className="faq-section">
      <div className="section-head">
        <div className="section-kicker"><span>Questions about Intentional YT</span></div>
        <h2 className="section-title">YouTube distraction blocker FAQ</h2>
        <p className="section-desc">How blocking, time limits, and local privacy work.</p>
      </div>
      <div className="faq-grid">
        {faqItems.map(([question, answer], index) => (
          <details className="faq-item" key={question} open={index === 0}>
            <summary className="faq-question">
              <span>{question}</span>
              <svg className="faq-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </summary>
            <div className="faq-answer"><p>{answer}</p></div>
          </details>
        ))}
      </div>
    </section>
  )
}
