import { APP_CONFIG } from '../config/constants'

export default function ClosingCta() {
  return <section className="closing-calm" aria-labelledby="closing-title">
    <div className="closing-landscape" aria-hidden="true"><img src="/screenshots/hero-calm-landscape.webp" alt="" width="1000" height="667" loading="lazy" /></div>
    <div className="closing-copy"><img src="/icons/icon.svg" alt="" width="52" height="52" /><h2 id="closing-title">Keep the videos.<br /><em>Keep your afternoon.</em></h2><p>Add Intentional YT, choose what to hide, and get back to your video.</p><a className="btn hero-btn-primary" href={APP_CONFIG.chromeWebStoreUrl} target="_blank" rel="noopener noreferrer"><img src="/icons/chrome.svg" alt="" width="20" height="20" />Add to Chrome <span aria-hidden="true">↗</span></a><div className="closing-browsers">Also for <a href={APP_CONFIG.firefoxAddonUrl}>Firefox</a> & <a href={APP_CONFIG.edgeAddonUrl}>Edge</a><span>Free for desktop browsers.</span></div></div>
  </section>
}
