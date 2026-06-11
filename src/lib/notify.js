import { dayKeyOf, todayKey } from './storage'
import { computeHourlyRisk, combineWithWeather } from './prediction'
import { TIME_SLOTS } from './pain'

const PREFS_KEY = 'calira:notify:prefs'
const STATE_KEY = 'calira:notify:state'

export const DEFAULT_PREFS = {
  enabled: false,
  slotReminders: true,
  pressureAlert: true,
  riskAlert: true,
  flareNudge: true,
  quietStart: 22, // hour (0–23)
  quietEnd: 7,
  slotTimes: { morning: 8, midday: 13, evening: 20 }, // hour-of-day
}

export function getPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
    return { ...DEFAULT_PREFS, ...raw, slotTimes: { ...DEFAULT_PREFS.slotTimes, ...(raw.slotTimes || {}) } }
  } catch {
    return DEFAULT_PREFS
  }
}

export function setPrefs(patch) {
  const next = { ...getPrefs(), ...patch }
  localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  return next
}

function getState() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}') } catch { return {} }
}
function setState(patch) {
  const next = { ...getState(), ...patch }
  localStorage.setItem(STATE_KEY, JSON.stringify(next))
}

export function permissionStatus() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission // 'granted' | 'denied' | 'default'
}

export async function requestPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  try {
    const res = await Notification.requestPermission()
    return res
  } catch {
    return 'denied'
  }
}

