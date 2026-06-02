/**
 * Counts unique trigger occurrences across recent flares AND check-ins.
 * Returns an array sorted by frequency: [{ trigger, count }]
 */
export function topTriggers(flares, daysBack = 30, checkIns = []) {
  const cutoff = Date.now() - daysBack * 86400000
  const counts = new Map()
  for (const f of flares) {
    if (!f.trigger) continue
    if (f.startTime < cutoff) continue
    counts.set(f.trigger, (counts.get(f.trigger) || 0) + 1)
  }
  for (const c of checkIns) {
    if (!c.triggers || !c.triggers.length) continue
    if (c.timestamp < cutoff) continue
    for (const t of c.triggers) {
      counts.set(t, (counts.get(t) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([trigger, count]) => ({ trigger, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Analyze weather correlation: for check-ins with weather data,
 * compute average pain for pressure drops vs stable vs rise.
 */
export function weatherCorrelation(checkIns) {
  const buckets = { drop: [], stable: [], rise: [] }
  for (const c of checkIns) {
    if (!c.weather?.pressureChange3h) continue
    const change = c.weather.pressureChange3h
    const key = change <= -2 ? 'drop' : change >= 2 ? 'rise' : 'stable'
    buckets[key].push(c.painLevel)
  }
  const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null
  return {
    drop: { avg: avg(buckets.drop), count: buckets.drop.length },
    stable: { avg: avg(buckets.stable), count: buckets.stable.length },
    rise: { avg: avg(buckets.rise), count: buckets.rise.length },
    total: buckets.drop.length + buckets.stable.length + buckets.rise.length,
  }
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
