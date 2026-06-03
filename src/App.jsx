import { useEffect, useRef, useState } from 'react'
import { useData, actions } from './lib/store'
import Home from './screens/Home'
import History from './screens/History'
import Settings from './screens/Settings'
import Icon from './components/Icon'
import UpdateBanner from './components/UpdateBanner'
import InstallPrompt from './components/InstallPrompt'
import { usePager } from './lib/usePager'
import { useNotifications } from './hooks/useNotifications'

const TABS = [
  { id: 'home', label: 'Heute', icon: 'sun' },
  { id: 'history', label: 'Verlauf', icon: 'history' },
  { id: 'settings', label: 'Mehr', icon: 'settings' },
]

export default function App() {
  const data = useData()
  const [tab, setTab] = useState('home')
  const [enterDir, setEnterDir] = useState(null) // 'left' | 'right' | null
  const pagesRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.theme || 'clay')
    document.documentElement.setAttribute('data-font', data.fontMode || 'quiet')
    if (data.scheme === 'dark') document.documentElement.setAttribute('data-scheme', 'dark')
    else document.documentElement.removeAttribute('data-scheme')
    if (data.motion === 'reduced') document.documentElement.setAttribute('data-motion', 'reduced')
    else document.documentElement.removeAttribute('data-motion')
  }, [data.theme, data.fontMode, data.scheme, data.motion])

  // Respect OS-level prefers-reduced-motion when motion="auto" is set
  useEffect(() => {
    if (data.motion === 'auto') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      const apply = () => {
        if (mq.matches) document.documentElement.setAttribute('data-motion', 'reduced')
        else document.documentElement.removeAttribute('data-motion')
      }
      apply()
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [data.motion])

  function goto(nextId) {
    if (nextId === tab) return
    const cur = TABS.findIndex((t) => t.id === tab)
    const nxt = TABS.findIndex((t) => t.id === nextId)
    setEnterDir(nxt > cur ? 'from-right' : 'from-left')
    // Reset transform on page wrapper before mount of new tab
    if (pagesRef.current) {
      pagesRef.current.style.transition = ''
      pagesRef.current.style.transform = ''
      pagesRef.current.style.opacity = ''
    }
    setTab(nextId)
  }

  function relative(delta) {
    const i = TABS.findIndex((t) => t.id === tab)
    const n = TABS[i + delta]
    if (n) goto(n.id)
  }

  usePager(pagesRef, {
    onLeft: () => relative(1),
    onRight: () => relative(-1),
    commitAt: 80,
  })

  useNotifications(data)

  return (
    <div className="app">
      <UpdateBanner />
      <InstallPrompt />
      <div className="app__pages" ref={pagesRef}>
        <main className={`app__main ${enterDir ? `app__main--${enterDir}` : ''}`} key={tab}>
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
