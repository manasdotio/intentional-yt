'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

function SimulatorPlaceholder({ placeholderRef, onLoad, loading = false }) {
  return (
    <section id="demo" ref={placeholderRef} className="playground-section">
      <div className="section-head" style={{ marginBottom: '32px' }}>
        <div className="section-kicker"><span>✦ Interactive preview</span></div>
        <h2 className="section-title">Try the YouTube blocking controls</h2>
        <p className="section-desc">Choose a preset, then adjust the controls to see what changes.</p>
      </div>
      <div className="playground-card simulator-placeholder">
        <h3 className="playground-title">Interactive Simulator</h3>
        <p>Preview how Intentional YT hides Shorts, recommendations, and other YouTube distractions.</p>
        <button type="button" className="btn btn-primary" disabled={loading} onClick={onLoad}>
          {loading ? 'Loading interactive demo…' : 'Load interactive demo'}
        </button>
      </div>
    </section>
  )
}

const Simulator = dynamic(() => import('./Simulator'), {
  ssr: false,
  loading: () => <SimulatorPlaceholder loading />
})

export default function LazySimulator() {
  const placeholderRef = useRef(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad) return

    const placeholder = placeholderRef.current
    if (!placeholder || !('IntersectionObserver' in window)) {
      setShouldLoad(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoad(true)
        observer.disconnect()
      }
    }, { rootMargin: '200px 0px' })

    observer.observe(placeholder)
    return () => observer.disconnect()
  }, [shouldLoad])

  if (shouldLoad) return <Simulator />

  return <SimulatorPlaceholder placeholderRef={placeholderRef} onLoad={() => setShouldLoad(true)} />
}
