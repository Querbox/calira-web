/**
 * Fetch current weather from Open-Meteo (free, no API key).
 * Returns { temperature, pressure, weatherCode, humidity, windSpeed, timestamp }
 * or null on failure. Uses the Geolocation API for lat/lon.
 */

const CACHE_KEY = 'calira:weather:cache'
const CACHE_TTL = 20 * 60 * 1000 // 20 min

export async function fetchWeather() {
  // Check cache first
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached
  } catch {}

  const pos = await getPosition().catch(() => null)
  if (!pos) return null

  try {
    const { latitude, longitude } = pos.coords
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,pressure_msl,weather_code,wind_speed_10m&hourly=pressure_msl&timezone=auto&forecast_days=1&past_days=1`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const c = data.current

    // Compute pressure change over last 3h from hourly data
    const hourly = data.hourly
    let pressureChange3h = null
    if (hourly?.pressure_msl && hourly?.time) {
      const now = new Date()
      const nowIdx = findClosestIdx(hourly.time, now)
      const ago3h = new Date(now.getTime() - 3 * 3600 * 1000)
      const ago3hIdx = findClosestIdx(hourly.time, ago3h)
      if (nowIdx >= 0 && ago3hIdx >= 0) {
        pressureChange3h = Math.round((hourly.pressure_msl[nowIdx] - hourly.pressure_msl[ago3hIdx]) * 10) / 10
      }
    }

    const result = {
      temperature: c.temperature_2m,
      pressure: c.pressure_msl,
      pressureChange3h,
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      weatherCode: c.weather_code,
      weatherLabel: weatherCodeToLabel(c.weather_code),
      timestamp: Date.now(),
      lat: latitude,
      lon: longitude,
    }
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)) } catch {}
    return result
  } catch {
    return null
  }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject('no geolocation')
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    })
  })
}

function findClosestIdx(times, target) {
  const t = target.getTime()
  let best = -1, bestDiff = Infinity
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - t)
    if (diff < bestDiff) { bestDiff = diff; best = i }
  }
  return best
}

function weatherCodeToLabel(code) {
  if (code === 0) return 'Klar'
  if (code <= 3) return 'Bewölkt'
  if (code <= 49) return 'Nebel'
  if (code <= 59) return 'Nieselregen'
  if (code <= 69) return 'Regen'
  if (code <= 79) return 'Schnee'
  if (code <= 82) return 'Regenschauer'
  if (code <= 86) return 'Schneeschauer'
  if (code >= 95) return 'Gewitter'
  return 'Unbekannt'
}

/**
 * Classify pressure change as a migraine-relevant signal.
 */
export function pressureSignal(change3h) {
  if (change3h == null) return null
  const abs = Math.abs(change3h)
  if (abs < 2) return { level: 'stable', label: 'stabil', icon: '→' }
  if (change3h > 0) {
    return abs >= 5
      ? { level: 'rise-strong', label: 'starker Anstieg', icon: '↑↑' }
      : { level: 'rise', label: 'Anstieg', icon: '↑' }
  }
  return abs >= 5
    ? { level: 'drop-strong', label: 'starker Abfall', icon: '↓↓' }
    : { level: 'drop', label: 'Abfall', icon: '↓' }
}
