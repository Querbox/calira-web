import { useState } from 'react'
import Home from './screens/Home'
import History from './screens/History'
import Settings from './screens/Settings'

const TABS = [
  { id: 'home', label: 'Heute' },
  { id: 'history', label: 'Verlauf' },
  { id: 'settings', label: 'Mehr' },
]

export default function App() {
  const [tab, setTab] = useState('home')

  return (
    <div className="app">
      <main className="app__main">
        {tab === 'home' && <Home />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="tabbar">
        <span className="wordmark">Calira</span>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tabbar__item ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
