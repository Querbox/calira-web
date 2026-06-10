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

// Common headache/migraine accompanying symptoms (loosely ICHD-aligned)
export const SYMPTOMS = [
  { id: 'nausea',         label: 'Übelkeit' },
  { id: 'vomiting',       label: 'Erbrechen' },
  { id: 'photophobia',    label: 'Lichtempfindlichkeit' },
  { id: 'phonophobia',    label: 'Geräuschempfindlichkeit' },
  { id: 'osmophobia',     label: 'Geruchsempfindlichkeit' },
  { id: 'dizziness',      label: 'Schwindel' },
  { id: 'aura',           label: 'Sehstörungen / Aura' },
  { id: 'concentration',  label: 'Konzentrationsschwäche' },
  { id: 'fatigue',        label: 'Müdigkeit' },
  { id: 'irritability',   label: 'Reizbarkeit' },
  { id: 'tension',        label: 'Verspannungen' },
  { id: 'tingling',       label: 'Taubheit / Kribbeln' },
  { id: 'stomach',        label: 'Bauchschmerzen' },
]

export function symptomLabel(id) {
  return SYMPTOMS.find((s) => s.id === id)?.label || id
}
export function symptomsLabel(ids) {
  if (!Array.isArray(ids) || !ids.length) return ''
  return ids.map(symptomLabel).join(', ')
}

export const TIME_SLOTS = [
  { id: 'morning', label: 'Morgens',  from: 5,  to: 12, desc: '5 – 12 Uhr' },
  { id: 'midday',  label: 'Mittags',  from: 12, to: 18, desc: '12 – 18 Uhr' },
  { id: 'evening', label: 'Abends',   from: 18, to: 5,  desc: '18 – 5 Uhr' },
]

export function slotForHour(h) {
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'midday'
  return 'evening'
}

export function slotForTimestamp(ts) {
  return slotForHour(new Date(ts).getHours())
}

export function slotMeta(id) {
  return TIME_SLOTS.find((s) => s.id === id)
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
  if (Array.isArray(id)) return id.map((i) => PAIN_TYPES.find((t) => t.id === i)?.label || i).join(', ') || '—'
  return PAIN_TYPES.find((t) => t.id === id)?.label || id
}
