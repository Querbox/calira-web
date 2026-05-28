import { useData, actions } from '../lib/store'
import Icon from '../components/Icon'

export default function Settings() {
  const data = useData()
  const total = data.checkIns.length + data.medications.length + data.flares.length

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
          <Icon name="settings" size={12} /> Einstellungen
        </div>
        <h1 className="page-header__title">Daten & <em>Stille.</em></h1>
      </header>

      <section className="section">
        <div className="section__head">
          <div className="section__title">Name</div>
        </div>
        <input
          className="input"
          value={data.name || ''}
          onChange={(e) => actions.setName(e.target.value)}
          placeholder="dein Vorname (z. B. Jana)"
          maxLength={32}
        />
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Wird nur in der Begrüßung auf der Startseite verwendet.
        </p>
      </section>

      <section className="section">
        <div className="section__head">
          <div className="section__title">Deine Daten</div>
        </div>
        <p className="muted">
          Alle Einträge bleiben <em>lokal</em> in deinem Browser. Nichts wird hochgeladen, niemand kann mitlesen.
        </p>
        <div className="kv-row">
          <div className="kv"><div className="kv__label">Einträge</div><div className="kv__value">{total}</div></div>
          <div className="kv"><div className="kv__label">Check-ins</div><div className="kv__value">{data.checkIns.length}</div></div>
          <div className="kv"><div className="kv__label">Medis</div><div className="kv__value">{data.medications.length}</div></div>
        </div>
      </section>

      <div className="actions">
        <button className="actions__btn" onClick={exportData}>
          <Icon name="download" size={16} /> Exportieren
        </button>
        <button className="actions__btn" onClick={actions.seedDemo}>
          <Icon name="refresh" size={16} /> Demo-Daten
        </button>
        <button
          className="actions__btn actions__btn--alert"
          onClick={() => { if (confirm('Wirklich alle Daten löschen?')) actions.reset() }}
        >
          <Icon name="trash" size={16} /> Löschen
        </button>
      </div>

      <section className="section">
        <div className="section__head">
          <div className="section__title">Über Calira</div>
        </div>
        <p className="muted">
          Ein leises Tagebuch für chronische Kopfschmerzen. Drei Momente am Tag —
          Morgens, Mittags, Abends. Keine Pop-ups, keine Streaks, keine Punkte.
          <em> Nur du und der Tag.</em>
        </p>
      </section>

      <section className="section">
        <div className="section__head">
          <div className="section__title">Gesten</div>
        </div>
        <p className="muted">
          Tabs wechseln mit Wisch nach links / rechts. Sheets schließt du, indem du sie
          nach unten ziehst. Im Check-in wechselst du die Schritte mit dem Finger.
        </p>
      </section>

      <div className="wordmark-block">
        <div className="wordmark-block__name">Calira</div>
        <div className="wordmark-block__tag">v0.2 · Fraunces & JetBrains Mono</div>
      </div>
    </>
  )
}
