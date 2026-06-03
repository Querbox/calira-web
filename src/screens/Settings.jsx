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
  const fileInput = useRef(null)
  const [printing, setPrinting] = useState(false)

  async function onImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
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

      {/* ───────────────── Persönlich ───────────────── */}
      <SettingsCard icon="spark" title="Persönlich">
        <input
          className="input"
          value={data.name || ''}
          onChange={(e) => actions.setName(e.target.value)}
          placeholder="dein Vorname (z. B. Jana)"
          maxLength={32}
        />
        <p className="settings-row__hint">
          Erscheint nur in der Begrüßung auf der Startseite.
        </p>
      </SettingsCard>

      {/* ───────────────── Darstellung ───────────────── */}
      <DisplayCard data={data} />

      {/* ───────────────── Benachrichtigungen ───────────────── */}
      <NotificationsCard />

      {/* ───────────────── Daten ───────────────── */}
      <SettingsCard icon="download" title="Deine Daten" meta={`${total} Einträge`}>
        <p className="settings-row__hint">
          Alle Einträge bleiben <em>lokal</em> in deinem Browser. Nichts wird hochgeladen, niemand kann mitlesen.
        </p>

        <div className="settings-stats">
          <Stat label="Check-ins" value={data.checkIns.length} />
          <Stat label="Medis" value={data.medications.length} />
          <Stat label="Schübe" value={data.flares.length} />
        </div>

        <div className="settings-subhead">Export & Import</div>
        <div className="settings-grid-2">
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

        <div className="settings-subhead">Werkzeuge</div>
        <button className="btn btn-soft btn-block" onClick={actions.seedDemo}>
          <Icon name="spark" size={15} /> Demo-Daten laden
        </button>
        <button
          className="btn btn-danger btn-block"
          style={{ marginTop: 8 }}
          onClick={() => { if (confirm('Wirklich alle Daten löschen?')) actions.reset() }}
        >
          <Icon name="trash" size={15} /> Alle Daten löschen
        </button>
      </SettingsCard>

      {/* ───────────────── Bericht ───────────────── */}
      <SettingsCard icon="download" title="Bericht für Ärzt*in">
        <p className="settings-row__hint">
          Druckbare 1-Seiten-Übersicht der letzten <em>28 Tage</em> — Tagestabelle,
          Medikamenten-Übersicht und häufigste Auslöser. Im Druckdialog auch als <em>PDF speichern</em>.
        </p>
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 12 }}
          onClick={() => setPrinting(true)}
        >
          <Icon name="download" size={15} /> Bericht drucken / als PDF
        </button>
      </SettingsCard>
      {printing && <PrintReport data={data} onClose={() => setPrinting(false)} />}

      {/* ───────────────── App & Über ───────────────── */}
      <SettingsCard icon="refresh" title="App">
        <p className="settings-row__hint">
          Calira lädt automatisch frische Daten. Wenn etwas nach einem Update gleich aussieht,
          ist meist der Cache der Home-Screen-App noch alt — dann hilft <em>Auf Updates prüfen</em>.
          Deine Einträge bleiben erhalten.
        </p>
        <button
          className="btn btn-soft btn-block"
          style={{ marginTop: 12 }}
          onClick={() => actions.checkForUpdates()}
        >
          <Icon name="refresh" size={15} /> Auf Updates prüfen & neu laden
        </button>

        <div className="settings-subhead">Über Calira</div>
        <p className="settings-row__hint">
          Ein leises Tagebuch für chronische Kopfschmerzen. Drei Momente am Tag —
          Morgens, Mittags, Abends. Keine Pop-ups, keine Streaks, keine Punkte.
          <em> Nur du und der Tag.</em>
        </p>

        <div className="settings-subhead">Rechtliches</div>
        <div className="legal-links">
          <button onClick={() => window.dispatchEvent(new CustomEvent('calira:open-legal', { detail: 'imprint' }))}>
            <span>Impressum</span><Icon name="arrow" size={12} />
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('calira:open-legal', { detail: 'privacy' }))}>
            <span>Datenschutz</span><Icon name="arrow" size={12} />
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('calira:open-legal', { detail: 'disclaimer' }))}>
            <span>Medizinischer Hinweis</span><Icon name="arrow" size={12} />
          </button>
        </div>
      </SettingsCard>

      <div className="wordmark-block">
        <div className="wordmark-block__name">Calira</div>
        <div className="wordmark-block__tag">v0.3 · lokal · gestenfreundlich</div>
      </div>
    </>
  )
}

/* ─────────── Reusable building blocks ─────────── */

function SettingsCard({ icon, title, meta, children }) {
  return (
    <div className="card settings-card">
      <div className="settings-card__head">
        <div className="settings-card__title">
          {icon && (
            <span className="settings-card__icon">
              <Icon name={icon} size={14} />
            </span>
          )}
          <span>{title}</span>
        </div>
        {meta && <div className="settings-card__meta">{meta}</div>}
      </div>
      <div className="settings-card__body">{children}</div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="kv">
      <div className="kv__label">{label}</div>
      <div className="kv__value">{value}</div>
    </div>
  )
}

