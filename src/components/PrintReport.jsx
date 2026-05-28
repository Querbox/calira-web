import { useEffect } from 'react'
import { dayKeyOf, todayKey } from '../lib/storage'
import { topTriggers, monthlyMedUsage, monthLabel } from '../lib/insights'
import { painLabel } from '../lib/pain'

const DAYS = 28

/**
 * Renders a print-styled report of the last 4 weeks. Mounts, triggers
 * `window.print()` once, then calls `onClose` when the print dialog is
 * dismissed.
 */
export default function PrintReport({ data, onClose }) {
  useEffect(() => {
    const onAfter = () => onClose?.()
    window.addEventListener('afterprint', onAfter)
    // Give the layout a tick to paint before opening the dialog
    const t = setTimeout(() => window.print(), 250)
    return () => {
      window.removeEventListener('afterprint', onAfter)
      clearTimeout(t)
    }
  }, [onClose])

  const today = new Date()
  const days = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const key = dayKeyOf(d.getTime())
    const ck = data.checkIns.filter((c) => dayKeyOf(c.timestamp) === key)
    const md = data.medications.filter((m) => dayKeyOf(m.timestamp) === key)
    const fl = data.flares.filter((f) => dayKeyOf(f.startTime) === key)
    const avg = ck.length ? ck.reduce((s, c) => s + c.painLevel, 0) / ck.length : null
    const max = ck.length ? Math.max(...ck.map((c) => c.painLevel)) : null
    days.push({ date: d, key, ck, md, fl, avg, max })
  }

  const tracked = days.filter((d) => d.ck.length).length
  const good = days.filter((d) => d.max != null && d.max <= 3).length
  const moderate = days.filter((d) => d.max != null && d.max > 3 && d.max < 7).length
  const severe = days.filter((d) => d.max != null && d.max >= 7).length
  const flares = days.flatMap((d) => d.fl).length
  const meds = days.flatMap((d) => d.md)
  const overallAvg =
    days.filter((d) => d.avg != null).reduce((s, d, _, arr) => s + d.avg / arr.length, 0) || 0

  const triggers = topTriggers(data.flares, 28)
  const medUsage = monthlyMedUsage(data.medications)

  // Medication tally
  const medCounts = new Map()
  meds.forEach((m) => {
    const k = m.medicationName
    medCounts.set(k, (medCounts.get(k) || 0) + 1)
  })
  const medList = Array.from(medCounts.entries()).sort((a, b) => b[1] - a[1])

  return (
    <div className="print-report">
      <header className="print-report__head">
        <div>
          <div className="print-report__brand">Calira · Verlaufsbericht</div>
          <h1 className="print-report__title">
            {data.name ? `${data.name} — ` : ''}
            {days[0].date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
            {' – '}
            {days[days.length - 1].date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h1>
          <div className="print-report__sub">
            Druckdatum: {new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}28 Tage
          </div>
        </div>
      </header>

      <section className="print-report__stats">
        <Stat label="Tracked" value={`${tracked}/${DAYS}`} />
        <Stat label="Schmerz Ø" value={overallAvg.toFixed(1)} />
        <Stat label="Gute Tage" value={good} />
        <Stat label="Schwere Tage" value={severe} />
        <Stat label="Schübe" value={flares} />
        <Stat label="Medi-Tage" value={medUsage.count} />
      </section>

      <section className="print-section">
        <h2 className="print-section__title">Tagesverlauf</h2>
        <table className="print-table">
          <thead>
            <tr><th>Datum</th><th>Schmerz Ø</th><th>Max</th><th>Check-ins</th><th>Medikamente</th><th>Schübe</th></tr>
          </thead>
          <tbody>
            {days.filter((d) => d.ck.length || d.md.length || d.fl.length).map((d) => (
              <tr key={d.key}>
                <td>{d.date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                <td>{d.avg != null ? d.avg.toFixed(1) : '—'}</td>
                <td>{d.max != null ? `${d.max} (${painLabel(d.max)})` : '—'}</td>
                <td>{d.ck.length}</td>
                <td>{d.md.map((m) => m.medicationName).join(', ') || '—'}</td>
                <td>{d.fl.length || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {medList.length > 0 && (
        <section className="print-section">
          <h2 className="print-section__title">Medikamenten-Übersicht</h2>
          <table className="print-table">
            <thead><tr><th>Präparat</th><th>Einnahmen</th></tr></thead>
            <tbody>
              {medList.map(([name, count]) => (
                <tr key={name}><td>{name}</td><td>{count}×</td></tr>
              ))}
            </tbody>
          </table>
          <p className="print-section__note">
            Akut-Medikamenten-Tage im aktuellen Monat ({monthLabel()}):
            <strong> {medUsage.count} / 10</strong>
            {medUsage.level !== 'ok' && (
              <em> — {medUsage.level === 'high' ? 'Risiko für medikamenten­induzierten Kopfschmerz.' : 'Empfehlungsgrenze überschritten.'}</em>
            )}
          </p>
        </section>
      )}

      {triggers.length > 0 && (
        <section className="print-section">
          <h2 className="print-section__title">Vermutete Auslöser (Schübe)</h2>
          <ul className="print-list">
            {triggers.map((t) => (
              <li key={t.trigger}><strong>{t.count}×</strong> {t.trigger}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="print-report__foot">
        Erstellt mit Calira. Alle Daten liegen ausschließlich lokal im Browser des Nutzers.
      </footer>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="print-stat">
      <div className="print-stat__num">{value}</div>
      <div className="print-stat__label">{label}</div>
    </div>
  )
}
