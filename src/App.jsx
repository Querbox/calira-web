import { useState } from 'react'
import Home from './screens/Home'
import History from './screens/History'
import Settings from './screens/Settings'

const TABS = [
  { id: 'home', label: 'Heute', icon: '☀️' },
  { id: 'history', label: 'Verlauf', icon: '📊' },
  { id: 'settings', label: 'Mehr', icon: '⚙️' },
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
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tabbar__item ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tabbar__icon">{t.icon}</span>
            <span className="tabbar__label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
