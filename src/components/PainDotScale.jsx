import { painColor } from '../lib/pain'

const TOTAL = 41 // 0..10 in 0.25 steps

export default function PainDotScale({ value, min = 0, max = 10, showLabels = true, size = 'md' }) {
  const v = value == null ? null : Math.max(min, Math.min(max, value))
  const activeIdx = v == null ? -1 : Math.round(((v - min) / (max - min)) * (TOTAL - 1))

  return (
    <div className={`dotscale dotscale--${size}`}>
      <div className="dotscale__row">
        {Array.from({ length: TOTAL }, (_, i) => {
          const isFilled = i <= activeIdx
          const isActive = i === activeIdx
          const ratio = i / (TOTAL - 1)
          const ratioVal = min + ratio * (max - min)
          return (
            <span
              key={i}
              className={`dotscale__dot ${isFilled ? 'is-filled' : ''} ${isActive ? 'is-active' : ''}`}
              style={isFilled ? { background: painColor(ratioVal) } : undefined}
            />
          )
        })}
      </div>
      {showLabels && (
        <div className="dotscale__labels">
          <span>{min}</span>
          <span>{Math.round((min + max) / 2)}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}
