import { useEffect, useState } from 'react'
import Icon from './Icon'

/**
 * Listens for a new service worker installing and shows a banner
 * prompting the user to reload. Non-intrusive, dismissible.
 */
export default function UpdateBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    function onNewSW(reg) {
      const nw = reg.installing || reg.waiting
      if (!nw) return
      if (nw.state === 'installed') {
        setShow(true)
        return
      }
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed') setShow(true)
      })
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return
      if (reg.waiting) { setShow(true); return }
      reg.addEventListener('updatefound', () => onNewSW(reg))
    })

    // Also check on a custom event (fired by main.jsx)
    const handler = () => setShow(true)
    window.addEventListener('calira:update-available', handler)
    return () => window.removeEventListener('calira:update-available', handler)
  }, [])

  if (!show) return null

  function reload() {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) reg.waiting.postMessage('skip-waiting')
    })
    // controllerchange listener in main.jsx will reload
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <div className="update-banner">
      <div className="update-banner__content">
        <Icon name="refresh" size={16} />
        <span>Neue Version verfügbar</span>
      </div>
      <div className="update-banner__actions">
        <button className="update-banner__btn" onClick={reload}>Aktualisieren</button>
        <button className="update-banner__dismiss" onClick={() => setShow(false)} aria-label="Schließen">×</button>
      </div>
    </div>
  )
}
