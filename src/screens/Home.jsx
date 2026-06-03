import { useState, useRef, useEffect } from 'react'
import { TIME_SLOTS, painColor, painLabel, painTypeLabel } from '../lib/pain'
import { todayKey, dayKeyOf } from '../lib/storage'
import { useData, actions } from '../lib/store'
import DailyTimeline from '../components/DailyTimeline'
import CheckInSheet from '../components/CheckInSheet'
import MedicationSheet from '../components/MedicationSheet'
import FlareSheet, { EndFlareSheet } from '../components/FlareSheet'
import PainDotScale from '../components/PainDotScale'
import Icon from '../components/Icon'
import { monthlyMedUsage } from '../lib/insights'
import { fetchDayPressure } from '../lib/weather'
import { DayDetail } from './History'

const SLOT_META = {
  morning: { icon: 'sun',   tint: 'morning' },
  midday:  { icon: 'cloud', tint: 'midday' },
  evening: { icon: 'moon',  tint: 'evening' },
}

export default function Home() {
  const data = useData()
  const [sheet, setSheet] = useState(null)
  const [defaultSlot, setDefaultSlot] = useState(null)
  const [editing, setEditing] = useState(null) // { kind: 'checkIn'|'med', entry }
  const [dayPressure, setDayPressure] = useState(null)

  const key = todayKey()

  useEffect(() => {
    let cancelled = false
    fetchDayPressure(key).then((p) => { if (!cancelled) setDayPressure(p) })
    return () => { cancelled = true }
  }, [key])
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
    const existing = today.find((c) => c.timeSlot === slot)
    if (existing) {
      setEditing({ kind: 'checkIn', entry: existing })
      setSheet('checkin-edit')
    } else {
      setDefaultSlot(slot)
      setSheet('checkin')
    }
  }

  function openMedication(med) {
    setEditing({ kind: 'med', entry: med })
    setSheet('med-edit')
  }

  const medUsage = monthlyMedUsage(data.medications)

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">
          <Icon name="clock" size={13} /> {dateLabel}
        </div>
        <h1 className="page-header__title">
          {data.name ? <>{greeting}, <em>{data.name}.</em></> : <>{greeting}.</>}
        </h1>
        {!data.name && <NamePrompt />}
      </header>

      {activeFlare && (
        <FlareCard
          flare={activeFlare}
          onEnd={() => setSheet('end-flare')}
          onAdjust={(delta) => actions.adjustFlareIntensity(activeFlare.id, delta)}
        />
      )}

      {medUsage.level !== 'ok' && (
        <div className={`med-warn med-warn--${medUsage.level}`}>
          <div className="med-warn__icon"><Icon name="pill" size={16} /></div>
          <div>
            <div className="med-warn__title">
              {medUsage.level === 'high'
                ? 'Medikamenten-Übergebrauch'
                : 'Erhöhter Medikamenten-Bedarf'}
            </div>
            <div className="med-warn__sub">
              {medUsage.count} Tage mit Akut-Medi diesen Monat.{' '}
              {medUsage.level === 'high'
                ? 'Über 15 Tage erhöht das Risiko für medikamenten­induzierten Kopfschmerz — bitte mit Ärzt*in besprechen.'
                : 'Ab ~10 Tagen pro Monat empfehlen Leitlinien eine ärztliche Rücksprache.'}
            </div>
          </div>
        </div>
      )}

      <div className="card hero-card">
        <div className="hero-card__head">
          <span className="hero-card__eyebrow"><Icon name="spark" size={14} /> Tages-Baseline</span>
          <span className="hero-card__meta">{today.length} / 3 Check-ins</span>
        </div>
        <div className="figure">
          <div
            className={`figure__num ${avg == null ? 'figure__num--empty' : ''}`}
            style={avg != null ? { color: painColor(Math.round(avg)) } : undefined}
          >
            {avg != null ? avg.toFixed(1) : '—'}
          </div>
          <div className="figure__suffix">{avg != null ? painLabel(Math.round(avg)) : 'noch kein Eintrag'}</div>
        </div>
        <PainDotScale value={avg ?? 0} size="lg" />
        <div className="hero-card__stats">
          <div className="kv"><div className="kv__label">Max heute</div><div className="kv__value">{max ?? '—'}</div></div>
          <div className="kv"><div className="kv__label">Medikamente</div><div className="kv__value">{meds.length}</div></div>
          <div className="kv"><div className="kv__label">Schübe</div><div className="kv__value">{data.flares.filter((f) => dayKeyOf(f.startTime) === key).length}</div></div>
        </div>
      </div>

      <div className="section__head">
        <div className="section__title">Drei Momente</div>
      </div>
      <div className="slots">
        {TIME_SLOTS.map((slot) => {
          const entry = today.find((c) => c.timeSlot === slot.id)
          const meta = SLOT_META[slot.id]
          return (
            <button
              key={slot.id}
              className={`slot-tile card--tint-${meta.tint}`}
              onClick={() => openCheckIn(slot.id)}
            >
              <div className="slot-tile__top">
                <div className="slot-tile__icon-wrap"><Icon name={meta.icon} size={16} /></div>
                <div className="slot-tile__arrow"><Icon name="arrow" size={14} /></div>
              </div>
              <div className="slot-tile__label">{slot.label}</div>
              {entry ? (
                <div className="slot-tile__detail">
                  <em>{entry.painLevel}</em>/10 · {painTypeLabel(entry.dominantTypes || entry.dominantType)}
                </div>
              ) : (
                <div className="slot-tile__detail">eintragen</div>
              )}
            </button>
          )
        })}
      </div>

      <button type="button" className="card card--clickable timeline-card" onClick={() => setSheet('day-detail')}>
        <div className="hero-card__head" style={{ marginBottom: 6 }}>
          <span className="hero-card__eyebrow"><Icon name="clock" size={14} /> Verlauf des Tages</span>
          <span className="hero-card__meta"><Icon name="arrow" size={12} /> öffnen</span>
        </div>
        <DailyTimeline
          checkIns={data.checkIns}
          medications={data.medications}
          flares={data.flares}
          dateKey={key}
          dayPressure={dayPressure}
        />
      </button>

      <div className="actions">
        <button className="btn btn-soft" onClick={() => setSheet('med')}>
          <Icon name="pill" size={16} /> Medikament
        </button>
        {!activeFlare && (
          <button className="btn btn-accent" onClick={() => setSheet('flare')}>
            <Icon name="bolt" size={16} /> Schub starten
          </button>
        )}
      </div>

      {!activeFlare && (
        <p className="muted" style={{ fontSize: 12, padding: '0 6px', textAlign: 'center' }}>
          <em>Tipp:</em> "Schub starten" markiert einen akuten Schmerz-Schub mit Start­zeit
          und Auslöser — du beendest ihn später mit der erreichten Spitze.
        </p>
      )}

      {meds.length > 0 && (
        <div className="card">
          <div className="hero-card__head" style={{ marginBottom: 8 }}>
            <span className="hero-card__eyebrow"><Icon name="pill" size={14} /> Medikamente heute</span>
          </div>
          <ul className="entries">
            {meds.map((m) => (
              <li key={m.id}>
                <button className="entry entry--button" onClick={() => openMedication(m)}>
                  <span className="entry__time">
                    {new Date(m.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <div className="entry__title">{m.medicationName}</div>
                    <div className="entry__meta">{m.dosage} · Wirkung: {m.perceivedEffect}</div>
                  </div>
                  <Icon name="arrow" size={14} className="entry__chev" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sheet === 'checkin' && <CheckInSheet defaultSlot={defaultSlot} onClose={() => setSheet(null)} />}
      {sheet === 'checkin-edit' && editing?.kind === 'checkIn' && (
        <CheckInSheet existing={editing.entry} onClose={() => { setSheet(null); setEditing(null) }} />
      )}
      {sheet === 'med' && <MedicationSheet onClose={() => setSheet(null)} />}
      {sheet === 'med-edit' && editing?.kind === 'med' && (
        <MedicationSheet existing={editing.entry} onClose={() => { setSheet(null); setEditing(null) }} />
      )}
      {sheet === 'flare' && <FlareSheet onClose={() => setSheet(null)} />}
      {sheet === 'end-flare' && activeFlare && (
        <EndFlareSheet
          flare={activeFlare}
          suggestedPeak={Math.max(activeFlare.peakIntensity || 5, ...today.map((c) => c.painLevel), 0)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'day-detail' && (
        <DayDetail
          day={{
            key,
            date: new Date(),
            checkIns: today,
            meds,
            flares: data.flares.filter((f) => dayKeyOf(f.startTime) === key),
            avg,
            max,
          }}
          data={data}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
}

function FlareCard({ flare, onEnd, onAdjust }) {
  const start = new Date(flare.startTime)
  const now = new Date()
  const minutes = Math.max(1, Math.round((now - start) / 60000))
  const durationLabel = minutes >= 60
    ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
    : `${minutes} min`
  const intensity = flare.peakIntensity || 5
  return (
    <div className="card flare-card">
      <div className="flare-card__head">
        <div className="flare-card__icon">
          <Icon name="bolt" size={18} />
        </div>
        <div>
          <div className="flare-card__title">Schub läuft</div>
          <div className="flare-card__sub">
            seit {start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {durationLabel}
          </div>
        </div>
        <button className="btn btn-soft flare-card__end" onClick={onEnd}>
          <Icon name="check" size={14} /> beenden
        </button>
      </div>
      <div className="flare-card__intensity">
        <div className="flare-card__intensity-label">aktuelle Intensität</div>
        <div className="flare-card__stepper">
          <button onClick={() => onAdjust(-1)} aria-label="weniger" disabled={intensity <= 1}>−</button>
          <span className="flare-card__intensity-num" style={{ color: painColor(intensity) }}>{intensity}</span>
          <button onClick={() => onAdjust(+1)} aria-label="mehr" disabled={intensity >= 10}>+</button>
        </div>
      </div>
      {(flare.trigger || flare.region) && (
        <div className="flare-card__tags">
          {flare.trigger && <span className="pill">Auslöser: {flare.trigger}</span>}
          {flare.region && <span className="pill">{flare.region}</span>}
        </div>
      )}
    </div>
  )
}

function NamePrompt() {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function save() {
    if (value.trim()) actions.setName(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button className="name-prompt" onClick={() => setEditing(true)}>
        Wie soll ich dich nennen? <Icon name="arrow" size={12} />
      </button>
    )
  }

  return (
    <form
      className="name-prompt name-prompt--editing"
      onSubmit={(e) => { e.preventDefault(); save() }}
    >
      <input
        ref={inputRef}
        className="input name-prompt__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="dein Vorname"
        onBlur={save}
        maxLength={32}
      />
    </form>
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
