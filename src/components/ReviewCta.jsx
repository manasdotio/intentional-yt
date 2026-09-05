import React from 'react'
import { APP_CONFIG } from '../config/constants'

export default function ReviewCta() {
  return (
    <section style={{ marginBottom: '90px', textAlign: 'center', background: 'var(--surface-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '40px 24px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: '24px', marginBottom: '12px', color: '#f59e0b' }}>★★★★★</div>
      <h3 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px', color: 'var(--text-primary)' }}>
        Help others reclaim their attention
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', maxWidth: '520px', margin: '0 auto 24px' }}>
        If Intentional YT has helped you focus, a 5-star review on Firefox Add-ons goes a long way in helping others find distraction-free video viewing.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <a
          href={APP_CONFIG.firefoxAddonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-amo"
        >
          <span>Leave a Review on Firefox Add-ons</span>
          <span>→</span>
        </a>
        <a
          href={APP_CONFIG.githubRepoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          <span>Star on GitHub ⭐</span>
        </a>
      </div>
    </section>
  )
}
