import { useMemo } from 'react'
import { painColor } from '../lib/pain'
import { dayKeyOf, todayKey } from '../lib/storage'
import { computeHourlyRisk, summarizeCurve, riskLabel, riskColor } from '../lib/prediction'
import Icon from './Icon'

const HOURS = 24
const PLOT_W = 1000
const PLOT_H = 100

export default function DailyTimeline({ checkIns, medications, flares, dateKey, showPrediction = true }) {
  const key = dateKey || todayKey()
  const dayCheckIns = checkIns
    .filter((c) => dayKeyOf(c.timestamp) === key)
    .sort((a, b) => a.timestamp - b.timestamp)
  const dayMeds = medications.filter((m) => dayKeyOf(m.timestamp) === key)
  const dayFlares = flares.filter((f) => dayKeyOf(f.startTime) === key)

  const now = new Date()
  const isToday = key === todayKey()
  const nowPct = isToday ? ((now.getHours() + now.getMinutes() / 60) / HOURS) * 100 : null

  const prediction = useMemo(
    () => (showPrediction ? computeHourlyRisk(checkIns, key) : null),
    [checkIns, key, showPrediction]
  )
  const isCurve = Array.isArray(prediction)
  const summary = isCurve ? summarizeCurve(prediction) : null

  const pathD = isCurve ? buildSmoothPath(prediction) : null

  return (
    <div className="timeline">
      {isCurve && summary && (
        <Outlook summary={summary} />
      )}
      {prediction && prediction.insufficient && (
        <div className="outlook outlook--idle">
          <Icon name="spark" size={14} />
          <span>
            Prognose erscheint nach <em>{prediction.needed}</em> Tracking-Tagen
            <span className="outlook__sub"> · noch {prediction.needed - prediction.daysTracked}</span>
          </span>
        </div>
      )}

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

        {pathD && (
          <svg
            className="timeline__forecast"
            viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--clay)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--clay)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${pathD} L ${PLOT_W} ${PLOT_H} L 0 ${PLOT_H} Z`} fill="url(#forecast-fill)" />
            <path d={pathD} stroke="var(--clay)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" opacity="0.7" />
          </svg>
        )}

        {dayFlares.map((f) => {
          const start = new Date(f.startTime)
          const endTs = f.endTime || (isToday ? now.getTime() : new Date(start).setHours(23, 59, 0, 0))
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
            >
              <Icon name="pill" size={12} />
            </div>
          )
        })}

        {nowPct != null && <div className="timeline__now" style={{ left: `${nowPct}%` }} />}
      </div>

      <div className="timeline__legend">
        <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--pain-5)' }} /> Schmerz</span>
        <span><Icon name="pill" size={12} /> Medi</span>
        {pathD && (
          <span>
            <svg width="14" height="2" style={{ marginRight: 4 }}>
              <line x1="0" y1="1" x2="14" y2="1" stroke="var(--clay)" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
            Prognose
          </span>
        )}
        {nowPct != null && (
          <span><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--clay)' }} /> Jetzt</span>
        )}
      </div>
    </div>
  )
}

function Outlook({ summary }) {
  const peakClock = `${String(summary.peakHour).padStart(2, '0')}:00`
  const peakRisk = Math.round(summary.peakRisk)
  return (
    <div className="outlook">
      <div className="outlook__row">
        <div className="outlook__label">
          <Icon name="spark" size={14} /> Heutige Aussicht
        </div>
        <div className="outlook__pill" style={{ color: riskColor(peakRisk) }}>
          <span className="outlook__pill-num">{peakRisk}%</span>
          <span className="outlook__pill-text">{riskLabel(peakRisk)}</span>
        </div>
      </div>
      <div className="outlook__hint">
        Höchstes Risiko gegen <em>{peakClock}</em> Uhr · basiert auf deinen letzten Tagen
      </div>
    </div>
  )
}

function buildSmoothPath(curve) {
  if (!curve || curve.length === 0) return ''
  const points = curve.map((r, i) => {
    const x = (i / (HOURS - 1)) * PLOT_W
    const y = PLOT_H - (Math.max(0, Math.min(100, r)) / 100) * PLOT_H
    return [x, y]
  })
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    const [px, py] = points[i - 1]
    const [x, y] = points[i]
    const cx1 = px + (x - px) / 2
    const cx2 = px + (x - px) / 2
    d += ` C ${cx1} ${py}, ${cx2} ${y}, ${x} ${y}`
  }
  return d
}
