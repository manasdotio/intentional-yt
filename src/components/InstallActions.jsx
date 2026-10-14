'use client'

import { useEffect, useState } from 'react'
import { APP_CONFIG } from '../config/constants'

const stores = [
  { id: 'chrome', name: 'Chrome', url: APP_CONFIG.chromeWebStoreUrl },
  { id: 'firefox', name: 'Firefox', url: APP_CONFIG.firefoxAddonUrl },
  { id: 'edge', name: 'Edge', url: APP_CONFIG.edgeAddonUrl },
]

function useInstallTarget() {
  const [target, setTarget] = useState(null)
  useEffect(() => {
    const ua = navigator.userAgent || ''
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (mobile) return setTarget({ id: 'mobile' })
    const id = /Edg\//.test(ua) ? 'edge' : /Firefox\//.test(ua) ? 'firefox' :
      /Chrome\//.test(ua) && !/OPR\//.test(ua) ? 'chrome' : null
    setTarget(stores.find(store => store.id === id) || null)
  }, [])
  return target
}

export function InstallButton({ compact = false }) {
  const target = useInstallTarget()
  const mobile = target?.id === 'mobile'
  const label = target?.url ? `Add to ${target.name}` : mobile ?
    (compact ? 'Desktop setup' : 'Try the demo') : 'Choose browser'
  const href = target?.url || (mobile && !compact ? '/#demo' : '/#install-options')
  return <a href={href} className={`btn install-primary ${compact ? 'btn-primary nav-install-btn' : 'hero-btn-primary'}`}
    data-install-primary aria-label={label}
    target={target?.url ? '_blank' : undefined} rel={target?.url ? 'noopener noreferrer' : undefined}>
    {target?.url && <img src={`/icons/${target.id}.svg`} alt="" width={compact ? 16 : 20} height={compact ? 16 : 20} />}
    <span>{label}</span><span aria-hidden="true">{target?.url ? '\u2197' : '\u2192'}</span>
  </a>
}

export function InstallOptions({ id }) {
  const target = useInstallTarget()
  const mobile = target?.id === 'mobile'
  return <div className="install-options" id={id}>
    <p className="install-guidance">{mobile ? 'To install, open this site on your computer in Chrome, Firefox or Edge.' :
      target?.url ? 'Using another browser? Choose its store:' : 'Choose Chrome, Firefox or Edge on your computer to install.'}</p>
    <div className="install-store-links" role="group" aria-label="Desktop browser stores">
      {stores.map(store => <a key={store.id} href={store.url} target="_blank" rel="noopener noreferrer"
        aria-label={`${store.name} desktop extension store`}>
        <img src={`/icons/${store.id}.svg`} alt="" width="18" height="18" />{store.name}
      </a>)}
    </div>
  </div>
}