/* ─────────── Darstellung (combines scheme / accent / font / motion) ─────────── */

function DisplayCard({ data }) {
  const scheme = data.scheme || 'light'
  const motion = data.motion || 'auto'
  return (
    <SettingsCard icon="sun" title="Darstellung">
      <div className="settings-subhead">Helligkeit</div>
      <div className="seg">
        <button className={`seg__btn ${scheme === 'light' ? 'is-active' : ''}`} onClick={() => actions.setScheme('light')}>
          <Icon name="sun" size={14} /> Hell
        </button>
        <button className={`seg__btn ${scheme === 'dark' ? 'is-active' : ''}`} onClick={() => actions.setScheme('dark')}>
          <Icon name="moon" size={14} /> Dunkel
        </button>
      </div>

      <div className="settings-subhead">Akzentfarbe</div>
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

      <div className="settings-subhead">Schriftpaarung</div>
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

      <div className="settings-subhead">Bewegung</div>
      <div className="seg seg--3">
        <button className={`seg__btn ${motion === 'auto' ? 'is-active' : ''}`} onClick={() => actions.setMotion('auto')}>
          <Icon name="refresh" size={14} /> System
        </button>
        <button className={`seg__btn ${motion === 'full' ? 'is-active' : ''}`} onClick={() => actions.setMotion('full')}>
          <Icon name="spark" size={14} /> Voll
        </button>
        <button className={`seg__btn ${motion === 'reduced' ? 'is-active' : ''}`} onClick={() => actions.setMotion('reduced')}>
          <Icon name="check" size={14} /> Reduziert
        </button>
      </div>
      <p className="settings-row__hint">
        <em>Reduziert</em> schaltet Übergänge ab — hilft bei Migräne oder Visualisierungsproblemen.
      </p>
    </SettingsCard>
  )
}

/* ─────────── Notifications ─────────── */

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

  const meta =
    !supported ? 'nicht verfügbar' :
    perm === 'denied' ? 'blockiert' :
    enabled ? 'aktiv' : 'aus'

  const CATS = [
    { id: 'slotReminders', label: 'Check-in-Erinnerungen', desc: 'Morgens / Mittags / Abends — nur wenn noch nichts erfasst ist.' },
    { id: 'pressureAlert', label: 'Luftdruck-Warnung',     desc: 'Bei Druckabfall ≥ 3 hPa in den nächsten 3 h.' },
    { id: 'riskAlert',     label: 'Risiko-Vorschau',       desc: 'Wenn deine Wahrscheinlichkeit für die nächste Stunde ≥ 65 % liegt.' },
    { id: 'flareNudge',    label: 'Schub-Nudge',           desc: 'Wenn ein laufender Schub seit 90 min nicht aktualisiert wurde.' },
  ]

  return (
    <SettingsCard icon="spark" title="Benachrichtigungen" meta={meta}>
      {!supported && (
        <p className="settings-row__hint">
          Dein Browser unterstützt keine Benachrichtigungen. Auf iOS musst du Calira erst zum Home-Bildschirm hinzufügen.
        </p>
      )}

      {supported && perm === 'denied' && (
        <p className="settings-row__hint">
          Benachrichtigungen sind in deinen Browser-Einstellungen blockiert. Erlaube sie dort manuell für diese Seite.
        </p>
      )}

      {supported && perm !== 'denied' && !enabled && (
        <>
          <p className="settings-row__hint">
            Nur in <em>klugen Momenten</em> — bei fallendem Luftdruck, erhöhter Wahrscheinlichkeit, oder wenn du einen Check-in vergisst. Nie Streaks, nie Spam.
          </p>
          <button className="btn btn-accent btn-block" style={{ marginTop: 12 }} onClick={onEnable}>
            <Icon name="spark" size={15} /> Aktivieren
          </button>
        </>
      )}

      {enabled && (
        <>
          <p className="settings-row__hint">
            Aktiv solange Calira geöffnet ist (oder als Home-Screen-App im Hintergrund läuft).
          </p>

          <div className="settings-subhead">Welche Hinweise</div>
          <div className="notify-list">
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

          <div className="settings-subhead">Ruhezeiten</div>
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

          <div className="settings-grid-2" style={{ marginTop: 14 }}>
            <button className="btn btn-soft" onClick={onTest}>
              <Icon name="spark" size={14} /> Test {testFeedback && `· ${testFeedback}`}
            </button>
            <button className="btn btn-soft" onClick={() => update({ enabled: false })}>
              <Icon name="check" size={14} /> Deaktivieren
            </button>
          </div>
        </>
      )}
    </SettingsCard>
  )
}
