import { useState } from 'react'
import { TIME_SLOTS, painColor, painLabel } from '../lib/pain'
import { todayKey, dayKeyOf } from '../lib/storage'
import { useData, actions } from '../lib/store'
import PainRing from '../components/PainRing'
import DailyTimeline from '../components/DailyTimeline'
import CheckInSheet from '../components/CheckInSheet'
import MedicationSheet from '../components/MedicationSheet'

export default function Home() {
  const data = useData()
  const [sheet, setSheet] = useState(null)
  const [defaultSlot, setDefaultSlot] = useState(null)

  const key = todayKey()
  const todayCheckIns = data.checkIns.filter((c) => dayKeyOf(c.timestamp) === key)
  const todayMeds = data.medications.filter((m) => dayKeyOf(m.timestamp) === key)
  const activeFlare = data.flares.find((f) => !f.endTime)

  const baseline =
    todayCheckIns.length > 0
      ? Math.round((todayCheckIns.reduce((s, c) => s + c.painLevel, 0) / todayCheckIns.length) * 10) / 10
      : null

  const dateLabel = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  function openCheckIn(slot) {
    setDefaultSlot(slot)
    setSheet('checkin')
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">Heute</div>
        <h1 className="page-header__title">{dateLabel}</h1>
      </header>

      {activeFlare && (
        <div className="flare-banner">
          <div>
            <div className="flare-banner__label">Aktiver Schub</div>
            <div className="flare-banner__time">
              Seit {new Date(activeFlare.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              const peak = Math.max(...todayCheckIns.map((c) => c.painLevel), activeFlare.peakIntensity || 5)
              actions.endFlare(activeFlare.id, peak)
            }}
          >
            Beenden
          </button>
        </div>
      )}

      <section className="card card--hero">
        <div className="card__header">
          <h2>Tages-Baseline</h2>
          <span className="card__meta">{todayCheckIns.length}/3 Check-ins</span>
        </div>
        <div className="hero-row">
          <PainRing level={baseline != null ? Math.round(baseline) : null} size={120} stroke={10} />
          <div className="hero-stats">
            <Stat label="Ø Schmerz" value={baseline ?? '—'} />
            <Stat label="Max heute" value={todayCheckIns.length ? Math.max(...todayCheckIns.map((c) => c.painLevel)) : '—'} />
            <Stat label="Medis" value={todayMeds.length} />
          </div>
        </div>
      </section>

      <section className="slot-grid">
        {TIME_SLOTS.map((slot) => {
          const entry = todayCheckIns.find((c) => c.timeSlot === slot.id)
          return (
            <button key={slot.id} className={`slot-card ${entry ? 'is-done' : ''}`} onClick={() => openCheckIn(slot.id)}>
              <div className="slot-card__label">{slot.label}</div>
              {entry ? (
                <>
                  <div className="slot-card__value" style={{ color: painColor(entry.painLevel) }}>
                    {entry.painLevel}
                  </div>
                  <div className="slot-card__meta">{painLabel(entry.painLevel)}</div>
                </>
              ) : (
                <>
                  <div className="slot-card__value slot-card__value--empty">+</div>
                  <div className="slot-card__meta">Check-in</div>
                </>
              )}
            </button>
          )
        })}
      </section>

      <section className="card">
        <div className="card__header">
          <h2>Tagesverlauf</h2>
        </div>
        <DailyTimeline
          checkIns={data.checkIns}
          medications={data.medications}
          flares={data.flares}
          dateKey={key}
        />
      </section>

      <section className="action-row">
        <button className="btn btn-soft" onClick={() => setSheet('med')}>
          💊 Medikament
        </button>
        {!activeFlare ? (
          <button
            className="btn btn-danger"
            onClick={() => actions.addFlare({ peakIntensity: 5, quality: 'akut' })}
          >
            ⚡ Schub starten
          </button>
        ) : (
          <span />
        )}
      </section>

      {todayMeds.length > 0 && (
        <section className="card">
          <div className="card__header"><h2>Medikamente heute</h2></div>
          <ul className="list">
            {todayMeds.map((m) => (
              <li key={m.id} className="list__row">
                <div>
                  <div className="list__title">{m.medicationName}</div>
                  <div className="list__meta">{m.dosage} · {m.perceivedEffect}</div>
                </div>
                <div className="list__time">
                  {new Date(m.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sheet === 'checkin' && <CheckInSheet defaultSlot={defaultSlot} onClose={() => setSheet(null)} />}
      {sheet === 'med' && <MedicationSheet onClose={() => setSheet(null)} />}
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  )
}
