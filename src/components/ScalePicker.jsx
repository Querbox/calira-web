import { painColor } from '../lib/pain'

/**
 * Tap-based 0–10 scale picker. Replaces native <input type="range"> sliders
 * so the horizontal swipe doesn't fight with the app's tab-pager gesture.
 *
 * Props:
 *  - value: current number
 *  - onChange(n): callback
 *  - min, max: defaults 0..10
 *  - colored: when true, the selected chip is tinted with painColor()
 *  - lowLabel / highLabel: optional labels under the scale
 */
export default function ScalePicker({
  value,
  onChange,
  min = 0,
  max = 10,
  colored = false,
  lowLabel,
  highLabel,
}) {
  const cells = []
  for (let i = min; i <= max; i++) cells.push(i)
  return (
    <div className="scale-picker">
      <div
        className="scale-picker__row"
        role="radiogroup"
        aria-label="Skala"
        style={{ '--cells': cells.length }}
      >
        {cells.map((n) => {
          const active = n === value
          const bg = active && colored ? painColor(n) : undefined
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={String(n)}
              className={`scale-cell ${active ? 'is-active' : ''} ${colored ? 'scale-cell--colored' : ''}`}
              style={bg ? { '--cell-bg': bg } : undefined}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          )
        })}
      </div>
      {(lowLabel || highLabel) && (
        <div className="scale-picker__labels">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  )
}
