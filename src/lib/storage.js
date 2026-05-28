const KEY = 'calira:data:v1'

const empty = () => ({ checkIns: [], medications: [], flares: [], notes: {}, name: '', theme: 'clay', fontMode: 'quiet' })

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    return { ...empty(), ...JSON.parse(raw) }
  } catch {
    return empty()
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function dayKeyOf(ts) {
  return todayKey(new Date(ts))
}
