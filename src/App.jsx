import { useEffect, useRef, useState } from 'react'
import { useData } from './lib/store'
import Home from './screens/Home'
import History from './screens/History'
import Settings from './screens/Settings'
import Icon from './components/Icon'
import { useSwipe } from './lib/useSwipe'

const TABS = [
  { id: 'home', label: 'Heute', icon: 'sun' },
  { id: 'history', label: 'Verlauf', icon: 'history' },
  { id: 'settings', label: 'Mehr', icon: 'settings' },
]

export default function App() {
  const data = useData()
  const [tab, setTab] = useState('home')
  const pagesRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.theme || 'clay')
    document.documentElement.setAttribute('data-font', data.fontMode || 'quiet')
  }, [data.theme, data.fontMode])

  function goto(next) {
    if (next === tab) return
    setTab(next)
  }
  function relative(delta) {
    const i = TABS.findIndex((t) => t.id === tab)
    const n = TABS[(i + delta + TABS.length) % TABS.length]
    if (n) goto(n.id)
  }

  useSwipe(pagesRef, {
    onLeft: () => relative(1),
    onRight: () => relative(-1),
    threshold: 70,
  })

  return (
    <div className="app">
      <div className="app__pages" ref={pagesRef}>
        <main className="app__main" key={tab}>
          {tab === 'home' && <Home />}
          {tab === 'history' && <History />}
          {tab === 'settings' && <Settings />}
        </main>
      </div>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tabbar__item ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => goto(t.id)}
            aria-label={t.label}
          >
            <Icon name={t.icon} size={18} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
