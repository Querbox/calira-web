import { useEffect, useRef, useState } from 'react'
import { PAIN_TYPES, FUNCTIONAL_LEVELS, TIME_SLOTS, painColor, painLabel, slotForTimestamp, slotMeta } from '../lib/pain'
import { actions } from '../lib/store'
import { useSwipe, useDragDownToDismiss } from '../lib/useSwipe'
import { fetchWeather, pressureSignal } from '../lib/weather'
import Icon from './Icon'
import TimePicker from './TimePicker'

const SLOT_ICON = { morning: 'sun', midday: 'cloud', evening: 'moon' }

const TRIGGERS = [
  'Wetter', 'Stress', 'Schlafmangel', 'Bildschirm', 'Hunger',
  'Hormonell', 'Lärm', 'Alkohol', 'Nacken', 'Dehydriert',
]

export default function CheckInSheet({ defaultSlot, existing, onClose }) {
  const isEdit = !!existing
  const [step, setStep] = useState(0)
  const [timestamp, setTimestamp] = useState(existing?.timestamp ?? Date.now())
  const [painLevel, setPainLevel] = useState(existing?.painLevel ?? 3)
  // Multi-select: arrays
  const [types, setTypes] = useState(() => {
    if (existing?.dominantTypes) return existing.dominantTypes
    if (existing?.dominantType) return [existing.dominantType]
    return []
  })
  const [triggers, setTriggers] = useState(() => {
    if (existing?.triggers) return existing.triggers
    return []
  })
  const [functional, setFunctional] = useState(existing?.functionalLevel ?? 'unaffected')
  const [stress, setStress] = useState(existing?.stressLevel ?? 3)
  const [neck, setNeck] = useState(existing?.neckTension ?? 3)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [weather, setWeather] = useState(existing?.weather ?? null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  const autoSlot = slotForTimestamp(timestamp)
  const currentSlotMeta = slotMeta(autoSlot)

  const sheetRef = useRef(null)
  const stepCount = 5 // pain, type+triggers, function, weather+notes

  // Auto-fetch weather on mount (only for new check-ins)
  useEffect(() => {
    if (isEdit || weather) return
    let cancelled = false
    setWeatherLoading(true)
    fetchWeather().then((w) => {
      if (!cancelled && w) setWeather(w)
    }).finally(() => { if (!cancelled) setWeatherLoading(false) })
    return () => { cancelled = true }
  }, [])

  useDragDownToDismiss(sheetRef, {
    onDrag: (dy) => { if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)` },
    onRelease: (dy) => {
      const el = sheetRef.current
      if (!el) return
      el.style.transform = ''
      if (dy > 140) onClose()
    },
  })

  useSwipe(sheetRef, {
    onLeft: () => setStep((s) => Math.min(s + 1, stepCount - 1)),
    onRight: () => setStep((s) => Math.max(s - 1, 0)),
    threshold: 70,
  })

  function toggleMulti(arr, setArr, val) {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])
  }

  function submit() {
    const payload = {
      timeSlot: autoSlot,
      painLevel,
      dominantType: types[0] || 'unclear', // backward compat
      dominantTypes: types,
      triggers,
      stressLevel: stress,
      neckTension: neck,
      functionalLevel: functional,
      notes,
      timestamp,
      weather,
    }
    if (isEdit) actions.updateCheckIn(existing.id, payload)
    else actions.addCheckIn(payload)
    onClose()
  }

  function del() {
    if (!isEdit) return
    if (confirm('Diesen Check-in löschen?')) {
      actions.remove('checkIns', existing.id)
      onClose()
    }
  }

  const pressureSig = weather ? pressureSignal(weather.pressureChange3h) : null

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" data-sheet-handle />

        <div className="sheet__head" data-sheet-handle>
          <div>
            <div className="sheet__eyebrow">
              <Icon name={SLOT_ICON[autoSlot]} size={12} />
              {currentSlotMeta?.label} ({currentSlotMeta?.desc}) · {isEdit ? 'bearbeiten' : 'Check-in'}
            </div>
            <h2 className="sheet__title">
              {isEdit ? <>Eintrag <em>anpassen.</em></> : <>Wie geht es <em>gerade?</em></>}
            </h2>
          </div>
          <button className="sheet__close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="sheet__steps">
          {Array.from({ length: stepCount }, (_, i) => (
            <div key={i} className={`sheet__step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="sheet__body">
            <div className="dial">
              <div className="dial__num" style={{ color: painColor(painLevel) }}>{painLevel}</div>
              <div className="dial__caption">{painLabel(painLevel)}</div>
            </div>
            <input
              type="range" min={0} max={10}
              value={painLevel}
              onChange={(e) => setPainLevel(Number(e.target.value))}
              className="slider"
              style={{ '--fill': `${painLevel * 10}%` }}
              aria-label="Schmerzlevel"
            />
            <div className="slider-scale"><span>0 — keine</span><span>5</span><span>sehr stark — 10</span></div>
            <TimePicker timestamp={timestamp} onChange={setTimestamp} />
          </div>
        )}

        {step === 1 && (
          <div className="sheet__body">
            <div className="field-label">Charakter des Schmerzes <span style={{ color: 'var(--ink-faint)', fontWeight: 450 }}>· mehrere möglich</span></div>
            <div className="chips">
              {PAIN_TYPES.map((t) => (
                <button
                  key={t.id}
                  className={`chip ${types.includes(t.id) ? 'is-active' : ''}`}
                  onClick={() => toggleMulti(types, setTypes, t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sheet__body">
            <div className="field-label">Vermutete Auslöser <span style={{ color: 'var(--ink-faint)', fontWeight: 450 }}>· mehrere möglich, optional</span></div>
            <div className="chips">
              {TRIGGERS.map((t) => (
                <button
                  key={t}
                  className={`chip ${triggers.includes(t) ? 'is-active' : ''}`}
                  onClick={() => toggleMulti(triggers, setTriggers, t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="sheet__body">
            <div className="field-label">Funktionale Einschränkung</div>
            <div className="chips">
              {FUNCTIONAL_LEVELS.map((f) => (
                <button key={f.id} className={`chip ${functional === f.id ? 'is-active' : ''}`} onClick={() => setFunctional(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <SliderField label="Stresslevel" value={stress} onChange={setStress} />
            <SliderField label="Nackenverspannung" value={neck} onChange={setNeck} />
          </div>
        )}

        {step === 4 && (
          <div className="sheet__body">
            {weather && (
              <div className="weather-card">
                <div className="weather-card__head">
                  <Icon name="cloud" size={14} />
                  <span className="weather-card__title">Wetter beim Check-in</span>
                  {weatherLoading && <span className="weather-card__loading">lädt…</span>}
                </div>
                <div className="weather-card__row">
                  <div className="weather-card__stat">
                    <div className="weather-card__val">{weather.temperature}°</div>
                    <div className="weather-card__lbl">{weather.weatherLabel}</div>
                  </div>
                  <div className="weather-card__stat">
                    <div className="weather-card__val">{weather.pressure} hPa</div>
                    <div className="weather-card__lbl">Luftdruck</div>
                  </div>
                  {pressureSig && (
                    <div className={`weather-card__stat weather-card__stat--${pressureSig.level}`}>
                      <div className="weather-card__val">{pressureSig.icon} {weather.pressureChange3h > 0 ? '+' : ''}{weather.pressureChange3h}</div>
                      <div className="weather-card__lbl">{pressureSig.label} (3h)</div>
                    </div>
                  )}
                </div>
                {pressureSig && (pressureSig.level === 'drop-strong' || pressureSig.level === 'drop') && (
                  <div className="weather-card__warn">
                    <Icon name="bolt" size={12} /> Druckabfall — häufiger Migräne-Trigger
                  </div>
                )}
              </div>
            )}
            {!weather && !weatherLoading && (
              <div className="weather-card weather-card--empty">
                <Icon name="cloud" size={14} />
                <span>Kein Wetter verfügbar (Standort nicht freigegeben)</span>
              </div>
            )}

            <div className="field-label">Notiz (optional)</div>
            <textarea
              className="textarea"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Auslöser, besondere Umstände…"
            />
            {isEdit && (
              <button className="btn btn-danger btn-block" onClick={del} style={{ marginTop: 8 }}>
                <Icon name="trash" size={14} /> Diesen Eintrag löschen
              </button>
            )}
          </div>
        )}

        <div className="sheet__actions">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} /> zurück
            </button>
          ) : <span />}
          {step < stepCount - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              weiter <Icon name="arrow" size={14} />
            </button>
          ) : (
            <button className="btn btn-accent" onClick={submit}>
              <Icon name="check" size={14} /> {isEdit ? 'speichern' : 'eintragen'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SliderField({ label, value, onChange }) {
  return (
    <div className="slider-field">
      <div className="slider-field__head">
        <span className="slider-field__label">{label}</span>
        <span className="slider-field__value">{value} / 10</span>
      </div>
      <input
        type="range" min={0} max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
        style={{ '--fill': `${value * 10}%` }}
        aria-label={label}
      />
    </div>
  )
}
