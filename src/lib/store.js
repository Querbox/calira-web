import { useEffect, useState, useCallback } from 'react'
import { loadData, saveData, uid } from './storage'

let _state = loadData()
const listeners = new Set()

function set(updater) {
  _state = typeof updater === 'function' ? updater(_state) : updater
  saveData(_state)
  listeners.forEach((l) => l(_state))
}

export function useData() {
  const [state, setState] = useState(_state)
  useEffect(() => {
    const l = (s) => setState(s)
    listeners.add(l)
    return () => listeners.delete(l)
  }, [])
  return state
}

export const actions = {
  addCheckIn(entry) {
    set((s) => ({
      ...s,
      checkIns: [...s.checkIns, { id: uid(), timestamp: Date.now(), ...entry }],
    }))
  },
  addMedication(entry) {
    set((s) => ({
      ...s,
      medications: [...s.medications, { id: uid(), timestamp: Date.now(), ...entry }],
    }))
  },
  addFlare(entry) {
    set((s) => ({
      ...s,
      flares: [...s.flares, { id: uid(), startTime: Date.now(), endTime: null, ...entry }],
    }))
  },
  endFlare(id, peakIntensity) {
    set((s) => ({
      ...s,
      flares: s.flares.map((f) => (f.id === id ? { ...f, endTime: Date.now(), peakIntensity } : f)),
    }))
  },
  remove(kind, id) {
    set((s) => ({ ...s, [kind]: s[kind].filter((x) => x.id !== id) }))
  },
  reset() {
    set((s) => ({ checkIns: [], medications: [], flares: [], notes: {}, name: s.name }))
  },
  setName(name) {
    set((s) => ({ ...s, name: (name || '').trim() }))
  },
  setTheme(theme) {
    set((s) => ({ ...s, theme }))
    document.documentElement.setAttribute('data-theme', theme)
  },
  setFontMode(mode) {
    set((s) => ({ ...s, fontMode: mode }))
    document.documentElement.setAttribute('data-font', mode)
  },
  setScheme(scheme) {
    set((s) => ({ ...s, scheme }))
    if (scheme === 'dark') document.documentElement.setAttribute('data-scheme', 'dark')
    else document.documentElement.removeAttribute('data-scheme')
  },
  seedDemo() {
    const now = Date.now()
    const day = 86400000
    const checkIns = []
    const meds = []
    for (let d = 13; d >= 0; d--) {
      const base = now - d * day
      ;[
        [8, 'morning'],
        [13, 'midday'],
        [20, 'evening'],
      ].forEach(([h, slot]) => {
        const dt = new Date(base)
        dt.setHours(h, 0, 0, 0)
        const variance = Math.sin(d * 0.7 + h * 0.3) * 3 + 4
        const pain = Math.max(0, Math.min(10, Math.round(variance + (d === 2 ? 3 : 0))))
        checkIns.push({
          id: uid(),
          timestamp: dt.getTime(),
          timeSlot: slot,
          painLevel: pain,
          dominantType: ['throbbing', 'pressing', 'dull'][d % 3],
          stressLevel: Math.min(10, pain + 1),
          neckTension: Math.max(0, pain - 1),
          functionalLevel: pain > 6 ? 'severe' : pain > 4 ? 'moderate' : pain > 2 ? 'light' : 'unaffected',
          notes: '',
        })
      })
      if (d % 2 === 0) {
        const dt = new Date(base)
        dt.setHours(14, 30, 0, 0)
        meds.push({
          id: uid(),
          timestamp: dt.getTime(),
          medicationName: 'Ibuprofen 400',
          dosage: '1 Tablette',
          perceivedEffect: 'gut',
          isAcute: true,
        })
      }
    }
    set((s) => ({ ...s, checkIns: [...s.checkIns, ...checkIns], medications: [...s.medications, ...meds] }))
  },
}
