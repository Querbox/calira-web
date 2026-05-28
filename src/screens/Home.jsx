import { useState } from 'react'
import { TIME_SLOTS, painColor, painLabel, painTypeLabel } from '../lib/pain'
import { todayKey, dayKeyOf } from '../lib/storage'
import { useData, actions } from '../lib/store'
import DailyTimeline from '../components/DailyTimeline'
import CheckInSheet from '../components/CheckInSheet'
import MedicationSheet from '../components/MedicationSheet'
import Icon from '../components/Icon'

const SLOT_ICON = { morning: 'sun', midday: 'cloud', evening: 'moon' }

export default function Home() {
  const data = useData()
  const [sheet, setSheet] = useState(null)
  const [defaultSlot, setDefaultSlot] = useState(null)

  const key = todayKey()
  const today = data.checkIns.filter((c) => dayKeyOf(c.timestamp) === key)
  const meds = data.medications.filter((m) => dayKeyOf(m.timestamp) === key)
  const activeFlare = data.flares.find((f) => !f.endTime)

  const avg = today.length > 0
    ? Math.round((today.reduce((s, c) => s + c.painLevel, 0) / today.length) * 10) / 10
    : null
  const max = today.length ? Math.max(...today.map((c) => c.painLevel)) : null

  const now = new Date()
  const dateLabel = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  const greeting = getGreeting(now.getHours())

  function openCheckIn(slot) {
    setDefaultSlot(slot)
    setSheet('checkin')
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">
          <Icon name="clock" size={12} /> {dateLabel}
        </div>
        <h1 className="page-header__title">
          {greeting}, <em>heute.</em>
        </h1>
      </header>

      {activeFlare && (
        <div className="flare">
          <div className="flare__head">
            <Icon name="bolt" size={20} className="flare__icon" />
            <div>
              <div className="flare__label">Ein Schub läuft</div>
              <div className="flare__time">
                seit {new Date(activeFlare.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              const peak = Math.max(...today.map((c) => c.painLevel), activeFlare.peakIntensity || 5)
              actions.endFlare(activeFlare.id, peak)
            }}
          >
            beenden
          </button>
        </div>
      )}

      <section className="section">
        <div className="section__head">
          <div className="section__title">
            <Icon name="spark" size={14} /> Tages-Baseline
          </div>
          <div className="section__meta">{today.length} / 3</div>
        </div>
        <div className="figure">
          <div
            className={`figure__num ${avg == null ? 'figure__num--empty' : ''}`}
            style={avg != null ? { color: painColor(Math.round(avg)) } : undefined}
          >
            {avg != null ? avg.toFixed(1) : '—'}
          </div>
          <div className="figure__caption">
            <div className="figure__caption-label">Schmerz Ø</div>
            <div className="figure__caption-value">
              {avg != null ? painLabel(Math.round(avg)) : 'noch kein Eintrag'}
            </div>
          </div>
        </div>
        <div className="kv-row">
          <div className="kv"><div className="kv__label">Max heute</div><div className="kv__value">{max ?? '—'}</div></div>
          <div className="kv"><div className="kv__label">Medikamente</div><div className="kv__value">{meds.length}</div></div>
          <div className="kv"><div className="kv__label">Schübe</div><div className="kv__value">{data.flares.filter((f) => dayKeyOf(f.startTime) === key).length}</div></div>
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <div className="section__title">Drei Momente</div>
        </div>
        <div className="slots">
          {TIME_SLOTS.map((slot) => {
            const entry = today.find((c) => c.timeSlot === slot.id)
            return (
              <button
                key={slot.id}
                className={`slot ${entry ? 'is-done' : ''}`}
                onClick={() => openCheckIn(slot.id)}
              >
                <span className="slot__icon">
                  <Icon name={SLOT_ICON[slot.id]} size={18} />
                </span>
                <span className="slot__label">{slot.label}</span>
                {entry ? (
                  <span className="slot__detail">
                    {painLabel(entry.painLevel)}, {painTypeLabel(entry.dominantType)}
                  </span>
                ) : (
                  <span className="slot__detail slot__detail--empty">noch offen</span>
                )}
                {entry ? (
                  <span className="slot__value" style={{ color: painColor(entry.painLevel) }}>
                    <span className="slot__tick" />{entry.painLevel}
                  </span>
                ) : (
                  <span className="slot__value slot__value--empty">
                    eintragen <Icon name="arrow" size={14} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <div className="section__title">Verlauf des Tages</div>
        </div>
        <DailyTimeline
          checkIns={data.checkIns}
          medications={data.medications}
          flares={data.flares}
          dateKey={key}
        />
      </section>

      <div className="actions">
        <button className="actions__btn" onClick={() => setSheet('med')}>
          <Icon name="pill" size={16} /> Medikament
        </button>
        {!activeFlare && (
          <button
            className="actions__btn actions__btn--alert"
            onClick={() => actions.addFlare({ peakIntensity: 5, quality: 'akut' })}
          >
            <Icon name="bolt" size={16} /> Schub starten
          </button>
        )}
      </div>

      {meds.length > 0 && (
        <section className="section">
          <div className="section__head">
            <div className="section__title">
              <Icon name="pill" size={14} /> Medikamente heute
            </div>
          </div>
          <ul className="entries">
            {meds.map((m) => (
              <li key={m.id} className="entry">
                <span className="entry__time">
                  {new Date(m.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div>
                  <div className="entry__title">{m.medicationName}</div>
                  <div className="entry__meta">{m.dosage} · Wirkung: {m.perceivedEffect}</div>
                </div>
                <span />
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

function getGreeting(h) {
  if (h < 5) return 'Eine ruhige Nacht'
  if (h < 11) return 'Guten Morgen'
  if (h < 14) return 'Hallo'
  if (h < 18) return 'Guten Tag'
  if (h < 22) return 'Guten Abend'
  return 'Späte Stunde'
}
