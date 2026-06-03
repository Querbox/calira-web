import { useEffect, useRef, useState } from 'react'
import { useData, actions } from '../lib/store'
import Icon from '../components/Icon'
import PrintReport from '../components/PrintReport'
import { getPrefs, setPrefs, permissionStatus, requestPermission, fireTest } from '../lib/notify'

const THEMES = [
  { id: 'clay',  label: 'Clay',  swatch: '#ec7a5a' },
  { id: 'rose',  label: 'Rose',  swatch: '#d96c8a' },
  { id: 'amber', label: 'Amber', swatch: '#d4a73d' },
  { id: 'sage',  label: 'Sage',  swatch: '#6f9a72' },
  { id: 'ocean', label: 'Ocean', swatch: '#5a8aaf' },
  { id: 'plum',  label: 'Plum',  swatch: '#a06591' },
]

const FONTS = [
  { id: 'quiet',     label: 'Quiet',     desc: 'Fraunces · Instrument Sans', serif: 'Fraunces, serif' },
  { id: 'editorial', label: 'Editorial', desc: 'Newsreader · Public Sans',   serif: 'Newsreader, serif' },
  { id: 'modern',    label: 'Modern',    desc: 'DM Serif Text · Outfit',     serif: '"DM Serif Text", serif' },
  { id: 'mono',      label: 'Mono',      desc: 'JetBrains Mono — alles',     serif: '"JetBrains Mono", monospace' },
]

