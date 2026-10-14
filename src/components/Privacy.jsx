import Link from 'next/link'
import { APP_CONFIG } from '../config/constants'

export default function Privacy() {
  return <article className="privacy-page" style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 0 80px' }}>
    <Link href="/" className="btn btn-secondary">← Back to Home</Link>
    <div className="section-head" style={{ textAlign: 'left', margin: '28px 0' }}>
      <h1 className="section-title">Privacy Policy</h1>
      <p className="section-desc">Your extension settings and watch-time totals stay on your device. Feedback is sent only when you choose to submit it.</p>
      <p>Updated October 14, 2026.</p>
    </div>
    <div className="table-card privacy-copy">
      <section><h2>Extension data stays on your device</h2>
        <p>Intentional YT stores settings, channel and keyword filters, schedules, Focus Lock settings and daily watch-time totals in your browser’s local extension storage. It does not send these settings or totals to us and includes no usage analytics or tracking beacons. No account is required.</p>
      </section>
      <section><h2>What the extension reads</h2>
        <p>On www.youtube.com and m.youtube.com, the extension reads page elements such as video titles and channel names to apply your filters, and player events to count playback. It does not maintain a list of watched videos or send your searches or account information to us. It does not run on music.youtube.com.</p>
        <p>Playback counts across tabs, including background tabs. Simultaneous videos add together. Counting continues when protections are off or snoozed. The daily total resets at local midnight.</p>
        <p>The storage permission saves preferences and totals. Alarms reconcile daily resets and timed settings. YouTube site access lets the extension hide selected elements and observe playback.</p>
      </section>
      <section><h2>Website and optional feedback</h2>
        <p>Visiting the website or following a store/support link makes ordinary requests to that service. Website hosting providers process connection information needed to serve pages; extension watch-time totals and settings are not attached to those requests.</p>
        <p>If you choose to submit feedback, your response goes to Google Forms. The uninstall feedback form sends your selected reason, optional tags/comments and browser name only when you press Send. Other feedback forms send the answers you enter. Google may process connection/account information under its <a href="https://policies.google.com/privacy">privacy policy</a>. Please leave personal information out of feedback. Submitted feedback is used to investigate problems and improve the product.</p>
        <p>The website stores your theme preference locally. The interactive simulator uses temporary sample settings; it does not read or change your installed extension.</p>
      </section>
      <section><h2>Removing data</h2>
        <p>You can reset today’s counter or reset extension settings in the popup. Focus Lock may require a PIN and cooldown for protected changes. Uninstalling removes browser-managed extension storage; exported backup files remain wherever you saved them. Clear website data to remove its theme preference.</p>
        <p>Uninstalling does not delete feedback already submitted to Google Forms. For privacy questions or a feedback deletion request, <a href={APP_CONFIG.feedbackFormUrl}>contact us</a> and identify the submission without adding unnecessary personal information.</p>
      </section>
    </div>
  </article>
}
