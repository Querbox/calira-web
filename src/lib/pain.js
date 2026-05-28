export const PAIN_TYPES = [
  { id: 'throbbing', label: 'Pulsierend' },
  { id: 'pressing', label: 'Drückend' },
  { id: 'sharp', label: 'Stechend' },
  { id: 'dull', label: 'Dumpf' },
  { id: 'unclear', label: 'Unklar' },
]

export const FUNCTIONAL_LEVELS = [
  { id: 'unaffected', label: 'Nicht eingeschränkt' },
  { id: 'light', label: 'Leicht eingeschränkt' },
  { id: 'moderate', label: 'Deutlich eingeschränkt' },
  { id: 'severe', label: 'Stark eingeschränkt' },
]

export const TIME_SLOTS = [
  { id: 'morning', label: 'Morgens', hourRange: [5, 11] },
  { id: 'midday', label: 'Mittags', hourRange: [11, 17] },
  { id: 'evening', label: 'Abends', hourRange: [17, 24] },
]

export function slotForHour(h) {
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'midday'
  return 'evening'
}

export function painColor(level) {
  if (level == null) return 'var(--text-muted)'
  if (level <= 2) return 'var(--pain-0)'
  if (level <= 4) return 'var(--pain-3)'
  if (level <= 5) return 'var(--pain-5)'
  if (level <= 7) return 'var(--pain-7)'
  if (level <= 9) return 'var(--pain-9)'
  return 'var(--pain-10)'
}

export function painLabel(level) {
  if (level == null) return '—'
  if (level === 0) return 'Schmerzfrei'
  if (level <= 3) return 'Leicht'
  if (level <= 5) return 'Moderat'
  if (level <= 7) return 'Stark'
  return 'Sehr stark'
}
