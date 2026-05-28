/**
 * Counts unique trigger occurrences across recent flares.
 * Returns an array sorted by frequency: [{ trigger, count }]
 */
export function topTriggers(flares, daysBack = 30) {
  const cutoff = Date.now() - daysBack * 86400000
  const counts = new Map()
  for (const f of flares) {
    if (!f.trigger) continue
    if (f.startTime < cutoff) continue
    counts.set(f.trigger, (counts.get(f.trigger) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Count acute medications taken in the calendar month containing `ref`.
 * Returns { count, limit, level }.
 *
 * Background: Medication-overuse headache (MOH) risk rises sharply when
 * acute analgesics are taken on >10 days/month (triptans, opioids, combos)
 * or >15 days/month (simple analgesics). We surface a soft amber at >=10,
 * red at >=15.
 */
export function monthlyMedUsage(medications, ref = new Date()) {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const inMonth = medications.filter((m) => {
    if (m.isAcute === false) return false
    const d = new Date(m.timestamp)
    return d.getFullYear() === year && d.getMonth() === month
  })
  // Count distinct days that have at least one acute medication
  const days = new Set(inMonth.map((m) => {
    const d = new Date(m.timestamp)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }))
  const count = days.size
  let level = 'ok'
  if (count >= 15) level = 'high'
  else if (count >= 10) level = 'warn'
  return { count, limit: 10, level }
}

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
export function monthLabel(d = new Date()) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
