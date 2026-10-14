import { InstallButton, InstallOptions } from './InstallActions'

export default function ClosingCta() {
  return <section className="closing-calm" aria-labelledby="closing-title">
    <div className="closing-landscape" aria-hidden="true"><img src="/screenshots/hero-calm-landscape.webp" alt="" width="1000" height="667" loading="lazy" /></div>
    <div className="closing-copy">
      <img src="/icons/icon.svg" alt="" width="52" height="52" />
      <h2 id="closing-title">Keep the videos.<br /><em>Keep your afternoon.</em></h2>
      <p>Add Intentional YT, choose what to hide, and get back to your video.</p>
      <InstallButton />
      <InstallOptions />
    </div>
  </section>
}