export default function Settings() {
  const data = useData()
  const total = data.checkIns.length + data.medications.length + data.flares.length
  const scheme = data.scheme || 'light'
  const fileInput = useRef(null)
  const [printing, setPrinting] = useState(false)

  async function onImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const summary = `${parsed.checkIns?.length || 0} Check-ins · ${parsed.medications?.length || 0} Medis · ${parsed.flares?.length || 0} Schübe`
      const ok = confirm(
        `Import: ${summary}\n\nDeine aktuellen Einträge (${total}) werden überschrieben. Fortfahren?`
      )
      if (!ok) return
      const out = actions.importData(parsed, { merge: false })
      alert(`Importiert: ${out.checkIns} Check-ins, ${out.medications} Medis, ${out.flares} Schübe.`)
    } catch (err) {
      alert(`Import fehlgeschlagen: ${err.message || err}`)
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calira-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">
          <Icon name="settings" size={13} /> Einstellungen
        </div>
        <h1 className="page-header__title">Daten & <em>Stille.</em></h1>
      </header>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">Name</div>
        </div>
        <input
          className="input"
          value={data.name || ''}
          onChange={(e) => actions.setName(e.target.value)}
          placeholder="dein Vorname (z. B. Jana)"
          maxLength={32}
        />
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Erscheint nur in der Begrüßung auf der Startseite.
        </p>
      </div>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">Darstellung</div>
        </div>
        <div className="scheme-toggle">
          <button
            className={`scheme-toggle__btn ${scheme === 'light' ? 'is-active' : ''}`}
            onClick={() => actions.setScheme('light')}
          >
            <Icon name="sun" size={14} /> Hell
          </button>
          <button
            className={`scheme-toggle__btn ${scheme === 'dark' ? 'is-active' : ''}`}
            onClick={() => actions.setScheme('dark')}
          >
            <Icon name="moon" size={14} /> Dunkel
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">Bewegung</div>
          <div className="section__meta">{
            (data.motion || 'auto') === 'auto' ? 'System' :
            (data.motion === 'reduced') ? 'reduziert' : 'voll'
          }</div>
        </div>
        <div className="scheme-toggle" style={{ marginBottom: 8 }}>
          <button
            className={`scheme-toggle__btn ${(data.motion || 'auto') === 'auto' ? 'is-active' : ''}`}
            onClick={() => actions.setMotion('auto')}
          >
            <Icon name="refresh" size={14} /> System
          </button>
          <button
            className={`scheme-toggle__btn ${data.motion === 'full' ? 'is-active' : ''}`}
            onClick={() => actions.setMotion('full')}
          >
            <Icon name="spark" size={14} /> Voll
          </button>
          <button
            className={`scheme-toggle__btn ${data.motion === 'reduced' ? 'is-active' : ''}`}
            onClick={() => actions.setMotion('reduced')}
          >
            <Icon name="check" size={14} /> Reduziert
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12 }}>
          <em>System</em> folgt deiner OS-Einstellung „Bewegung reduzieren".
          <em> Reduziert</em> schaltet alle Übergänge ab — nützlich bei Migräne oder Visualisierungsproblemen.
        </p>
      </div>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">Akzentfarbe</div>
          <div className="section__meta">{THEMES.find((t) => t.id === (data.theme || 'clay'))?.label}</div>
        </div>
        <div className="theme-picker">
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-swatch ${data.theme === t.id || (!data.theme && t.id === 'clay') ? 'is-active' : ''}`}
              onClick={() => actions.setTheme(t.id)}
              aria-label={t.label}
            >
              <span className="theme-swatch__dot" style={{ background: t.swatch }} />
              <span className="theme-swatch__label">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">Schriftpaarung</div>
          <div className="section__meta">{FONTS.find((f) => f.id === (data.fontMode || 'quiet'))?.label}</div>
        </div>
        <div className="font-picker">
          {FONTS.map((f) => (
            <button
              key={f.id}
              className={`font-card ${data.fontMode === f.id || (!data.fontMode && f.id === 'quiet') ? 'is-active' : ''}`}
              onClick={() => actions.setFontMode(f.id)}
            >
              <div className="font-card__preview" style={{ fontFamily: f.serif }}>Aa</div>
              <div className="font-card__name">{f.label}</div>
              <div className="font-card__desc">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <NotificationsCard />

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">App-Update</div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Falls Calira nach einem Update gleich aussieht, ist wahrscheinlich der
          Cache der Home-Screen-App noch alt. <em>Auf Updates prüfen</em> lädt
          alles frisch — deine Einträge bleiben erhalten.
        </p>
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 12 }}
          onClick={() => actions.checkForUpdates()}
        >
          <Icon name="refresh" size={15} /> Auf Updates prüfen & neu laden
        </button>
      </div>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">Deine Daten</div>
        </div>
        <p className="muted">
          Alle Einträge bleiben <em>lokal</em> in deinem Browser. Nichts wird hochgeladen, niemand kann mitlesen.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <div className="kv"><div className="kv__label">Einträge</div><div className="kv__value">{total}</div></div>
          <div className="kv"><div className="kv__label">Check-ins</div><div className="kv__value">{data.checkIns.length}</div></div>
          <div className="kv"><div className="kv__label">Medis</div><div className="kv__value">{data.medications.length}</div></div>
        </div>
        <div className="actions" style={{ marginTop: 16, gridTemplateColumns: '1fr 1fr' }}>
          <button className="btn btn-soft" onClick={exportData}>
            <Icon name="download" size={15} /> Exportieren
          </button>
          <button className="btn btn-soft" onClick={() => fileInput.current?.click()}>
            <Icon name="refresh" size={15} /> Importieren
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={onImportFile}
        />
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 8 }}
          onClick={actions.seedDemo}
        >
          <Icon name="spark" size={15} /> Demo-Daten laden
        </button>
        <button
          className="btn btn-danger btn-block"
          style={{ marginTop: 8 }}
          onClick={() => { if (confirm('Wirklich alle Daten löschen?')) actions.reset() }}
        >
          <Icon name="trash" size={15} /> Alle Daten löschen
        </button>
      </div>

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">Bericht für Ärzt*in</div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Eine druckbare 1-Seiten-Übersicht der letzten <em>28 Tage</em> —
          Tagestabelle, Medikamenten-Übersicht und häufigste Auslöser.
          Im Druckdialog kannst du auch <em>"Als PDF sichern"</em> wählen.
        </p>
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 12 }}
          onClick={() => setPrinting(true)}
        >
          <Icon name="download" size={15} /> Bericht drucken / als PDF
        </button>
      </div>

      {printing && <PrintReport data={data} onClose={() => setPrinting(false)} />}

      <div className="card">
        <div className="section__head" style={{ padding: '0 0 10px' }}>
          <div className="section__title">Über Calira</div>
        </div>
        <p className="muted">
          Ein leises Tagebuch für chronische Kopfschmerzen. Drei Momente am Tag —
          Morgens, Mittags, Abends. Keine Pop-ups, keine Streaks, keine Punkte.
          <em> Nur du und der Tag.</em>
        </p>
      </div>

      <div className="wordmark-block">
        <div className="wordmark-block__name">Calira</div>
        <div className="wordmark-block__tag">v0.3 · lokal · gestenfreundlich</div>
      </div>
    </>
  )
}

function NotificationsCard() {
  const [prefs, setPrefsState] = useState(getPrefs())
  const [perm, setPerm] = useState(permissionStatus())
  const [testFeedback, setTestFeedback] = useState(null)

  useEffect(() => {
    const onFocus = () => setPerm(permissionStatus())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  function update(patch) {
    const next = setPrefs(patch)
    setPrefsState(next)
  }

  async function onEnable() {
    if (perm === 'unsupported') return
    if (perm !== 'granted') {
      const res = await requestPermission()
      setPerm(res)
      if (res !== 'granted') return
    }
    update({ enabled: true })
  }

  async function onTest() {
    const ok = await fireTest()
    setTestFeedback(ok ? 'gesendet' : 'fehlgeschlagen')
    setTimeout(() => setTestFeedback(null), 2500)
  }

  const supported = perm !== 'unsupported'
  const enabled = prefs.enabled && perm === 'granted'

  const CATS = [
    { id: 'slotReminders', label: 'Check-in-Erinnerungen', desc: 'Morgens / Mittags / Abends — nur wenn noch nichts erfasst ist.' },
    { id: 'pressureAlert', label: 'Luftdruck-Warnung', desc: 'Bei einem Druckabfall ≥ 3 hPa in den nächsten 3 Stunden.' },
    { id: 'riskAlert',     label: 'Risiko-Vorschau',    desc: 'Wenn deine kombinierte Wahrscheinlichkeit für die nächste Stunde ≥ 65 % ist.' },
    { id: 'flareNudge',    label: 'Schub-Nudge',         desc: 'Sanfter Hinweis, wenn ein laufender Schub seit 90 min nicht aktualisiert wurde.' },
  ]

  return (
    <div className="card">
      <div className="section__head" style={{ padding: '0 0 10px' }}>
        <div className="section__title">Benachrichtigungen</div>
        <div className="section__meta">
          {!supported ? 'nicht verfügbar' :
           perm === 'denied' ? 'blockiert' :
           enabled ? 'aktiv' : 'aus'}
        </div>
      </div>

      {!supported && (
        <p className="muted" style={{ fontSize: 13 }}>
          Dein Browser unterstützt keine Benachrichtigungen. Auf iOS musst du Calira erst
          zum Home-Bildschirm hinzufügen.
        </p>
      )}

      {supported && perm === 'denied' && (
        <p className="muted" style={{ fontSize: 13 }}>
          Benachrichtigungen sind in deinen Browser-Einstellungen blockiert. Du musst sie
          dort für diese Seite manuell erlauben.
        </p>
      )}

      {supported && perm !== 'denied' && !enabled && (
        <>
          <p className="muted" style={{ fontSize: 13 }}>
            Calira meldet sich nur in <em>klugen Momenten</em> — bei fallendem Luftdruck,
            erhöhter Wahrscheinlichkeit, oder wenn du einen Check-in vergisst.
            Nie Streaks, nie Spam.
          </p>
          <button className="btn btn-accent btn-block" style={{ marginTop: 12 }} onClick={onEnable}>
            <Icon name="spark" size={15} /> Aktivieren
          </button>
        </>
      )}

      {enabled && (
        <>
          <p className="muted" style={{ fontSize: 13 }}>
            Aktiv solange die App geöffnet ist (oder als Home-Screen-App im Hintergrund läuft).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {CATS.map((c) => (
              <label key={c.id} className="notify-row">
                <input
                  type="checkbox"
                  checked={!!prefs[c.id]}
                  onChange={(e) => update({ [c.id]: e.target.checked })}
                />
                <div>
                  <div className="notify-row__label">{c.label}</div>
                  <div className="notify-row__desc">{c.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="section__head" style={{ padding: '14px 0 8px', borderTop: '1px solid var(--line)', marginTop: 14 }}>
            <div className="section__title" style={{ fontSize: 14 }}>Ruhezeiten</div>
            <div className="section__meta">
              {String(prefs.quietStart).padStart(2, '0')}:00 – {String(prefs.quietEnd).padStart(2, '0')}:00
            </div>
          </div>
          <div className="quiet-hours">
            <label>
              <span>von</span>
              <select value={prefs.quietStart} onChange={(e) => update({ quietStart: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </label>
            <label>
              <span>bis</span>
              <select value={prefs.quietEnd} onChange={(e) => update({ quietEnd: Number(e.target.value) })}>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </label>
          </div>

          <div className="actions" style={{ marginTop: 14, gridTemplateColumns: '1fr 1fr' }}>
            <button className="btn btn-soft" onClick={onTest}>
              <Icon name="spark" size={14} /> Test {testFeedback && `· ${testFeedback}`}
            </button>
            <button className="btn btn-soft" onClick={() => update({ enabled: false })}>
              <Icon name="check" size={14} /> Deaktivieren
            </button>
          </div>
        </>
      )}
    </div>
  )
}
