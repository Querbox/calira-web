import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './app.css'
import './print.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        // Check for a new worker on every app launch
        reg.update().catch(() => {})
        // If a new worker installs in the background, ask it to activate
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing
          if (!nw) return
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage('skip-waiting')
            }
          })
        })
      })
      .catch(() => {})

    // When the controlling SW changes (user clicked "Aktualisieren"), refresh
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })

    // Notify the UpdateBanner when a waiting worker is detected
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg?.waiting) window.dispatchEvent(new Event('calira:update-available'))
    })
  })
}
