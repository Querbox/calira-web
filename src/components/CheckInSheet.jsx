import { useState } from 'react'
import { PAIN_TYPES, FUNCTIONAL_LEVELS, TIME_SLOTS, painColor, painLabel, slotForHour } from '../lib/pain'
import { actions } from '../lib/store'

export default function CheckInSheet({ defaultSlot, onClose }) {
  const initialSlot = defaultSlot || slotForHour(new Date().getHours())
  const [step, setStep] = useState(0)
  const [painLevel, setPainLevel] = useState(3)
  const [type, setType] = useState('throbbing')
  const [functional, setFunctional] = useState('unaffected')
  const [stress, setStress] = useState(3)
  const [neck, setNeck] = useState(3)
  const [notes, setNotes] = useState('')

  function submit() {
    actions.addCheckIn({
      timeSlot: initialSlot,
      painLevel,
      dominantType: type,
      stressLevel: stress,
      neckTension: neck,
      functionalLevel: functional,
      notes,
    })
    onClose()
  }

  const stepCount = 4

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div>
            <div className="sheet__eyebrow">{TIME_SLOTS.find((s) => s.id === initialSlot)?.label} · Check-in</div>
            <h2 className="sheet__title">Wie geht es <em>gerade?</em></h2>
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
              type="range"
              min={0} max={10}
              value={painLevel}
              onChange={(e) => setPainLevel(Number(e.target.value))}
              className="slider"
              style={{ '--fill': `${painLevel * 10}%` }}
            />
            <div className="slider-scale">
              <span>0 — keine</span><span>5</span><span>sehr stark — 10</span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="sheet__body">
            <div className="field-label">Charakter des Schmerzes</div>
            <div className="chips">
              {PAIN_TYPES.map((t) => (
                <button key={t.id} className={`chip ${type === t.id ? 'is-active' : ''}`} onClick={() => setType(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
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

        {step === 3 && (
          <div className="sheet__body">
            <div className="field-label">Notiz (optional)</div>
            <textarea
              className="textarea"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Auslöser, Wetter, besondere Umstände…"
            />
          </div>
        )}

        <div className="sheet__actions">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>← zurück</button>
          ) : <span />}
          {step < stepCount - 1 ? (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>weiter →</button>
          ) : (
            <button className="btn btn-primary" onClick={submit}>eintragen ✓</button>
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
      />
    </div>
  )
}
