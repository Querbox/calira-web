import { useState } from 'react'
import Icon from './Icon'

const PRESETS = [
  { label: 'Jetzt',      offset: 0 },
  { label: 'Vor 30 min', offset: -30 * 60 * 1000 },
  { label: 'Vor 1 h',    offset: -60 * 60 * 1000 },
  { label: 'Vor 2 h',    offset: -2 * 60 * 60 * 1000 },
  { label: 'Vor 4 h',    offset: -4 * 60 * 60 * 1000 },
]

/**
 * `timestamp` is a millis number. `onChange` receives a new millis.
 * Default mode: chip presets. Tap "Genau…" to reveal a native time input.
 */
export default function TimePicker({ timestamp, onChange }) {
  const [custom, setCustom] = useState(false)
  const ref = new Date(timestamp)
  const now = Date.now()
  const matchedPreset = PRESETS.find((p) => {
    if (p.offset === 0) return Math.abs(now - timestamp) < 60 * 1000
    return Math.abs(now + p.offset - timestamp) < 5 * 60 * 1000
  })

  const timeStr = `${String(ref.getHours()).padStart(2, '0')}:${String(ref.getMinutes()).padStart(2, '0')}`

  function applyPreset(p) {
    onChange(p.offset === 0 ? Date.now() : Date.now() + p.offset)
    setCustom(false)
  }

  function applyCustom(value) {
    const [h, m] = value.split(':').map(Number)
    const d = new Date(timestamp)
    d.setHours(h, m, 0, 0)
    onChange(d.getTime())
  }

  return (
    <div className="time-picker">
      <div className="time-picker__head">
        <span className="field-label">Zeitpunkt</span>
        <span className="time-picker__current">
          <Icon name="clock" size={12} /> {timeStr}
        </span>
      </div>
      <div className="chips">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`chip ${matchedPreset === p && !custom ? 'is-active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
        <button
          className={`chip ${custom ? 'is-active' : ''}`}
          onClick={() => setCustom((c) => !c)}
        >
          Genau…
        </button>
      </div>
      {custom && (
        <input
          type="time"
          className="input"
          value={timeStr}
          onChange={(e) => applyCustom(e.target.value)}
          style={{ marginTop: 8 }}
        />
      )}
    </div>
  )
}
