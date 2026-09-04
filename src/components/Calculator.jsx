import React, { useState } from 'react'

export default function Calculator() {
  const [hours, setHours] = useState(2.0)

  const dailySaved = hours * 0.70
  const yearlySaved = Math.round(dailySaved * 365)
  const wakingDays = Math.round(yearlySaved / 16)
  const booksRead = Math.round(yearlySaved / 10)

  return (
    <section id="calculator" className="calc-box">
      <div className="calc-grid">
        <div>
          <div className="section-eyebrow">Attention ROI</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Calculate your reclaimed life.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
            The average user spends 60–90% of their YouTube time falling into unintended autoplay and recommendation loops.
          </p>
          <div className="range-wrap">
            <div className="range-header">
              <span style={{ color: 'var(--text-secondary)' }}>Daily YouTube Time:</span>
              <span className="range-val">{Number(hours).toFixed(1)} Hours</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.5"
              value={hours}
              className="calc-slider"
              id="calc-range-input"
              aria-label="Daily YouTube Time in hours"
              onChange={(e) => setHours(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="calc-results-card">
          <div className="result-item">
            <span className="result-label">Reclaimed Focus per Year</span>
            <span className="result-num highlight">{yearlySaved} hrs</span>
          </div>
          <div className="result-item">
            <span className="result-label">Extra Waking Days Won Back</span>
            <span className="result-num">{wakingDays} days</span>
          </div>
          <div className="result-item">
            <span className="result-label">Books You Could Read Instead</span>
            <span className="result-num">~{booksRead} books</span>
          </div>
        </div>
      </div>
    </section>
  )
}
