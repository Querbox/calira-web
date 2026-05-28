import { useData, actions } from '../lib/store'

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
        <div className="page-header__eyebrow">Einstellungen</div>
        <h1 className="page-header__title">Daten & <em>Stille.</em></h1>
      </header>

      <section className="section">
        <div className="section__head"><div className="section__title">Deine Daten</div></div>
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
        <button className="actions__btn" onClick={exportData}>Daten exportieren</button>
        <button className="actions__btn" onClick={actions.seedDemo}>Demo-Daten laden</button>
        <button
          className="actions__btn actions__btn--alert"
          onClick={() => { if (confirm('Wirklich alle Daten löschen?')) actions.reset() }}
        >
          Alles löschen
        </button>
      </div>

      <section className="section">
        <div className="section__head"><div className="section__title">Über Calira</div></div>
        <p className="muted">
          Ein leises Tagebuch für chronische Kopfschmerzen. Drei Momente am Tag, die du
          dir selbst widmest — Morgens, Mittags, Abends. Keine Pop-ups, keine Streaks, keine
          Punkte. <em>Nur du und der Tag.</em>
        </p>
      </section>

      <section className="section">
        <div className="section__head"><div className="section__title">Colophon</div></div>
        <p className="muted">
          Typografie: Fraunces & JetBrains Mono. Aufzeichnung: LocalStorage. Code auf
          <a href="https://github.com/Querbox/calira-web" style={{ color: 'var(--clay)' }} target="_blank" rel="noreferrer"> GitHub</a>.
        </p>
      </section>
    </>
  )
}
