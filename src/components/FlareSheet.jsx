import { useRef, useState } from 'react'
import { actions } from '../lib/store'
import { painColor, painLabel } from '../lib/pain'
import { useDragDownToDismiss } from '../lib/useSwipe'
import Icon from './Icon'

const TRIGGERS = [
  'Wetter', 'Stress', 'Schlaf', 'Bildschirm', 'Hunger', 'Hormonell', 'Lärm', 'unklar',
]
const REGIONS = [
  'einseitig links', 'einseitig rechts', 'beidseitig', 'Stirn', 'Nacken', 'hinter dem Auge',
]

export default function FlareSheet({ onClose }) {
  const [intensity, setIntensity] = useState(5)
  const [trigger, setTrigger] = useState(null)
  const [region, setRegion] = useState(null)
  const sheetRef = useRef(null)

  useDragDownToDismiss(sheetRef, {
    onDrag: (dy) => { if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)` },
    onRelease: () => {
      const el = sheetRef.current
      if (!el) return
      const m = new DOMMatrix(getComputedStyle(el).transform)
      el.style.transform = ''
      if (m.m42 > 120) onClose()
    },
  })

  function submit() {
    actions.addFlare({
      peakIntensity: intensity,
      quality: 'akut',
      trigger: trigger || undefined,
      region: region || undefined,
    })
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" />
        <div className="sheet__head">
          <div>
            <div className="sheet__eyebrow">
              <Icon name="bolt" size={12} /> Schub beginnt
            </div>
            <h2 className="sheet__title">Wie heftig ist <em>es gerade?</em></h2>
          </div>
          <button className="sheet__close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="sheet__body">
          <p className="muted" style={{ fontSize: 13 }}>
            Du markierst, dass <em>jetzt</em> ein akuter Schmerz-Schub läuft. Calira merkt sich Start
            und Verlauf — und du kannst die Intensität später noch anpassen.
          </p>

          <div className="dial">
            <div className="dial__num" style={{ color: painColor(intensity) }}>{intensity}</div>
            <div className="dial__caption">{painLabel(intensity)}</div>
          </div>
          <input
            type="range" min={1} max={10} value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="slider"
            style={{ '--fill': `${intensity * 10}%` }}
            aria-label="Intensität"
          />
          <div className="slider-scale"><span>1 — gerade beginnend</span><span>10 — am stärksten</span></div>

          <div className="field-label">Vermuteter Auslöser <span style={{ color: 'var(--ink-faint)', fontWeight: 450 }}>· optional</span></div>
          <div className="chips">
            {TRIGGERS.map((t) => (
              <button key={t} className={`chip ${trigger === t ? 'is-active' : ''}`}
                onClick={() => setTrigger(trigger === t ? null : t)}>{t}</button>
            ))}
          </div>

          <div className="field-label">Wo? <span style={{ color: 'var(--ink-faint)', fontWeight: 450 }}>· optional</span></div>
          <div className="chips">
            {REGIONS.map((r) => (
              <button key={r} className={`chip ${region === r ? 'is-active' : ''}`}
                onClick={() => setRegion(region === r ? null : r)}>{r}</button>
            ))}
          </div>
        </div>

        <div className="sheet__actions">
          <button className="btn btn-ghost" onClick={onClose}>abbrechen</button>
          <button className="btn btn-accent" onClick={submit}>
            <Icon name="bolt" size={14} /> Schub starten
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Sheet shown when ending a flare — confirms the peak and adds optional note.
 */
export function EndFlareSheet({ flare, suggestedPeak, onClose }) {
  const [peak, setPeak] = useState(suggestedPeak)
  const sheetRef = useRef(null)

  useDragDownToDismiss(sheetRef, {
    onDrag: (dy) => { if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)` },
    onRelease: () => {
      const el = sheetRef.current
      if (!el) return
      const m = new DOMMatrix(getComputedStyle(el).transform)
      el.style.transform = ''
      if (m.m42 > 120) onClose()
    },
  })

  const start = new Date(flare.startTime)
  const now = new Date()
  const durationMin = Math.max(1, Math.round((now - start) / 60000))
  const durationLabel = durationMin >= 60
    ? `${Math.floor(durationMin / 60)} h ${durationMin % 60} min`
    : `${durationMin} min`

  function submit() {
    actions.endFlare(flare.id, peak)
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" />
        <div className="sheet__head">
          <div>
            <div className="sheet__eyebrow"><Icon name="check" size={12} /> Schub beenden</div>
            <h2 className="sheet__title">Geschafft — <em>vorbei.</em></h2>
          </div>
          <button className="sheet__close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="sheet__body">
          <div className="hero-card__stats" style={{ borderTop: 'none', marginTop: 0, paddingTop: 0 }}>
            <div className="kv"><div className="kv__label">Dauer</div><div className="kv__value">{durationLabel}</div></div>
            <div className="kv"><div className="kv__label">Begonnen</div><div className="kv__value">{start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div></div>
            {flare.trigger && <div className="kv"><div className="kv__label">Auslöser</div><div className="kv__value" style={{ fontSize: 14 }}>{flare.trigger}</div></div>}
          </div>

          <div className="field-label">Wie stark war es am Höhepunkt?</div>
          <div className="dial">
            <div className="dial__num" style={{ color: painColor(peak), fontSize: 100 }}>{peak}</div>
            <div className="dial__caption">{painLabel(peak)}</div>
          </div>
          <input
            type="range" min={1} max={10} value={peak}
            onChange={(e) => setPeak(Number(e.target.value))}
            className="slider"
            style={{ '--fill': `${peak * 10}%` }}
            aria-label="Spitzenintensität"
          />
        </div>

        <div className="sheet__actions">
          <button className="btn btn-ghost" onClick={onClose}>abbrechen</button>
          <button className="btn btn-accent" onClick={submit}>
            <Icon name="check" size={14} /> Schub beenden
          </button>
        </div>
      </div>
    </div>
  )
}
