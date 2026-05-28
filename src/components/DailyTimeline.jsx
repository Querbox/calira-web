import { painColor } from '../lib/pain'
import { dayKeyOf, todayKey } from '../lib/storage'

const HOURS = 24

export default function DailyTimeline({ checkIns, medications, flares, dateKey }) {
  const key = dateKey || todayKey()
  const dayCheckIns = checkIns.filter((c) => dayKeyOf(c.timestamp) === key)
  const dayMeds = medications.filter((m) => dayKeyOf(m.timestamp) === key)
  const dayFlares = flares.filter((f) => dayKeyOf(f.startTime) === key)

  const now = new Date()
  const isToday = key === todayKey()
  const nowPct = isToday ? ((now.getHours() + now.getMinutes() / 60) / HOURS) * 100 : null

  const hourTicks = [0, 6, 12, 18, 24]

  return (
    <div className="timeline">
      <div className="timeline__axis">
        {hourTicks.map((h) => (
          <div key={h} className="timeline__tick" style={{ left: `${(h / HOURS) * 100}%` }}>
            <span>{h.toString().padStart(2, '0')}</span>
          </div>
        ))}
      </div>

      <Lane label="Schmerz">
        {dayFlares.map((f) => {
          const start = new Date(f.startTime)
          const end = f.endTime ? new Date(f.endTime) : isToday ? now : new Date(start).setHours(23, 59)
          const endDate = new Date(end)
          const startPct = ((start.getHours() + start.getMinutes() / 60) / HOURS) * 100
          const endPct = ((endDate.getHours() + endDate.getMinutes() / 60) / HOURS) * 100
          return (
            <div
              key={f.id}
              className="timeline__band"
              style={{
                left: `${startPct}%`,
                width: `${Math.max(2, endPct - startPct)}%`,
                background: `linear-gradient(90deg, ${painColor(f.peakIntensity ?? 6)}55, ${painColor(f.peakIntensity ?? 6)}22)`,
                borderColor: painColor(f.peakIntensity ?? 6),
              }}
            />
          )
        })}
        {dayCheckIns.map((c) => {
          const dt = new Date(c.timestamp)
          const pct = ((dt.getHours() + dt.getMinutes() / 60) / HOURS) * 100
          return (
            <div
              key={c.id}
              className="timeline__dot"
              style={{ left: `${pct}%`, background: painColor(c.painLevel) }}
              title={`${c.painLevel}/10 — ${dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
            >
              <span>{c.painLevel}</span>
            </div>
          )
        })}
      </Lane>

      <Lane label="Medis">
        {dayMeds.map((m) => {
          const dt = new Date(m.timestamp)
          const pct = ((dt.getHours() + dt.getMinutes() / 60) / HOURS) * 100
          return (
            <div key={m.id} className="timeline__pill" style={{ left: `${pct}%` }} title={m.medicationName}>
              💊
            </div>
          )
        })}
      </Lane>

      {nowPct != null && (
        <div className="timeline__now" style={{ left: `${nowPct}%` }}>
          <div className="timeline__now-dot" />
        </div>
      )}
    </div>
  )
}

function Lane({ label, children }) {
  return (
    <div className="timeline__lane">
      <div className="timeline__lane-label">{label}</div>
      <div className="timeline__lane-track">{children}</div>
    </div>
  )
}
