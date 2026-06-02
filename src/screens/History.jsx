import { useMemo, useRef, useState } from 'react'
import { dayKeyOf, todayKey } from '../lib/storage'
import { useData } from '../lib/store'
import { painColor, painLabel, painTypeLabel } from '../lib/pain'
import { useSwipe, useDragDownToDismiss } from '../lib/useSwipe'
import DailyTimeline from '../components/DailyTimeline'
import CheckInSheet from '../components/CheckInSheet'
import MedicationSheet from '../components/MedicationSheet'
import Icon from '../components/Icon'
import { topTriggers, monthlyMedUsage, monthLabel, weatherCorrelation } from '../lib/insights'

export default function History() {
  const data = useData()
  const [openDayKey, setOpenDayKey] = useState(null)

  const days = useMemo(() => {
    const map = new Map()
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      map.set(dayKeyOf(d.getTime()), { date: d, checkIns: [], meds: [], flares: [] })
    }
    data.checkIns.forEach((c) => { const k = dayKeyOf(c.timestamp); if (map.has(k)) map.get(k).checkIns.push(c) })
    data.medications.forEach((m) => { const k = dayKeyOf(m.timestamp); if (map.has(k)) map.get(k).meds.push(m) })
    data.flares.forEach((f) => { const k = dayKeyOf(f.startTime); if (map.has(k)) map.get(k).flares.push(f) })
    return Array.from(map.entries()).map(([key, v]) => {
      const avg = v.checkIns.length ? v.checkIns.reduce((s, c) => s + c.painLevel, 0) / v.checkIns.length : null
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

  const dayList = [...days].reverse().filter((d) => d.checkIns.length || d.meds.length || d.flares.length)
  const openDay = openDayKey ? days.find((d) => d.key === openDayKey) : null
  const triggers = topTriggers(data.flares, 30, data.checkIns)
  const medUsage = monthlyMedUsage(data.medications)
  const weatherCor = weatherCorrelation(data.checkIns)

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">
          <Icon name="history" size={12} /> Verlauf
        </div>
        <h1 className="page-header__title">Die letzten <em>dreißig</em> Tage</h1>
      </header>

      <div className="stats">
        <div className="stats__cell"><div className="stats__num">{summary.tracked}</div><div className="stats__label">Tracked</div></div>
        <div className="stats__cell"><div className="stats__num">{summary.good}</div><div className="stats__label">Gute Tage</div></div>
        <div className="stats__cell"><div className="stats__num" style={{ color: summary.severe > 0 ? 'var(--pain-7)' : undefined }}>{summary.severe}</div><div className="stats__label">Schwere Tage</div></div>
        <div className="stats__cell"><div className="stats__num">{summary.medDays}</div><div className="stats__label">Mit Medis</div></div>
      </div>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 8px' }}>
          <div className="section__title">Schmerz-Landschaft</div>
          <div className="section__meta">Max pro Tag</div>
        </div>
        <div className="landscape">
          {days.map((d) => {
            const h = d.max != null ? (d.max / 10) * 100 : 4
            return (
              <button
                key={d.key}
                className={`landscape__bar ${d.key === todayKey() ? 'is-today' : ''}`}
                style={{ height: `${h}%`, background: d.max != null ? painColor(d.max) : undefined }}
                onClick={() => setOpenDayKey(d.key)}
                aria-label={`${d.date.toLocaleDateString('de-DE')} öffnen`}
              />
            )
          })}
        </div>
        <div className="landscape__axis">
          <span>vor 30 Tagen</span>
          <span>heute</span>
        </div>
      </div>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 4px' }}>
          <div className="section__title">Tagesliste</div>
        </div>
        <ul className="entries">
          {dayList.map((d) => (
            <li key={d.key}>
              <button className="entry entry--button" onClick={() => setOpenDayKey(d.key)}>
                <span className="entry__time">
                  {d.date.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', '')}
                  <br />
                  {d.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </span>
                <div>
                  <div className="entry__title">
                    {d.avg != null ? <>Ø <em>{d.avg.toFixed(1)}</em></> : 'nur Medikamente'}
                  </div>
                  <div className="entry__meta">
                    {d.checkIns.length} Check-ins · {d.meds.length} Medis
                    {d.flares.length ? ` · ${d.flares.length} Schub` : ''}
                  </div>
                </div>
                <span className="entry__num" style={d.max != null ? { color: painColor(d.max) } : undefined}>
                  {d.max ?? '—'}
                </span>
              </button>
            </li>
          ))}
          {dayList.length === 0 && (
            <li className="entry"><span /><span className="entry__meta">Noch keine Einträge.</span><span /></li>
          )}
        </ul>
      </div>

      {triggers.length > 0 && (
        <div className="card">
          <div className="section__head" style={{ padding: '0 0 12px' }}>
            <div className="section__title">Häufigste Auslöser</div>
            <div className="section__meta">letzte 30 Tage</div>
          </div>
          <div className="trigger-list">
            {triggers.slice(0, 5).map((t) => {
              const pct = (t.count / triggers[0].count) * 100
              return (
                <div key={t.trigger} className="trigger-row">
                  <div className="trigger-row__label">{t.trigger}</div>
                  <div className="trigger-row__bar">
                    <div className="trigger-row__bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="trigger-row__count">{t.count}×</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {weatherCor.total >= 5 && (
        <div className="card">
          <div className="section__head" style={{ padding: '0 0 12px' }}>
            <div className="section__title"><Icon name="cloud" size={14} /> Wetter & Schmerz</div>
            <div className="section__meta">{weatherCor.total} Datenpunkte</div>
          </div>
          <div className="weather-cor">
            <CorBar label="Druckabfall" avg={weatherCor.drop.avg} count={weatherCor.drop.count} warn />
            <CorBar label="Stabil" avg={weatherCor.stable.avg} count={weatherCor.stable.count} />
            <CorBar label="Druckanstieg" avg={weatherCor.rise.avg} count={weatherCor.rise.count} />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Ø Schmerzlevel bei verschiedenen Luftdruck-Veränderungen (3h-Fenster).
            {weatherCor.drop.avg != null && weatherCor.stable.avg != null && weatherCor.drop.avg > weatherCor.stable.avg + 1 && (
              <> <em>Druckabfälle scheinen deine Schmerzen zu verstärken.</em></>
            )}
          </p>
        </div>
      )}

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 12px' }}>
          <div className="section__title">Akut-Medikamente</div>
          <div className="section__meta">{monthLabel()}</div>
        </div>
        <div className="med-meter">
          <div className="med-meter__num" style={{ color: medUsage.level === 'high' ? 'var(--pain-7)' : medUsage.level === 'warn' ? 'var(--pain-5)' : 'var(--ink)' }}>
            {medUsage.count}
            <span className="med-meter__limit">/ {medUsage.limit} Tage</span>
          </div>
          <div className="med-meter__bar">
            <div
              className="med-meter__bar-fill"
              style={{
                width: `${Math.min(100, (medUsage.count / 15) * 100)}%`,
                background:
                  medUsage.level === 'high' ? 'var(--pain-7)' :
                  medUsage.level === 'warn' ? 'var(--pain-5)' : 'var(--pain-1)',
              }}
            />
            <div className="med-meter__bar-tick" style={{ left: `${(10 / 15) * 100}%` }} title="Empfehlungsgrenze" />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            Bei chronischen Kopfschmerzen empfehlen Leitlinien max. <em>10 Tage</em> pro Monat
            mit Akut-Medikamenten — darüber steigt das Risiko für medikamenten­induzierten
            Kopfschmerz.
          </p>
        </div>
      </div>

      {openDay && (
        <DayDetail
          day={openDay}
          data={data}
          dayList={dayList}
          onNavigate={(delta) => {
            const idx = dayList.findIndex((d) => d.key === openDay.key)
            const next = dayList[idx + delta]
            if (next) setOpenDayKey(next.key)
          }}
          onClose={() => setOpenDayKey(null)}
        />
      )}
    </>
  )
}

function DayDetail({ day, data, dayList, onNavigate, onClose }) {
  const sheetRef = useRef(null)
  const [editing, setEditing] = useState(null) // { kind, entry }

  useDragDownToDismiss(sheetRef, {
    onDrag: (dy) => {
      if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)`
    },
    onRelease: () => {
      const el = sheetRef.current
      if (!el) return
      const m = new DOMMatrix(getComputedStyle(el).transform)
      el.style.transform = ''
      if (m.m42 > 120) onClose()
    },
  })

  useSwipe(sheetRef, {
    onLeft: () => onNavigate(1),
    onRight: () => onNavigate(-1),
    threshold: 80,
  })

  const idx = dayList.findIndex((d) => d.key === day.key)
  const hasPrev = idx >= 0 && idx < dayList.length - 1
  const hasNext = idx > 0

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" />
        <div className="sheet__head">
          <div>
            <div className="sheet__eyebrow">
              {day.date.toLocaleDateString('de-DE', { weekday: 'long' })}
            </div>
            <h2 className="sheet__title">
              {day.date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
            </h2>
          </div>
          <button className="sheet__close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="sheet__body">
          <div className="kv-row" style={{ borderTop: 'none', paddingTop: 0 }}>
            <div className="kv"><div className="kv__label">Schmerz Ø</div><div className="kv__value">{day.avg != null ? day.avg.toFixed(1) : '—'}</div></div>
            <div className="kv"><div className="kv__label">Max</div><div className="kv__value" style={day.max != null ? { color: painColor(day.max) } : undefined}>{day.max ?? '—'}</div></div>
            <div className="kv"><div className="kv__label">Medis</div><div className="kv__value">{day.meds.length}</div></div>
          </div>

          <DailyTimeline checkIns={data.checkIns} medications={data.medications} flares={data.flares} dateKey={day.key} />

          {day.checkIns.length > 0 && (
            <>
              <div className="field-label">Check-ins</div>
              <ul className="entries">
                {day.checkIns.map((c) => (
                  <li key={c.id}>
                    <button className="entry entry--button" onClick={() => setEditing({ kind: 'checkIn', entry: c })}>
                      <span className="entry__time">
                        {new Date(c.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div>
                        <div className="entry__title" style={{ color: painColor(c.painLevel) }}>
                          {painLabel(c.painLevel)}, {painTypeLabel(c.dominantType)}
                        </div>
                        <div className="entry__meta">Stress {c.stressLevel}/10 · Nacken {c.neckTension}/10</div>
                      </div>
                      <span className="entry__num" style={{ color: painColor(c.painLevel) }}>{c.painLevel}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {day.meds.length > 0 && (
            <>
              <div className="field-label">Medikamente</div>
              <ul className="entries">
                {day.meds.map((m) => (
                  <li key={m.id}>
                    <button className="entry entry--button" onClick={() => setEditing({ kind: 'med', entry: m })}>
                      <span className="entry__time">
                        {new Date(m.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div>
                        <div className="entry__title">{m.medicationName}</div>
                        <div className="entry__meta">{m.dosage} · Wirkung: {m.perceivedEffect}</div>
                      </div>
                      <Icon name="arrow" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {editing?.kind === 'checkIn' && (
            <CheckInSheet existing={editing.entry} onClose={() => setEditing(null)} />
          )}
          {editing?.kind === 'med' && (
            <MedicationSheet existing={editing.entry} onClose={() => setEditing(null)} />
          )}

          <div className="sheet__hint">
            {hasPrev || hasNext ? 'wischen zum Tag wechseln' : ''} · nach unten ziehen zum Schließen
          </div>
        </div>
      </div>
    </div>
  )
}

function CorBar({ label, avg, count, warn }) {
  if (avg == null) return (
    <div className="cor-bar">
      <div className="cor-bar__label">{label}</div>
      <div className="cor-bar__track"><div className="cor-bar__fill" style={{ width: 0 }} /></div>
      <div className="cor-bar__val">—</div>
    </div>
  )
  return (
    <div className={`cor-bar ${warn && avg > 4 ? 'cor-bar--warn' : ''}`}>
      <div className="cor-bar__label">{label}</div>
      <div className="cor-bar__track">
        <div className="cor-bar__fill" style={{ width: `${(avg / 10) * 100}%`, background: painColor(Math.round(avg)) }} />
      </div>
      <div className="cor-bar__val">Ø {avg.toFixed(1)} <span className="cor-bar__count">({count})</span></div>
    </div>
  )
}
