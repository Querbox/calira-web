function open(section) {
  window.dispatchEvent(new CustomEvent('calira:open-legal', { detail: section }))
}

export default function LegalFooter() {
  return (
    <footer className="legal-footer">
      <button onClick={() => open('imprint')}>Impressum</button>
      <span>·</span>
      <button onClick={() => open('privacy')}>Datenschutz</button>
      <span>·</span>
      <button onClick={() => open('disclaimer')}>Medizinischer Hinweis</button>
    </footer>
  )
}
