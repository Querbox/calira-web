import { useState } from 'react'
import { actions } from '../lib/store'

const COMMON = ['Ibuprofen 400', 'Paracetamol 500', 'Sumatriptan 50', 'ASS 500', 'Naproxen 500']
const EFFECTS = ['gut', 'mäßig', 'kein Effekt', 'zu früh']

export default function MedicationSheet({ onClose }) {
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('1 Tablette')
  const [effect, setEffect] = useState('zu früh')

  function submit() {
    if (!name.trim()) return
    actions.addMedication({ medicationName: name.trim(), dosage, perceivedEffect: effect, isAcute: true })
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__head">
          <div>
            <div className="sheet__eyebrow">Medikament</div>
            <h2 className="sheet__title">Was hast du <em>genommen?</em></h2>
          </div>
          <button className="sheet__close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="sheet__body">
          <div className="field-label">Häufig</div>
          <div className="chips">
            {COMMON.map((m) => (
              <button key={m} className={`chip ${name === m ? 'is-active' : ''}`} onClick={() => setName(m)}>{m}</button>
            ))}
          </div>

          <div className="field-label">Name</div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Ibuprofen 400" />

          <div className="field-label">Dosis</div>
          <input className="input" value={dosage} onChange={(e) => setDosage(e.target.value)} />

          <div className="field-label">Wirkung</div>
          <div className="chips">
            {EFFECTS.map((e) => (
              <button key={e} className={`chip ${effect === e ? 'is-active' : ''}`} onClick={() => setEffect(e)}>{e}</button>
            ))}
          </div>
        </div>

        <div className="sheet__actions">
          <button className="btn btn-ghost" onClick={onClose}>abbrechen</button>
          <button className="btn btn-primary" onClick={submit} disabled={!name.trim()}>eintragen ✓</button>
        </div>
      </div>
    </div>
  )
}
