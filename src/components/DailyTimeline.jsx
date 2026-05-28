import { painColor } from '../lib/pain'
import { dayKeyOf, todayKey } from '../lib/storage'

const HOURS = 24

export default function DailyTimeline({ checkIns, medications, flares, dateKey }) {
  const key = dateKey || todayKey()
  const dayCheckIns = checkIns
    .filter((c) => dayKeyOf(c.timestamp) === key)
    .sort((a, b) => a.timestamp - b.timestamp)
  const dayMeds = medications.filter((m) => dayKeyOf(m.timestamp) === key)
  const dayFlares = flares.filter((f) => dayKeyOf(f.startTime) === key)

  const now = new Date()
  const isToday = key === todayKey()
  const nowPct = isToday ? ((now.getHours() + now.getMinutes() / 60) / HOURS) * 100 : null

  return (
    <div className="timeline">
      <div className="timeline__hours">
        {[0, 6, 12, 18, 24].map((h) => (
          <div key={h} className="timeline__hour" style={{ left: `${(h / HOURS) * 100}%` }}>
            {h.toString().padStart(2, '0')}
          </div>
        ))}
      </div>

      <div className="timeline__plot">
        <div className="timeline__grid">
          {[0, 1, 2, 3].map((i) => <div key={i} className="timeline__grid-line" />)}
        </div>

        {dayFlares.map((f) => {
          const start = new Date(f.startTime)
          const endTs = f.endTime || (isToday ? now.getTime() : start.setHours(23, 59, 0, 0))
          const end = new Date(endTs)
          const sPct = ((start.getHours() + start.getMinutes() / 60) / HOURS) * 100
          const ePct = ((end.getHours() + end.getMinutes() / 60) / HOURS) * 100
          return (
            <div
              key={f.id}
              className="timeline__band"
              style={{
                left: `${sPct}%`,
                width: `${Math.max(1.5, ePct - sPct)}%`,
                color: painColor(f.peakIntensity ?? 6),
              }}
            />
          )
        })}

        {dayCheckIns.map((c) => {
          const dt = new Date(c.timestamp)
          const pct = ((dt.getHours() + dt.getMinutes() / 60) / HOURS) * 100
          const bottomPct = (c.painLevel / 10) * 100
          return (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                bottom: `${bottomPct}%`,
                color: painColor(c.painLevel),
              }}
            >
              <div className="timeline__point" />
              <div className="timeline__point-label">{c.painLevel}</div>
            </div>
          )
        })}

        {dayMeds.map((m) => {
          const dt = new Date(m.timestamp)
          const pct = ((dt.getHours() + dt.getMinutes() / 60) / HOURS) * 100
          return (
            <div
              key={m.id}
              className="timeline__med"
              style={{ left: `${pct}%` }}
              title={`${m.medicationName} · ${dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
            />
          )
        })}

        {nowPct != null && <div className="timeline__now" style={{ left: `${nowPct}%` }} />}
      </div>

      <div className="timeline__legend">
        <span><span className="timeline__legend-dot" style={{ background: 'var(--pain-5)' }} />Schmerz</span>
        <span><span className="timeline__legend-dot" style={{ background: 'var(--ink-soft)' }} />Medi</span>
        {nowPct != null && <span><span className="timeline__legend-dot" style={{ background: 'var(--clay)' }} />Jetzt</span>}
      </div>
    </div>
  )
}
