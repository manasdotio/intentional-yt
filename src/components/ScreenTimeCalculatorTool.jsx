'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { CURATED_PACKS } from '../data/curatedPacks'

export default function ScreenTimeCalculatorTool() {
  const [minutesPerDay, setMinutesPerDay] = useState(90)
  const [algoPct, setAlgoPct] = useState(65)
  const [hourlyRate, setHourlyRate] = useState(35)
  const [recoveryTargetMinutes, setRecoveryTargetMinutes] = useState(25)

  const newspaperPack = CURATED_PACKS.find(p => p.id === 'newspaper-mode') || CURATED_PACKS[6]

  const stats = useMemo(() => {
    const totalHoursPerYear = (minutesPerDay * 365) / 60
    const algorithmicHoursPerYear = totalHoursPerYear * (algoPct / 100)
    const annualDaysLost = algorithmicHoursPerYear / 24
    const annualCost = algorithmicHoursPerYear * hourlyRate
    const booksEquivalent = Math.round(algorithmicHoursPerYear / 5)
    const skillsEquivalent = (algorithmicHoursPerYear / 120).toFixed(1)

    // Recovery metrics with daily limit
    const recoveredMinutesPerDay = Math.max(0, minutesPerDay - recoveryTargetMinutes)
    const recoveredHoursPerYear = Math.round((recoveredMinutesPerDay * 365) / 60)
    const recoveredDollarsPerYear = Math.round(recoveredHoursPerYear * hourlyRate)

    return {
      totalHoursPerYear: Math.round(totalHoursPerYear),
      algorithmicHoursPerYear: Math.round(algorithmicHoursPerYear),
      annualDaysLost: annualDaysLost.toFixed(1),
      annualCost: Math.round(annualCost).toLocaleString(),
      booksEquivalent,
      skillsEquivalent,
      recoveredHoursPerYear,
      recoveredDollarsPerYear: recoveredDollarsPerYear.toLocaleString()
    }
  }, [minutesPerDay, algoPct, hourlyRate, recoveryTargetMinutes])

  return (
    <div style={{ margin: '30px 0' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '36px'
        }}
      >
        {/* Left Column: Sliders */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em' }}>
            Interactive Audit Sliders
          </span>
          <h3 style={{ margin: '6px 0 24px', fontSize: '18px', fontWeight: '700' }}>
            Your Daily Usage Inputs
          </h3>

          {/* Slider 1 */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600' }}>Average daily YouTube time:</span>
              <span style={{ fontWeight: '700', color: 'var(--accent)', fontFamily: 'var(--site-mono)' }}>
                {minutesPerDay} minutes ({Math.round(minutesPerDay / 60 * 10) / 10} hrs)
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="360"
              step="5"
              value={minutesPerDay}
              onChange={(e) => setMinutesPerDay(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>15m (minimal)</span>
              <span>90m (typical)</span>
              <span>6 hrs (heavy)</span>
            </div>
          </div>

          {/* Slider 2 */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600' }}>Rabbit-hole / algorithmic share:</span>
              <span style={{ fontWeight: '700', color: '#f97316', fontFamily: 'var(--site-mono)' }}>
                {algoPct}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="95"
              step="5"
              value={algoPct}
              onChange={(e) => setAlgoPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f97316' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>10% (strict search)</span>
              <span>65% (average)</span>
              <span>95% (autoplay loop)</span>
            </div>
          </div>

          {/* Slider 3 */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600' }}>Estimated hourly time value:</span>
              <span style={{ fontWeight: '700', color: '#22c55e', fontFamily: 'var(--site-mono)' }}>
                ${hourlyRate} / hour
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#22c55e' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>$10/hr</span>
              <span>$35/hr (freelance)</span>
              <span>$200/hr (consulting)</span>
            </div>
          </div>

          {/* Recovery Target */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600' }}>Target intentional daily limit:</span>
              <span style={{ fontWeight: '700', color: '#3b82f6', fontFamily: 'var(--site-mono)' }}>
                {recoveryTargetMinutes} minutes
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={recoveryTargetMinutes}
              onChange={(e) => setRecoveryTargetMinutes(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>10m</span>
              <span>25m (focused)</span>
              <span>60m</span>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Annual Cost */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#ef4444', letterSpacing: '0.05em' }}>
              Annual Algorithmic Drain
            </span>
            <div style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text)', margin: '8px 0 4px', lineHeight: 1 }}>
              {stats.algorithmicHoursPerYear} <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-muted)' }}>Hours / year</span>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>
              Equivalent to {stats.annualDaysLost} continuous 24-hour days lost to algorithmic drift.
            </p>

            {/* Metric grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Opportunity Cost
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#22c55e', marginTop: '4px' }}>
                  ${stats.annualCost}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  At ${hourlyRate}/hr valuation
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Books Unread
                </div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>
                  {stats.booksEquivalent} Books
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  At 5 hours per book
                </div>
              </div>
            </div>

            {/* Recovery Potential Card */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>
                Your Focus Recovery Potential
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                Enforcing a <strong>{recoveryTargetMinutes}-minute daily limit</strong> recovers <strong>{stats.recoveredHoursPerYear} deep work hours</strong> and approximately <strong>${stats.recoveredDollarsPerYear} in value</strong> this year.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link
              href={`/setup#s=${newspaperPack.code}`}
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
            >
              Apply Newspaper Mode Preset ({recoveryTargetMinutes}m Cap) →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
