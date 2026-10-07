import Link from 'next/link'
import { Download, SlidersHorizontal, Play, ShieldCheck } from 'lucide-react'
export default function SetupSteps() {
  return <section id="setup" className="setup-section" aria-labelledby="setup-title"><div className="section-head"><h2 id="setup-title" className="section-title">Set it up once. Adjust it whenever.</h2></div><ol className="setup-steps">
    <li><Download size={25} /><span>1</span><h3>Add the extension</h3><p>Install it from your browser’s store, then open or reload YouTube.</p></li>
    <li><SlidersHorizontal size={25} /><span>2</span><h3>Choose what to hide</h3><p>Open Intentional YT from your toolbar. Start with Shorts or recommendations.</p></li>
    <li><Play size={25} /><span>3</span><h3>Watch your video</h3><p>Search for what you need. You can change your settings at any time.</p></li>
  </ol><div className="local-proof"><ShieldCheck size={30} /><div><h3>Your settings stay in your browser.</h3><p>We don’t collect watch history or send your settings to a server. You don’t need an account.</p><div><Link href="/privacy">Read the privacy policy</Link><a href="https://github.com/manasdotio/intentional-yt">View the source code</a></div></div></div></section>
}
