import { dayKeyOf } from './storage'

const HOURS = 24
const HALF_LIFE_DAYS = 7
const WINDOW_HOURS = 1.5
const MIN_DAYS_REQUIRED = 5

/**
 * Build an array of 24 risk values (0–100) for the given dateKey,
 * estimated from the user's own check-in history.
 *
 * For each hour h:
 *  risk(h) = weighted mean of pain levels at hour h ± WINDOW_HOURS
 *            across the last 30 days, weight = exp(-daysAgo / HALF_LIFE)
 *  Same weekday gets a 1.4× boost.
 *  Result is normalized × 10 to get a 0–100 risk score and lightly smoothed.
 */
export function computeHourlyRisk(checkIns, dateKey, refDate = new Date()) {
  const target = parseKey(dateKey, refDate)
  const targetTime = target.getTime()
  const targetDow = target.getDay()

  // Use checkIns strictly before the target day
  const past = checkIns.filter((c) => c.timestamp < startOfDay(target).getTime())
  if (past.length === 0) return null

  const trackedDays = new Set(past.map((c) => dayKeyOf(c.timestamp)))
  if (trackedDays.size < MIN_DAYS_REQUIRED) {
    return { insufficient: true, daysTracked: trackedDays.size, needed: MIN_DAYS_REQUIRED }
  }

  const raw = new Array(HOURS).fill(0).map(() => ({ sum: 0, w: 0 }))

  for (const c of past) {
    const ts = new Date(c.timestamp)
    const daysAgo = (targetTime - startOfDay(ts).getTime()) / 86400000
    if (daysAgo > 30) continue
    const base = Math.exp(-daysAgo / HALF_LIFE_DAYS)
    const dowBoost = ts.getDay() === targetDow ? 1.4 : 1.0
    const w = base * dowBoost
    const hf = ts.getHours() + ts.getMinutes() / 60
    for (let h = 0; h < HOURS; h++) {
      const distance = hourDistance(hf, h)
      if (distance > WINDOW_HOURS) continue
      const proximity = 1 - distance / WINDOW_HOURS
      const weight = w * proximity
      raw[h].sum += c.painLevel * weight
      raw[h].w += weight
    }
  }

  const curve = raw.map((b) => (b.w > 0 ? Math.min(10, b.sum / b.w) * 10 : null))
  // smooth gaps (simple linear interpolation across nulls between known points)
  fillGaps(curve)
  // 3-point smoothing
  return smooth(curve)
}

function hourDistance(a, b) {
  const d = Math.abs(a - b)
  return Math.min(d, HOURS - d)
}

function fillGaps(arr) {
  let lastVal = null, lastIdx = -1
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] != null) {
      if (lastIdx >= 0 && i - lastIdx > 1) {
        const span = i - lastIdx
        for (let j = lastIdx + 1; j < i; j++) {
          arr[j] = lastVal + ((arr[i] - lastVal) * (j - lastIdx)) / span
        }
      }
      lastVal = arr[i]
      lastIdx = i
    }
  }
  // trailing/leading nulls: replicate nearest
  let firstIdx = arr.findIndex((v) => v != null)
  if (firstIdx > 0) for (let i = 0; i < firstIdx; i++) arr[i] = arr[firstIdx]
  let lastDefined = -1
  for (let i = arr.length - 1; i >= 0; i--) { if (arr[i] != null) { lastDefined = i; break } }
  if (lastDefined >= 0 && lastDefined < arr.length - 1) {
    for (let i = lastDefined + 1; i < arr.length; i++) arr[i] = arr[lastDefined]
  }
}

function smooth(arr) {
  const out = new Array(arr.length)
  for (let i = 0; i < arr.length; i++) {
    const a = arr[(i - 1 + arr.length) % arr.length]
    const b = arr[i]
    const c = arr[(i + 1) % arr.length]
    out[i] = (a + 2 * b + c) / 4
  }
  return out
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function parseKey(key, fallback) {
  if (!key) return startOfDay(fallback)
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function summarizeCurve(curve) {
  if (!curve || curve.insufficient) return null
  let peakHour = 0, peakRisk = curve[0]
  let troughHour = 0, troughRisk = curve[0]
  for (let i = 1; i < curve.length; i++) {
    if (curve[i] > peakRisk) { peakRisk = curve[i]; peakHour = i }
    if (curve[i] < troughRisk) { troughRisk = curve[i]; troughHour = i }
  }
  const avg = curve.reduce((s, v) => s + v, 0) / curve.length
  return { peakHour, peakRisk, troughHour, troughRisk, avg }
}

export function riskLabel(risk) {
  if (risk < 25) return 'ruhig'
  if (risk < 45) return 'leicht erhöht'
  if (risk < 65) return 'moderat'
  if (risk < 80) return 'erhöht'
  return 'hoch'
}

export function riskColor(risk) {
  if (risk < 25) return 'var(--pain-1)'
  if (risk < 45) return 'var(--pain-3)'
  if (risk < 65) return 'var(--pain-5)'
  if (risk < 80) return 'var(--pain-7)'
  return 'var(--pain-10)'
}
