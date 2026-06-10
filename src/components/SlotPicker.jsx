import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { painColor, painLabel, painTypeLabel, slotMeta } from '../lib/pain'
import { useDragDownToDismiss } from '../lib/useSwipe'
import Icon from './Icon'

const SLOT_ICON = { morning: 'sun', midday: 'cloud', evening: 'moon' }

export default function SlotPicker({ slotId, entries, onNewEntry, onEditEntry, onClose }) {
  const sheetRef = useRef(null)
  const meta = slotMeta(slotId)

  useDragDownToDismiss(sheetRef, {
    onDrag: (dy) => { if (sheetRef.current) sheetRef.current.style.transform = `translateY(${dy}px)` },
    onRelease: (dy) => {
      const el = sheetRef.current
      if (!el) return
      el.style.transform = ''
      if (dy > 140) onClose()
    },
  })

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp)

  return createPortal((
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" data-sheet-handle />

        <div className="sheet__head" data-sheet-handle>
          <div>
            <div className="sheet__eyebrow">
              <Icon name={SLOT_ICON[slotId]} size={12} />
              {meta?.label} ({meta?.desc}) · {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'}
            </div>
            <h2 className="sheet__title">
              Wie hat sich der <em>Schmerz verändert?</em>
            </h2>
          </div>
          <button className="sheet__close" onClick={onClose} aria-label="Schließen">×</button>
        </div>

        <div className="sheet__body">
          <p className="muted" style={{ fontSize: 13 }}>
            Dein Schmerz schwankt? Leg einen <em>neuen Moment</em> an statt einen bestehenden zu überschreiben.
          </p>

          <button className="slot-picker__primary" onClick={onNewEntry}>
            <div className="slot-picker__primary-icon">
              <Icon name="spark" size={16} />
            </div>
            <div className="slot-picker__primary-body">
              <div className="slot-picker__primary-title">Neuen Moment eintragen</div>
              <div className="slot-picker__primary-sub">jetzt — als zusätzlichen Check-in</div>
            </div>
            <Icon name="arrow" size={14} />
          </button>

          <div className="field-label" style={{ marginTop: 14 }}>
            Bisher in {meta?.label}
          </div>
          <ul className="entries">
            {sorted.map((c) => (
              <li key={c.id}>
                <button className="entry entry--button" onClick={() => onEditEntry(c)}>
                  <span className="entry__time">
                    {new Date(c.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <div className="entry__title" style={{ color: painColor(c.painLevel) }}>
                      {painLabel(c.painLevel)}{c.dominantTypes?.length || c.dominantType ? `, ${painTypeLabel(c.dominantTypes || c.dominantType)}` : ''}
                    </div>
                    <div className="entry__meta">bearbeiten oder löschen</div>
                  </div>
                  <span className="entry__num" style={{ color: painColor(c.painLevel) }}>{c.painLevel}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  ), document.body)
}