async function showSystemNotification(title, body, tag, data = {}) {
  if (permissionStatus() !== 'granted') return false
  const opts = {
    body,
    tag,
    renotify: true,
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icon-192.png`,
    data: { url: import.meta.env.BASE_URL, ...data },
  }
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null
    if (reg?.showNotification) {
      await reg.showNotification(title, opts)
    } else {
      new Notification(title, opts)
    }
    return true
  } catch {
    return false
  }
}

function inQuietHours(now, prefs) {
  const h = now.getHours()
  const { quietStart, quietEnd } = prefs
  if (quietStart === quietEnd) return false
  if (quietStart < quietEnd) return h >= quietStart && h < quietEnd
  // wraps midnight
  return h >= quietStart || h < quietEnd
}

function pressureDeltaNext3h(pressureSeries, hour) {
  if (!Array.isArray(pressureSeries)) return null
  const target = Math.min(23, hour + 3)
  const a = pressureSeries[hour]
  const b = pressureSeries[target]
  if (a == null || b == null) return null
  return Math.round((b - a) * 10) / 10
}

/** True if `hour` lies inside the slot's natural window (handles midnight wrap). */
function hourInSlotWindow(slot, hour) {
  const def = TIME_SLOTS.find((s) => s.id === slot)
  if (!def) return false
  if (def.from < def.to) return hour >= def.from && hour < def.to
  // evening wraps: from=18, to=5 → 18..23 OR 0..4
  return hour >= def.from || hour < def.to
}

/**
 * Build the list of notification events that *would* fire right now.
 * Pure function — caller is responsible for dedup + actual dispatch.
 */
export function evaluateTriggers({ data, dayPressure, now = new Date() }) {
  const prefs = getPrefs()
  if (!prefs.enabled) return []
  if (inQuietHours(now, prefs)) return []
  if (permissionStatus() !== 'granted') return []

  const events = []
  const key = todayKey(now)
  const hour = now.getHours()

  // ── 1. Slot reminders ────────────────────────────────────────
  // Fire any time we're past the target hour AND still within the slot
  // window, as long as no check-in exists for the slot. Cooldown +
  // day-bound key prevent re-firing the same reminder more than once.
  if (prefs.slotReminders) {
    const slotCheckIns = data.checkIns.filter((c) => dayKeyOf(c.timestamp) === key)
    const slotLabels = { morning: 'Morgens', midday: 'Mittags', evening: 'Abends' }
    for (const slot of ['morning', 'midday', 'evening']) {
      const target = prefs.slotTimes[slot] ?? DEFAULT_PREFS.slotTimes[slot]
      if (!hourInSlotWindow(slot, hour)) continue
      if (hour < target) continue
      const done = slotCheckIns.some((c) => c.timeSlot === slot)
      if (done) continue
      events.push({
        key: `slot:${slot}:${key}`,
        title: `${slotLabels[slot]} · Check-in`,
        body: 'Kurzer Moment für dich — wie fühlst du dich gerade?',
        cooldown: 6 * 3600 * 1000,
      })
    }
  }

  // ── 2. Pressure drop alert ───────────────────────────────────
  if (prefs.pressureAlert && dayPressure?.pressure) {
    const delta = pressureDeltaNext3h(dayPressure.pressure, hour)
    if (delta != null && delta <= -3) {
      events.push({
        key: `pressure:${key}:${hour}`,
        title: 'Luftdruck fällt',
        body: `${Math.abs(delta)} hPa in den nächsten 3 h — gönn dir Pausen und trink genug.`,
        cooldown: 4 * 3600 * 1000,
      })
    }
  }

  // ── 3. Risk peak in next hour ────────────────────────────────
  if (prefs.riskAlert) {
    const base = computeHourlyRisk(data.checkIns, key, now)
    const combined = Array.isArray(base)
      ? combineWithWeather(base, dayPressure?.pressure)
      : (dayPressure?.pressure ? combineWithWeather(null, dayPressure.pressure) : null)
    if (Array.isArray(combined)) {
      const nextHour = Math.min(23, hour + 1)
      const risk = combined[nextHour]
      if (risk != null && risk >= 65) {
        events.push({
          key: `risk:${key}:${nextHour}`,
          title: 'Erhöhtes Kopfschmerz-Risiko',
          body: `Gegen ${String(nextHour).padStart(2, '0')}:00 zeigt deine Kurve ${Math.round(risk)} %. Vielleicht Bildschirmpause, Wasser, kurze Ruhe.`,
          cooldown: 2 * 3600 * 1000,
        })
      }
    }
  }

  // ── 4. Active flare nudge ────────────────────────────────────
  if (prefs.flareNudge) {
    const active = data.flares.find((f) => !f.endTime)
    if (active) {
      const minutesSinceStart = (now.getTime() - active.startTime) / 60000
      if (minutesSinceStart >= 90) {
        events.push({
          key: `flare:${active.id}`,
          title: 'Schub läuft seit über 90 min',
          body: 'Aktualisiere kurz die Intensität — oder beende den Schub, wenn er abklingt.',
          cooldown: 90 * 60 * 1000,
        })
      }
    }
  }

  return events
}

export async function dispatch(events) {
  if (!events.length) return 0
  const state = getState()
  const fired = state.fired || {}
  let dispatched = 0
  const nowTs = Date.now()
  for (const e of events) {
    const last = fired[e.key]
    if (last && nowTs - last < (e.cooldown ?? 3600000)) continue
    const ok = await showSystemNotification(e.title, e.body, e.key)
    if (ok) {
      fired[e.key] = nowTs
      dispatched++
    }
  }
  // Garbage-collect entries older than 36 h to keep storage small
  for (const k of Object.keys(fired)) {
    if (nowTs - fired[k] > 36 * 3600 * 1000) delete fired[k]
  }
  setState({ fired })
  return dispatched
}

/** Convenience: fire a one-off test notification (for the Settings test button). */
export async function fireTest() {
  return showSystemNotification(
    'Calira · Test',
    'Benachrichtigungen sind aktiv. So sehen sie aus.',
    'test',
  )
}

/**
 * Diagnose the notification system. Returns a list of per-category status
 * objects so the user can see WHY nothing fires (waiting for what).
 */
export function diagnose({ data, dayPressure, now = new Date() }) {
  const prefs = getPrefs()
  const perm = permissionStatus()
  const quiet = inQuietHours(now, prefs)
  const state = getState()
  const fired = state.fired || {}
  const key = todayKey(now)
  const hour = now.getHours()

  const rows = []

  // System-level
  rows.push({
    id: 'system',
    label: 'System',
    armed: perm === 'granted' && prefs.enabled && !quiet,
    detail:
      perm === 'unsupported' ? 'Browser unterstützt keine Benachrichtigungen' :
      perm === 'denied' ? 'Berechtigung im Browser blockiert' :
      perm !== 'granted' ? 'Berechtigung noch nicht erteilt' :
      !prefs.enabled ? 'in Einstellungen nicht aktiviert' :
      quiet ? `Ruhezeit (${String(prefs.quietStart).padStart(2,'0')}–${String(prefs.quietEnd).padStart(2,'0')})` :
      'aktiv',
  })

  // Slot reminders — show each slot
  if (prefs.slotReminders) {
    const slotCheckIns = data.checkIns.filter((c) => dayKeyOf(c.timestamp) === key)
    const slotLabels = { morning: 'Morgens', midday: 'Mittags', evening: 'Abends' }
    for (const slot of ['morning', 'midday', 'evening']) {
      const target = prefs.slotTimes[slot] ?? DEFAULT_PREFS.slotTimes[slot]
      const inWindow = hourInSlotWindow(slot, hour)
      const past = hour >= target && inWindow
      const done = slotCheckIns.some((c) => c.timeSlot === slot)
      const lastFired = fired[`slot:${slot}:${key}`]
      const detail =
        done ? 'erledigt — kein Hinweis nötig' :
        !inWindow ? `wartet auf Slot-Fenster (${target}:00 Uhr)` :
        !past ? `Hinweis ab ${target}:00 Uhr` :
        lastFired ? `bereits gesendet ${new Date(lastFired).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` :
        'feuert beim nächsten Tick (innerhalb 60 s)'
      rows.push({
        id: `slot-${slot}`,
        label: `Check-in ${slotLabels[slot]}`,
        armed: !done && past && !lastFired,
        detail,
      })
    }
  }

  // Pressure
  if (prefs.pressureAlert) {
    const series = dayPressure?.pressure
    let detail = 'wartet auf Wetterdaten (Standortfreigabe nötig)'
    let armed = false
    if (Array.isArray(series)) {
      const delta = pressureDeltaNext3h(series, hour)
      if (delta == null) detail = 'Wetterdaten unvollständig'
      else if (delta > -3) detail = `aktueller Trend: ${delta > 0 ? '+' : ''}${delta} hPa in 3 h (Schwelle ≤ −3)`
      else {
        const last = fired[`pressure:${key}:${hour}`]
        if (last) {
          detail = `bereits gesendet ${new Date(last).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
        } else {
          detail = `Druckabfall ${delta} hPa erkannt — feuert beim nächsten Tick`
          armed = true
        }
      }
    }
    rows.push({ id: 'pressure', label: 'Luftdruck-Warnung', armed, detail })
  }

  // Risk
  if (prefs.riskAlert) {
    let detail = 'kein Risiko-Peak in der nächsten Stunde'
    let armed = false
    const base = computeHourlyRisk(data.checkIns, key, now)
    const series = dayPressure?.pressure
    const combined = Array.isArray(base)
      ? combineWithWeather(base, series)
      : (series ? combineWithWeather(null, series) : null)
    if (!Array.isArray(combined)) {
      detail = base?.insufficient
        ? `noch ${base.needed - base.daysTracked} Tracking-Tage bis Prognose`
        : 'Risiko-Kurve nicht verfügbar'
    } else {
      const nextHour = Math.min(23, hour + 1)
      const risk = combined[nextHour]
      if (risk == null) detail = 'Risiko-Kurve hat keinen Wert'
      else if (risk < 65) detail = `nächste Stunde: ${Math.round(risk)} % (Schwelle ≥ 65)`
      else {
        const last = fired[`risk:${key}:${nextHour}`]
        if (last) detail = `bereits gesendet ${new Date(last).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
        else { detail = `${Math.round(risk)} % gegen ${nextHour}:00 — feuert beim nächsten Tick`; armed = true }
      }
    }
    rows.push({ id: 'risk', label: 'Risiko-Vorschau', armed, detail })
  }

  // Flare
  if (prefs.flareNudge) {
    const active = data.flares.find((f) => !f.endTime)
    let detail = 'kein laufender Schub'
    let armed = false
    if (active) {
      const mins = Math.round((now.getTime() - active.startTime) / 60000)
      if (mins < 90) detail = `läuft seit ${mins} min (Hinweis nach 90 min)`
      else {
        const last = fired[`flare:${active.id}`]
        if (last && now.getTime() - last < 90 * 60 * 1000) {
          detail = `bereits gesendet ${new Date(last).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
        } else { detail = `läuft seit ${mins} min — feuert beim nächsten Tick`; armed = true }
      }
    }
    rows.push({ id: 'flare', label: 'Schub-Nudge', armed, detail })
  }

  return rows
}

/** Force-evaluate triggers now and dispatch any armed ones. */
export async function triggerNow(args) {
  const events = evaluateTriggers(args)
  return dispatch(events)
}
