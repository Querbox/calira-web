import { painColor, painLabel } from '../lib/pain'

export default function PainRing({ level, size = 72, stroke = 7 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const filled = level == null ? 0 : level / 10
  const color = painColor(level)
  return (
    <div className="pain-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - filled)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.4s, stroke 0.4s' }}
        />
      </svg>
      <div className="pain-ring__inner">
        <div className="pain-ring__value" style={{ color }}>
          {level == null ? '—' : level}
        </div>
        <div className="pain-ring__label">{painLabel(level)}</div>
      </div>
    </div>
  )
}
