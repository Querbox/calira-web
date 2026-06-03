import { useEffect, useRef } from 'react'
import { evaluateTriggers, dispatch, getPrefs, permissionStatus } from '../lib/notify'
import { fetchDayPressure } from '../lib/weather'
import { todayKey } from '../lib/storage'

const TICK_MS = 60 * 1000

/**
 * Foreground notification scheduler. Ticks every minute while the tab is open.
 * Re-evaluates triggers based on the latest data and today's hourly pressure.
 */
export function useNotifications(data) {
  const dataRef = useRef(data)
  dataRef.current = data
  const pressureRef = useRef(null)
  const lastPressureKeyRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function refreshPressure() {
      const key = todayKey()
      if (lastPressureKeyRef.current === key && pressureRef.current) return
      const p = await fetchDayPressure(key).catch(() => null)
      if (cancelled) return
      pressureRef.current = p
      lastPressureKeyRef.current = key
    }

    async function tick() {
      const prefs = getPrefs()
      if (!prefs.enabled || permissionStatus() !== 'granted') return
      await refreshPressure()
      const events = evaluateTriggers({
        data: dataRef.current,
        dayPressure: pressureRef.current,
      })
      if (events.length) await dispatch(events)
    }

    tick()
    const id = setInterval(tick, TICK_MS)

    // Also re-tick on visibility change (returning to the tab is a good moment to nudge)
    function onVisible() { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
