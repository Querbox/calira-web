import { useEffect, useState } from 'react'
import Icon from './Icon'

const DISMISS_KEY = 'calira:install:dismissed'
const DISMISS_TTL = 14 * 24 * 3600 * 1000 // 14 days

function isStandalone() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  // iOS Safari
  if (window.navigator.standalone === true) return true
  return false
}

function isIOSSafari() {
  const ua = window.navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  // Safari on iOS — excludes Chrome (CriOS), Firefox (FxiOS), Edge (EdgiOS), in-app webviews
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|FBAN|FBAV|Instagram|Line/.test(ua)
  return iOS && safari
}

function isAndroidChrome() {
  const ua = window.navigator.userAgent
  return /Android/.test(ua) && /Chrome/.test(ua)
}

function dismissedRecently() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return t && Date.now() - t < DISMISS_TTL
  } catch { return false }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null) // beforeinstallprompt event (Chrome/Edge)
  const [show, setShow] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (dismissedRecently()) return

    function onPrompt(e) {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    function onInstalled() { setShow(false); setDeferred(null) }
    window.addEventListener('appinstalled', onInstalled)

    // iOS Safari never fires beforeinstallprompt, so we show our own help.
    // Delay a bit so it doesn't appear on first paint.
    let iosTimer = null
    if (isIOSSafari()) {
      iosTimer = setTimeout(() => setShow(true), 4000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {}
    setShow(false)
    setShowIOSHelp(false)
  }

  async function onInstall() {
    if (deferred) {
      deferred.prompt()
      const choice = await deferred.userChoice.catch(() => null)
      if (choice?.outcome === 'accepted') {
        setShow(false)
      } else {
        dismiss()
      }
      setDeferred(null)
      return
    }
    // iOS Safari path: open inline instructions
    setShowIOSHelp(true)
  }

  if (!show) return null

  return (
    <>
      <div className="install-prompt" role="dialog" aria-label="Calira zum Home-Bildschirm hinzufügen">
        <div className="install-prompt__icon">
          <Icon name="spark" size={16} />
        </div>
        <div className="install-prompt__body">
          <div className="install-prompt__title">Calira zum Home-Bildschirm</div>
          <div className="install-prompt__desc">
            Schneller Zugriff, eigene App-Kachel, Benachrichtigungen im Hintergrund.
          </div>
        </div>
        <div className="install-prompt__actions">
          <button className="install-prompt__btn" onClick={onInstall}>
            {deferred ? 'Hinzufügen' : 'Anleitung'}
          </button>
          <button className="install-prompt__dismiss" onClick={dismiss} aria-label="Später">×</button>
        </div>
      </div>

      {showIOSHelp && (
        <div className="install-help-backdrop" onClick={() => setShowIOSHelp(false)}>
          <div className="install-help" onClick={(e) => e.stopPropagation()}>
            <div className="install-help__title">So fügst du Calira hinzu</div>
            <ol className="install-help__steps">
              <li>Tippe unten in Safari auf das <em>Teilen</em>-Symbol (Quadrat mit Pfeil ↑).</li>
              <li>Wähle <em>„Zum Home-Bildschirm"</em>.</li>
              <li>Bestätige mit <em>„Hinzufügen"</em> oben rechts.</li>
            </ol>
            <p className="install-help__note">
              Calira erscheint dann als eigene App-Kachel — Benachrichtigungen funktionieren erst danach.
            </p>
            <button className="btn btn-soft btn-block" onClick={() => { setShowIOSHelp(false); dismiss() }}>
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  )
}
