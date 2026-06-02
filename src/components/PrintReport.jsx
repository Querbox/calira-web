import { useEffect } from 'react'
import { dayKeyOf } from '../lib/storage'
import { topTriggers, monthlyMedUsage, monthLabel } from '../lib/insights'
import { painLabel, painColor } from '../lib/pain'

const DAYS = 28

export default function PrintReport({ data, onClose }) {
  useEffect(() => {
    const onAfter = () => onClose?.()
    window.addEventListener('afterprint', onAfter)
    const t = setTimeout(() => window.print(), 300)
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
  const severe = days.filter((d) => d.max != null && d.max >= 7).length
  const flareCount = days.flatMap((d) => d.fl).length
  const meds = days.flatMap((d) => d.md)
  const overallAvg = days.filter((d) => d.avg != null).reduce((s, d, _, arr) => s + d.avg / arr.length, 0) || 0

  const triggers = topTriggers(data.flares, 28)
  const medUsage = monthlyMedUsage(data.medications)

  const medCounts = new Map()
  meds.forEach((m) => { medCounts.set(m.medicationName, (medCounts.get(m.medicationName) || 0) + 1) })
  const medList = Array.from(medCounts.entries()).sort((a, b) => b[1] - a[1])

  const dateRange = `${days[0].date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} – ${days[days.length - 1].date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`

  // Weekly breakdown for the mini chart
  const weeks = [0, 1, 2, 3].map((w) => {
    const slice = days.slice(w * 7, (w + 1) * 7)
    const withData = slice.filter((d) => d.avg != null)
    const avg = withData.length ? withData.reduce((s, d) => s + d.avg, 0) / withData.length : null
    const max = withData.length ? Math.max(...withData.map((d) => d.max)) : null
    const start = slice[0]?.date
    return { avg, max, start, days: slice }
  })

  return (
    <div className="pr">
      {/* ── Header ── */}
      <header className="pr__header">
        <div className="pr__brand">
          <span className="pr__logo">C</span>
          <span className="pr__brandname">Calira</span>
          <span className="pr__brandtag">Verlaufsbericht</span>
        </div>
        <div className="pr__header-right">
          <div className="pr__date">Druckdatum: {today.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </header>

      <div className="pr__title-block">
        {data.name && <div className="pr__patient">{data.name}</div>}
        <h1 className="pr__title">{dateRange}</h1>
        <div className="pr__subtitle">28-Tage-Übersicht · {tracked} von 28 Tagen erfasst</div>
      </div>

      {/* ── Key figures ── */}
      <div className="pr__figures">
        <Figure label="Schmerz Ø" value={overallAvg.toFixed(1)} sub={painLabel(Math.round(overallAvg))} accent />
        <Figure label="Gute Tage" value={good} sub="≤ 3/10" />
        <Figure label="Schwere Tage" value={severe} sub="≥ 7/10" warn={severe > 0} />
        <Figure label="Schübe" value={flareCount} />
        <Figure label="Medi-Tage" value={medUsage.count} sub={`Grenze: ${medUsage.limit}`} warn={medUsage.level !== 'ok'} />
      </div>

      {/* ── 4-week mini heatmap ── */}
      <div className="pr__heatmap">
        <div className="pr__section-title">Schmerz-Übersicht</div>
        <div className="pr__heat-grid">
          <div className="pr__heat-labels">
            <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
          </div>
          {weeks.map((w, wi) => (
            <div className="pr__heat-row" key={wi}>
              <div className="pr__heat-week">W{wi + 1}</div>
              {w.days.map((d) => {
                const bg = d.max != null
                  ? d.max <= 2 ? '#c8dcc0' : d.max <= 4 ? '#e0d49a' : d.max <= 6 ? '#daa874' : d.max <= 8 ? '#cc7a5c' : '#a84838'
                  : '#ebe2cc'
                return (
                  <div className="pr__heat-cell" key={d.key} style={{ background: bg }}>
                    {d.max != null ? d.max : ''}
                  </div>
                )
              })}
            </div>
          ))}
          <div className="pr__heat-legend">
            <span>0–2 gut</span>
            <span className="pr__heat-legend-bar" />
            <span>8–10 stark</span>
          </div>
        </div>
      </div>

      {/* ── Daily table ── */}
      <div className="pr__section">
        <div className="pr__section-title">Tagesdetails</div>
        <table className="pr__table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Ø</th>
              <th>Max</th>
              <th style={{ textAlign: 'center' }}>CI</th>
              <th>Medikamente</th>
              <th style={{ textAlign: 'center' }}>Schübe</th>
            </tr>
          </thead>
          <tbody>
            {days.filter((d) => d.ck.length || d.md.length || d.fl.length).map((d) => (
              <tr key={d.key} className={d.max >= 7 ? 'pr__table-row--severe' : ''}>
                <td className="pr__table-date">
                  {d.date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </td>
                <td>{d.avg != null ? d.avg.toFixed(1) : '—'}</td>
                <td className="pr__table-max">{d.max ?? '—'}</td>
                <td style={{ textAlign: 'center' }}>{d.ck.length}</td>
                <td className="pr__table-meds">{d.md.map((m) => m.medicationName).join(', ') || '—'}</td>
                <td style={{ textAlign: 'center' }}>{d.fl.length || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Two-column: Meds + Triggers ── */}
      <div className="pr__two-col">
        {medList.length > 0 && (
          <div className="pr__col">
            <div className="pr__section-title">Medikamenten-Übersicht</div>
            <table className="pr__table pr__table--compact">
              <thead><tr><th>Präparat</th><th style={{ textAlign: 'right' }}>Einnahmen</th></tr></thead>
              <tbody>
                {medList.map(([name, count]) => (
                  <tr key={name}><td>{name}</td><td style={{ textAlign: 'right' }}>{count}×</td></tr>
                ))}
              </tbody>
            </table>
            <div className="pr__med-note">
              Akut-Medikamenten-Tage ({monthLabel()}):
              <strong className={medUsage.level !== 'ok' ? 'pr__med-warn' : ''}> {medUsage.count} / {medUsage.limit}</strong>
              {medUsage.level === 'high' && <span className="pr__med-warn"> · MÜK-Risiko</span>}
            </div>
          </div>
        )}
        {triggers.length > 0 && (
          <div className="pr__col">
            <div className="pr__section-title">Häufigste Auslöser</div>
            <div className="pr__trigger-list">
              {triggers.slice(0, 6).map((t) => {
                const pct = (t.count / triggers[0].count) * 100
                return (
                  <div className="pr__trigger" key={t.trigger}>
                    <div className="pr__trigger-name">{t.trigger}</div>
                    <div className="pr__trigger-bar"><div className="pr__trigger-fill" style={{ width: `${pct}%` }} /></div>
                    <div className="pr__trigger-count">{t.count}×</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="pr__footer">
        <div className="pr__footer-line" />
        <div className="pr__footer-text">
          Erstellt mit <strong>Calira</strong> · Alle Daten liegen ausschließlich lokal im Browser · Kein Cloud-Speicher, kein Account ·
          Dieses Dokument wurde vom Nutzer selbst erzeugt
        </div>
      </footer>
    </div>
  )
}

function Figure({ label, value, sub, accent, warn }) {
  return (
    <div className={`pr__figure ${warn ? 'pr__figure--warn' : ''} ${accent ? 'pr__figure--accent' : ''}`}>
      <div className="pr__figure-num">{value}</div>
      <div className="pr__figure-label">{label}</div>
      {sub && <div className="pr__figure-sub">{sub}</div>}
    </div>
  )
}
