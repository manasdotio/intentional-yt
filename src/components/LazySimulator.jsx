'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
const Simulator = dynamic(() => import('./Simulator'), { ssr: false, loading: () => <p role="status" className="optional-demo-loading">Loading the controls…</p> })
export default function LazySimulator() {
  const [loaded, setLoaded] = useState(false)
  return <details id="demo" className="optional-demo" onToggle={event => { if (event.currentTarget.open) setLoaded(true) }}><summary><span>Want to try the controls first?<small>Open the interactive demo. No installation needed.</small></span><span aria-hidden="true">＋</span></summary>{loaded && <Simulator />}</details>
}
