export const PAIN_TYPES = [
  { id: 'throbbing', label: 'pulsierend' },
  { id: 'pressing', label: 'drückend' },
  { id: 'sharp', label: 'stechend' },
  { id: 'dull', label: 'dumpf' },
  { id: 'unclear', label: 'unklar' },
]

export const FUNCTIONAL_LEVELS = [
  { id: 'unaffected', label: 'nicht eingeschränkt' },
  { id: 'light', label: 'leicht eingeschränkt' },
  { id: 'moderate', label: 'deutlich eingeschränkt' },
  { id: 'severe', label: 'stark eingeschränkt' },
]

export const TIME_SLOTS = [
  { id: 'morning', label: 'Morgens' },
  { id: 'midday', label: 'Mittags' },
  { id: 'evening', label: 'Abends' },
]

export function slotForHour(h) {
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'midday'
  return 'evening'
}

export function painColor(level) {
  if (level == null) return 'var(--ink-fainter)'
  if (level <= 2) return 'var(--pain-1)'
  if (level <= 4) return 'var(--pain-3)'
  if (level <= 6) return 'var(--pain-5)'
  if (level <= 8) return 'var(--pain-7)'
  return 'var(--pain-10)'
}

export function painLabel(level) {
  if (level == null) return ''
  if (level === 0) return 'schmerzfrei'
  if (level <= 2) return 'kaum spürbar'
  if (level <= 4) return 'leicht'
  if (level <= 6) return 'moderat'
  if (level <= 8) return 'stark'
  return 'sehr stark'
}

export function painTypeLabel(id) {
  return PAIN_TYPES.find((t) => t.id === id)?.label || id
}
