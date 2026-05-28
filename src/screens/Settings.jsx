import { useData, actions } from '../lib/store'

export default function Settings() {
  const data = useData()
  const total = data.checkIns.length + data.medications.length + data.flares.length

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calira-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <header className="page-header">
        <div className="page-header__eyebrow">Einstellungen</div>
        <h1 className="page-header__title">Daten & App</h1>
      </header>

      <section className="card">
        <div className="card__header"><h2>Deine Daten</h2></div>
        <p className="muted">
          Alle Einträge bleiben lokal in deinem Browser (LocalStorage). Nichts wird hochgeladen.
          Gesamt: {total} Einträge.
        </p>
        <div className="action-row" style={{ marginTop: 16 }}>
          <button className="btn btn-soft" onClick={exportData}>Export (JSON)</button>
          <button className="btn btn-soft" onClick={actions.seedDemo}>Demo-Daten laden</button>
        </div>
        <div className="action-row" style={{ marginTop: 8 }}>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm('Wirklich alle Daten löschen?')) actions.reset()
            }}
          >
            Alle Daten löschen
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card__header"><h2>Über Calira</h2></div>
        <p className="muted">
          MVP-Web-Version. Tracking für chronische Kopfschmerzen — drei Check-ins pro Tag,
          Medikamente, Schübe und ein Tagesverlauf.
        </p>
      </section>
    </>
  )
}
