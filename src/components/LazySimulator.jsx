'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
const Simulator = dynamic(() => import('./Simulator'), { ssr: false, loading: () => <p role="status" className="optional-demo-loading">Loading the controls…</p> })
export default function LazySimulator() {
  const panel = useRef(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const open = () => { if (panel.current) { panel.current.open = true; setLoaded(true) } }
    const followHash = () => { if (window.location.hash === '#demo') open() }
    const followLink = event => {
      const link = event.target.closest?.('a[href]')
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const url = new URL(link.href, window.location.href)
      if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash === '#demo') open()
    }
    followHash()
    window.addEventListener('hashchange', followHash)
    document.addEventListener('click', followLink, true)
    return () => { window.removeEventListener('hashchange', followHash); document.removeEventListener('click', followLink, true) }
  }, [])
  return <details ref={panel} id="demo" className="optional-demo" onToggle={event => { if (event.currentTarget.open) setLoaded(true) }}><summary><span>Want to try the controls first?<small>Open the interactive demo. No installation needed.</small></span><span aria-hidden="true">＋</span></summary>{loaded && <Simulator />}</details>
}
