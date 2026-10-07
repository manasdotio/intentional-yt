export const faqItems = [
  ['Will this block normal videos too?', 'Hide Shorts removes Shorts from feeds, search results, channels, and the sidebar. Ordinary videos remain available. You can also hide the home feed and recommended sidebar while keeping your subscriptions.'],
  ['What happens when I reach my daily limit?', 'Playback pauses when you reach the limit you chose. The counter tracks active playback and resets at midnight. You can add a reminder if you want a heads-up before taking a break.'],
  ['Does it work on my phone?', 'Intentional YT supports Chrome, Firefox, Edge, and compatible desktop browsers. It does not change the YouTube phone app. There is no native iOS or Android app.'],
  ['Can I change my mind about a setting?', 'Yes. Open the extension to change a setting or remove a filter. If you turn on Focus Lock, a PIN and cooldown add a delay before protected settings can change. You can still disable or uninstall the extension.'],
  ['What if something stops working?', 'YouTube sometimes changes its layout. Check that the extension is enabled and up to date, then reload the page. If a distraction still appears, use the Report an Issue link below to tell us which page and browser you used.']
]
export default function Faq() {
  return <section id="faq" className="faq-section visual-faq"><div className="section-head"><div className="faq-visual-mark" aria-hidden="true">?</div><h2 className="section-title">A few things you might be wondering.</h2></div><div className="faq-grid">{faqItems.map(([question, answer]) => <details className="faq-item" key={question}><summary className="faq-question"><span>{question}</span><svg className="faq-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></summary><div className="faq-answer"><p>{answer}</p></div></details>)}</div></section>
}
