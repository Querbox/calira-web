import { useState, useRef, useEffect, useMemo } from 'react'
import { TIME_SLOTS, painColor, painLabel, painTypeLabel, slotForHour } from '../lib/pain'
import { todayKey, dayKeyOf } from '../lib/storage'
import { useData, actions } from '../lib/store'
import DailyTimeline from '../components/DailyTimeline'
import CheckInSheet from '../components/CheckInSheet'
import MedicationSheet from '../components/MedicationSheet'
import FlareSheet, { EndFlareSheet } from '../components/FlareSheet'
import Icon from '../components/Icon'
import { monthlyMedUsage } from '../lib/insights'
import { fetchDayPressure } from '../lib/weather'
import { computeHourlyRisk, combineWithWeather, summarizeCurve, riskLabel, riskColor } from '../lib/prediction'
import { DayDetail } from './History'

const SLOT_META = {
  morning: { icon: 'sun',   tint: 'morning' },
  midday:  { icon: 'cloud', tint: 'midday' },
  evening: { icon: 'moon',  tint: 'evening' },
}

const TIP_DISMISS_KEY = 'calira:home-tip:dismissed'

export default function Home() {
  const data = useData()
  const [sheet, setSheet] = useState(null)
  const [defaultSlot, setDefaultSlot] = useState(null)
  const [editing, setEditing] = useState(null)
  const [dayPressure, setDayPressure] = useState(null)
  const [tipDismissed, setTipDismissed] = useState(() => {
    try { return Number(localStorage.getItem(TIP_DISMISS_KEY) || 0) >= 2 } catch { return false }
  })

  const key = todayKey()

  useEffect(() => {
    let cancelled = false
    fetchDayPressure(key).then((p) => { if (!cancelled) setDayPressure(p) })
    return () => { cancelled = true }
  }, [key])

  const today = data.checkIns.filter((c) => dayKeyOf(c.timestamp) === key)
  const meds = data.medications.filter((m) => dayKeyOf(m.timestamp) === key)
  const dayFlares = data.flares.filter((f) => dayKeyOf(f.startTime) === key)
  const activeFlare = data.flares.find((f) => !f.endTime)

  const avg = today.length > 0
    ? Math.round((today.reduce((s, c) => s + c.painLevel, 0) / today.length) * 10) / 10
    : null
  const max = today.length ? Math.max(...today.map((c) => c.painLevel)) : null
  const allDone = today.length >= 3

  const now = new Date()
  const greeting = getGreeting(now.getHours())
  const currentSlotId = slotForHour(now.getHours())

  // ── Forecast (hero) ──
  const forecast = useMemo(() => {
    const base = computeHourlyRisk(data.checkIns, key, now)
    const pressureSeries = dayPressure?.pressure || null
    let combined = null
    let weatherOnly = false
    if (Array.isArray(base)) {
      combined = combineWithWeather(base, pressureSeries) || base
    } else if (pressureSeries) {
      combined = combineWithWeather(null, pressureSeries)
      weatherOnly = true
    }
    if (!Array.isArray(combined)) {
      return { state: 'insufficient', insufficient: base?.insufficient ? base : null }
    }
    const s = summarizeCurve(combined)
    return { state: 'ok', summary: s, weatherOnly, hasPressure: !!pressureSeries }
  }, [data.checkIns, key, dayPressure])

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

  function dismissTip() {
    try {
      const n = Number(localStorage.getItem(TIP_DISMISS_KEY) || 0) + 1
      localStorage.setItem(TIP_DISMISS_KEY, String(n))
    } catch {}
    setTipDismissed(true)
  }

  const medUsage = monthlyMedUsage(data.medications)
  const showSchubTip = !activeFlare && !tipDismissed && (max == null || max <= 5)
  // Schub-Button erscheint kontextuell: nur wenn heute schon Schmerz > 4 — bzw. immer in einem dezenten Secondary-Look
  const showSchubButton = !activeFlare

  return (
    <>
      {/* ─── Kompakter Header (nur Begrüßung) ─── */}
      <header className="page-header page-header--compact">
        <div className="page-header__line">
          <span className="page-header__greet">
            {greeting}{data.name ? <>, <em>{data.name}</em></> : ''}.
          </span>
        </div>
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
              {medUsage.level === 'high' ? 'Medikamenten-Übergebrauch' : 'Erhöhter Medikamenten-Bedarf'}
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

      {/* ─── HERO: Forecast (Kopfschmerz-Wahrscheinlichkeit) ─── */}
      <ForecastHero forecast={forecast} />

      {/* ─── Drei Momente ─── */}
      <div className="section__head section__head--tight">
        <div className="section__title">Drei Momente</div>
        <div className="section__meta">{today.length}/3 erfasst</div>
      </div>
      <div className="slots">
        {TIME_SLOTS.map((slot) => {
          const entry = today.find((c) => c.timeSlot === slot.id)
          const meta = SLOT_META[slot.id]
          const isCurrent = !entry && slot.id === currentSlotId
          // ist dieser slot zeitlich schon vorbei?
          const slotPassed = !entry && !isCurrent && hasPassed(slot, now)
          const klass = [
            'slot-tile',
            `card--tint-${meta.tint}`,
            entry ? 'slot-tile--done' : 'slot-tile--open',
            isCurrent ? 'slot-tile--now' : '',
            slotPassed ? 'slot-tile--past' : '',
          ].filter(Boolean).join(' ')
          return (
            <button key={slot.id} className={klass} onClick={() => openCheckIn(slot.id)}>
              <div className="slot-tile__top">
                <div className="slot-tile__icon-wrap">
                  <Icon name={meta.icon} size={16} />
                </div>
                {entry && (
                  <div className="slot-tile__check" aria-label="erfasst">
                    <Icon name="check" size={12} />
                  </div>
                )}
                {!entry && isCurrent && <div className="slot-tile__pulse" aria-hidden />}
              </div>
              <div className="slot-tile__label">{slot.label}</div>
              {entry ? (
                <div className="slot-tile__entry">
                  <span className="slot-tile__num" style={{ color: painColor(entry.painLevel) }}>{entry.painLevel}</span>
                  <span className="slot-tile__num-suffix">/10</span>
                  <div className="slot-tile__type">{painTypeLabel(entry.dominantTypes || entry.dominantType)}</div>
                </div>
              ) : (
                <div className="slot-tile__cta">
                  {isCurrent ? 'jetzt eintragen →' : slotPassed ? 'nachtragen' : 'später'}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── Tages-Status: 3/3 Hacken ODER kompakter Stats-Strip ─── */}
      {allDone ? (
        <DoneBanner avg={avg} max={max} medCount={meds.length} />
      ) : (
        <div className="day-strip">
          <div className="day-strip__kv">
            <div className="day-strip__label">Ø Schmerz</div>
            <div
              className="day-strip__value"
              style={avg != null ? { color: painColor(Math.round(avg)) } : undefined}
            >{avg != null ? avg.toFixed(1) : '—'}</div>
          </div>
          <div className="day-strip__kv">
            <div className="day-strip__label">Max</div>
            <div
              className="day-strip__value"
              style={max != null ? { color: painColor(max) } : undefined}
            >{max ?? '—'}</div>
          </div>
          <div className="day-strip__kv">
            <div className="day-strip__label">Medis</div>
            <div className="day-strip__value">{meds.length}</div>
          </div>
          <div className="day-strip__kv">
            <div className="day-strip__label">Schübe</div>
            <div className="day-strip__value">{dayFlares.length}</div>
          </div>
        </div>
      )}

      {/* ─── Timeline (kompakter, ganze Karte tappable, kein Outlook drin) ─── */}
      <button
        type="button"
        className="card card--clickable timeline-card"
        onClick={() => setSheet('day-detail')}
      >
        <div className="timeline-card__head">
          <span className="timeline-card__title">
            <Icon name="clock" size={14} /> Verlauf des Tages
          </span>
          <span className="timeline-card__cta">Details</span>
        </div>
        <DailyTimeline
          checkIns={data.checkIns}
          medications={data.medications}
          flares={data.flares}
          dateKey={key}
          dayPressure={dayPressure}
          compact
        />
      </button>

      {/* ─── Primary: Medikament · Secondary: Schub starten ─── */}
      <div className="home-actions">
        <button className="btn btn-accent btn-block" onClick={() => setSheet('med')}>
          <Icon name="pill" size={16} /> Medikament eintragen
        </button>
        {showSchubButton && (
          <button className="btn btn-text" onClick={() => setSheet('flare')}>
            <Icon name="bolt" size={14} /> akuten Schub starten
          </button>
        )}
      </div>

      {showSchubTip && (
        <div className="home-tip">
          <div className="home-tip__body">
            <em>Tipp:</em>{' '}„Schub starten" markiert einen akuten Schmerz-Schub mit Start­zeit und Auslöser — du beendest ihn später mit der erreichten Spitze.
          </div>
          <button className="home-tip__dismiss" onClick={dismissTip} aria-label="Hinweis ausblenden">×</button>
        </div>
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
          day={{ key, date: new Date(), checkIns: today, meds, flares: dayFlares, avg, max }}
          data={data}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
}

/* ─────────── Forecast Hero ─────────── */
function ForecastHero({ forecast }) {
  if (forecast.state === 'insufficient') {
    const ins = forecast.insufficient
    return (
      <div className="forecast-hero forecast-hero--idle">
        <div className="forecast-hero__icon"><Icon name="spark" size={18} /></div>
        <div className="forecast-hero__body">
          <div className="forecast-hero__eyebrow">Kopfschmerz-Wahrscheinlichkeit</div>
          <div className="forecast-hero__hint">
            {ins
              ? <>Prognose erscheint nach <em>{ins.needed}</em> Tracking-Tagen · noch <em>{ins.needed - ins.daysTracked}</em>.</>
              : <>Bald verfügbar — sammle ein paar Check-ins und aktiviere bei Bedarf das Wetter.</>}
          </div>
        </div>
      </div>
    )
  }
  const { summary, weatherOnly, hasPressure } = forecast
  const peakClock = `${String(summary.peakHour).padStart(2, '0')}:00`
  const peakRisk = Math.round(summary.peakRisk)
  const color = riskColor(peakRisk)
  return (
    <div className="forecast-hero" style={{ '--risk': color }}>
      <div className="forecast-hero__top">
        <div className="forecast-hero__eyebrow">
          <Icon name="spark" size={13} /> Kopfschmerz-Wahrscheinlichkeit
        </div>
        <div className="forecast-hero__chip" style={{ color }}>{riskLabel(peakRisk)}</div>
      </div>
      <div className="forecast-hero__main">
        <span className="forecast-hero__num" style={{ color }}>{peakRisk}</span>
        <span className="forecast-hero__pct" style={{ color }}>%</span>
        <span className="forecast-hero__peak">
          Spitze gegen <em>{peakClock}</em>
        </span>
      </div>
      <div className="forecast-hero__sub">
        {weatherOnly
          ? 'Aus Luftdruck geschätzt — verfeinert sich mit deinen Check-ins.'
          : hasPressure
          ? 'Aus deinen Check-ins + Luftdruck der nächsten Stunden.'
          : 'Aus deinen Check-ins der letzten Tage.'}
      </div>
    </div>
  )
}

/* ─────────── 3/3 Done ─────────── */
function DoneBanner({ avg, max, medCount }) {
  return (
    <div className="done-banner">
      <div className="done-banner__check" aria-hidden>
        <Icon name="check" size={22} />
      </div>
      <div className="done-banner__body">
        <div className="done-banner__title">Heute komplett erfasst.</div>
        <div className="done-banner__meta">
          Ø {avg?.toFixed(1) ?? '—'} · Max {max ?? '—'} · {medCount} Medis
        </div>
      </div>
    </div>
  )
}

/* ─────────── Active Flare Card (unverändert) ─────────── */
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

/* ─────────── Name Prompt (unverändert) ─────────── */
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
    <form className="name-prompt name-prompt--editing" onSubmit={(e) => { e.preventDefault(); save() }}>
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

// Ist der Slot schon vorbei (heute, aktueller Zeitpunkt liegt nach slot.to)?
function hasPassed(slot, now) {
  const h = now.getHours()
  // Slot "evening" wraps midnight — wir behandeln 18..5 als "läuft noch"
  if (slot.from < slot.to) return h >= slot.to
  return false
}
