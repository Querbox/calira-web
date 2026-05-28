import { useMemo, useState } from 'react'
import { dayKeyOf, todayKey } from '../lib/storage'
import { useData } from '../lib/store'
import { painColor, painLabel } from '../lib/pain'
import DailyTimeline from '../components/DailyTimeline'

export default function History() {
  const data = useData()
  const [openDay, setOpenDay] = useState(null)

  const days = useMemo(() => {
    const map = new Map()
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      map.set(dayKeyOf(d.getTime()), { date: d, checkIns: [], meds: [], flares: [] })
    }
    data.checkIns.forEach((c) => {
      const k = dayKeyOf(c.timestamp)
      if (map.has(k)) map.get(k).checkIns.push(c)
    })
    data.medications.forEach((m) => {
      const k = dayKeyOf(m.timestamp)
      if (map.has(k)) map.get(k).meds.push(m)
    })
    data.flares.forEach((f) => {
      const k = dayKeyOf(f.startTime)
      if (map.has(k)) map.get(k).flares.push(f)
    })
    return Array.from(map.entries()).map(([key, v]) => {
      const avg = v.checkIns.length
        ? v.checkIns.reduce((s, c) => s + c.painLevel, 0) / v.checkIns.length
        : null
      const max = v.checkIns.length ? Math.max(...v.checkIns.map((c) => c.painLevel)) : null
      return { key, ...v, avg, max }
    })
  }, [data])

  const summary = useMemo(() => {
    const withData = days.filter((d) => d.checkIns.length > 0)
    const good = withData.filter((d) => d.max <= 3).length
    const severe = withData.filter((d) => d.max >= 7).length
    const medDays = days.filter((d) => d.meds.length > 0).length
    return { tracked: withData.length, good, severe, medDays }
  }, [days])

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">Verlauf</div>
        <h1 className="page-header__title">Letzte 30 Tage</h1>
      </header>

      <section className="stats-grid">
        <Stat label="Tracked" value={summary.tracked} />
        <Stat label="Gute Tage" value={summary.good} color="var(--success)" />
        <Stat label="Schwere Tage" value={summary.severe} color="var(--danger)" />
        <Stat label="Mit Medis" value={summary.medDays} />
      </section>

      <section className="card">
        <div className="card__header"><h2>Schmerz-Landschaft</h2></div>
        <div className="landscape">
          {days.map((d) => {
            const h = d.max != null ? (d.max / 10) * 100 : 6
            return (
              <button
                key={d.key}
                className={`landscape__bar ${d.key === todayKey() ? 'is-today' : ''}`}
                style={{ height: `${h}%`, background: d.max != null ? painColor(d.max) : 'var(--border)' }}
                onClick={() => setOpenDay(d)}
                title={`${d.date.toLocaleDateString('de-DE')} · Max ${d.max ?? '—'}`}
              />
            )
          })}
        </div>
        <div className="landscape__axis">
          <span>vor 30 Tagen</span>
          <span>heute</span>
        </div>
      </section>

      <section className="card">
        <div className="card__header"><h2>Tagesliste</h2></div>
        <ul className="list">
          {[...days].reverse().filter((d) => d.checkIns.length || d.meds.length || d.flares.length).map((d) => (
            <li key={d.key} className="list__row list__row--button" onClick={() => setOpenDay(d)}>
              <div>
                <div className="list__title">
                  {d.date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div className="list__meta">
                  {d.checkIns.length} Check-ins · {d.meds.length} Medis
                  {d.flares.length ? ` · ${d.flares.length} Schub` : ''}
                </div>
              </div>
              {d.max != null && (
                <div className="list__pill" style={{ background: painColor(d.max) }}>
                  {d.max}
                </div>
              )}
            </li>
          ))}
          {days.every((d) => !d.checkIns.length && !d.meds.length && !d.flares.length) && (
            <li className="list__row"><div className="list__meta">Noch keine Einträge.</div></li>
          )}
        </ul>
      </section>

      {openDay && <DayDetail day={openDay} data={data} onClose={() => setOpenDay(null)} />}
    </>
  )
}

function DayDetail({ day, data, onClose }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__header">
          <div>
            <div className="sheet__eyebrow">Tag</div>
            <h2 className="sheet__title">
              {day.date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
          </div>
          <button className="sheet__close" onClick={onClose} aria-label="Schließen">×</button>
        </div>
        <div className="sheet__body">
          <div className="hero-stats">
            <Stat label="Ø Schmerz" value={day.avg != null ? day.avg.toFixed(1) : '—'} />
            <Stat label="Max" value={day.max ?? '—'} color={day.max != null ? painColor(day.max) : undefined} />
            <Stat label="Medis" value={day.meds.length} />
          </div>
          <DailyTimeline
            checkIns={data.checkIns}
            medications={data.medications}
            flares={data.flares}
            dateKey={day.key}
          />
          {day.checkIns.length > 0 && (
            <>
              <div className="field-label">Check-ins</div>
              <ul className="list">
                {day.checkIns.map((c) => (
                  <li key={c.id} className="list__row">
                    <div>
                      <div className="list__title" style={{ color: painColor(c.painLevel) }}>
                        {c.painLevel}/10 · {painLabel(c.painLevel)}
                      </div>
                      <div className="list__meta">{c.dominantType} · Stress {c.stressLevel} · Nacken {c.neckTension}</div>
                    </div>
                    <div className="list__time">
                      {new Date(c.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="stat">
      <div className="stat__value" style={color ? { color } : undefined}>{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  )
}
