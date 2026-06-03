import { useEffect, useRef } from 'react'
import Icon from '../components/Icon'

const STAND = '3. Juni 2026'

export default function Legal({ section = 'imprint', onClose }) {
  const imprintRef = useRef(null)
  const privacyRef = useRef(null)
  const disclaimerRef = useRef(null)
  const rootRef = useRef(null)

  useEffect(() => {
    const map = { imprint: imprintRef, privacy: privacyRef, disclaimer: disclaimerRef }
    const target = map[section]?.current
    if (target && rootRef.current) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [section])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="legal" ref={rootRef}>
      <header className="legal__bar">
        <button className="legal__close" onClick={onClose} aria-label="Zurück">
          <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
          <span>zurück</span>
        </button>
        <div className="legal__bar-title">Rechtliches</div>
        <div className="legal__bar-spacer" />
      </header>

      <main className="legal__main">
        <header className="page-header">
          <div className="page-header__eyebrow">
            <Icon name="settings" size={13} /> Transparenz
          </div>
          <h1 className="page-header__title">
            Was Calira <em>tut</em> und was nicht.
          </h1>
          <p className="legal__intro">
            Calira ist ein privates Projekt. Es gibt keinen Server, kein Konto, kein Tracking.
            Hier ist trotzdem alles, was du wissen musst — kurz und ehrlich.
          </p>
        </header>

        <div className="legal__toc">
          <button onClick={() => imprintRef.current?.scrollIntoView({ behavior: 'smooth' })}>Impressum</button>
          <button onClick={() => privacyRef.current?.scrollIntoView({ behavior: 'smooth' })}>Datenschutz</button>
          <button onClick={() => disclaimerRef.current?.scrollIntoView({ behavior: 'smooth' })}>Medizinischer Hinweis</button>
        </div>

        {/* ───────── IMPRESSUM ───────── */}
        <section ref={imprintRef} className="legal__section">
          <h2 className="legal__h2">Impressum</h2>
          <p className="legal__meta">Angaben gemäß § 5 TMG</p>

          <div className="legal__card">
            <p>
              Fabian Eichinger<br />
              Gutleuthausstr. 1<br />
              72379 Hechingen<br />
              Deutschland
            </p>
            <p>
              <em>E-Mail:</em>{' '}
              <a href="mailto:fabian.eichinger.privat@gmail.com">fabian.eichinger.privat@gmail.com</a>
            </p>
          </div>

          <h3 className="legal__h3">Verantwortlich für den Inhalt</h3>
          <p>nach § 18 Abs. 2 MStV: Fabian Eichinger (Anschrift wie oben).</p>

          <h3 className="legal__h3">Haftung für Inhalte</h3>
          <p>
            Calira ist ein nicht-kommerzielles Hobby-Projekt. Die Inhalte werden mit Sorgfalt erstellt,
            für Richtigkeit, Vollständigkeit und Aktualität kann jedoch keine Gewähr übernommen werden.
            Eine Haftung für Schäden, die aus der Nutzung der Anwendung entstehen, ist —
            soweit gesetzlich zulässig — ausgeschlossen.
          </p>

          <h3 className="legal__h3">Haftung für Links</h3>
          <p>
            Calira enthält keine externen Links zu Drittinhalten. Sollten in zukünftigen Versionen
            Links eingefügt werden, gilt: Für die Inhalte externer Seiten ist ausschließlich der jeweilige
            Anbieter verantwortlich.
          </p>

          <h3 className="legal__h3">Urheberrecht</h3>
          <p>
            Code und Inhalte unterliegen dem deutschen Urheberrecht. Calira ist als
            Open-Source-Projekt auf{' '}
            <a href="https://github.com/Querbox/calira-web" target="_blank" rel="noopener noreferrer">GitHub</a>{' '}
            einsehbar.
          </p>
        </section>

        {/* ───────── DATENSCHUTZ ───────── */}
        <section ref={privacyRef} className="legal__section">
          <h2 className="legal__h2">Datenschutzerklärung</h2>
          <p className="legal__meta">Stand: {STAND}</p>

          <p>
            Diese Erklärung beschreibt, welche Daten Calira verarbeitet. Sie erfüllt die Informationspflichten
            nach <em>Art. 13 DSGVO</em>.
          </p>

          <h3 className="legal__h3">1. Verantwortlicher</h3>
          <p>
            Fabian Eichinger, Gutleuthausstr. 1, 72379 Hechingen, Deutschland.{' '}
            E-Mail: <a href="mailto:fabian.eichinger.privat@gmail.com">fabian.eichinger.privat@gmail.com</a>
          </p>

          <h3 className="legal__h3">2. Was Calira <em>nicht</em> tut</h3>
          <ul className="legal__list">
            <li>Calira hat <em>keinen Server</em>. Es gibt keine Datenbank, kein Konto, kein Login.</li>
            <li>
              Deine Gesundheitsdaten (Check-ins, Schmerz, Medikamente, Schübe, Notizen) verlassen
              <em> niemals deinen Browser</em>. Sie liegen ausschließlich im LocalStorage deines Geräts.
            </li>
            <li>Es gibt <em>kein Tracking</em>, keine Analytics, keine Cookies von Drittanbietern, keine Werbung.</li>
            <li>Es gibt <em>keine Newsletter</em> und keinerlei Profilbildung.</li>
          </ul>

          <h3 className="legal__h3">3. Was Calira tut — vollständige Liste</h3>

          <div className="legal__data-row">
            <div className="legal__data-row-title">Hosting bei GitHub Pages</div>
            <p>
              Diese Webseite wird auf <em>GitHub Pages</em> (GitHub, Inc., 88 Colin P Kelly Jr Street,
              San Francisco, CA 94107, USA) gehostet. Beim Aufruf werden technisch notwendige Daten
              automatisch verarbeitet, insbesondere:
            </p>
            <ul className="legal__list">
              <li>deine <em>IP-Adresse</em></li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Browser- und Geräteinformationen (User-Agent)</li>
              <li>aufgerufene Ressource</li>
            </ul>
            <p>
              Diese Daten werden von GitHub für Sicherheits- und Betriebszwecke verarbeitet — Calira selbst
              hat keinen Zugriff darauf. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
              am Betrieb der Webseite). Es besteht ein Datentransfer in die USA; GitHub stützt diesen auf die
              EU-Standardvertragsklauseln. Mehr dazu in der{' '}
              <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                 target="_blank" rel="noopener noreferrer">GitHub Privacy Policy</a>.
            </p>
          </div>

          <div className="legal__data-row">
            <div className="legal__data-row-title">Wetterdaten von Open-Meteo (optional)</div>
            <p>
              Wenn du im Check-in oder im Tagesverlauf das Wetter aktivierst, geschieht Folgendes:
            </p>
            <ul className="legal__list">
              <li>
                Dein Browser fragt deinen <em>ungefähren Standort</em> ab
                (Geolocation-API — du musst explizit zustimmen).
              </li>
              <li>
                Die Koordinaten (Breitengrad/Längengrad) werden an{' '}
                <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a>{' '}
                (Open-Meteo, Bremgarten BE, Schweiz) gesendet, um Druck-, Temperatur- und Wettercode-Werte
                abzurufen.
              </li>
              <li>
                Open-Meteo erhebt nach eigenen Angaben <em>keine personenbezogenen Daten</em> dauerhaft;
                es werden keine Cookies gesetzt und keine API-Keys benötigt.
                Siehe <a href="https://open-meteo.com/en/terms" target="_blank" rel="noopener noreferrer">open-meteo.com/en/terms</a>.
              </li>
              <li>
                Lehnst du die Standortfreigabe ab, funktioniert Calira normal weiter — nur ohne Wetter.
              </li>
            </ul>
            <p>
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (deine Einwilligung durch Erteilen der Standortfreigabe).
            </p>
          </div>

          <div className="legal__data-row">
            <div className="legal__data-row-title">LocalStorage / SessionStorage</div>
            <p>
              Alle deine Einträge sowie Einstellungen (Farbthema, Schriftpaarung,
              Benachrichtigungs-Präferenzen) liegen ausschließlich in deinem Browser-Speicher.
              Diese Daten werden <em>nicht übertragen</em>. Sie bleiben so lange erhalten, bis du sie
              in Calira selbst löschst oder den Browser-Speicher leerst.
            </p>
          </div>

          <div className="legal__data-row">
            <div className="legal__data-row-title">Service Worker (Offline-Funktion)</div>
            <p>
              Calira registriert einen Service Worker, der Dateien lokal zwischenspeichert, damit
              die App offline funktioniert und schnell lädt. Dabei werden keinerlei personenbezogene
              Daten verarbeitet — nur App-Code und Icons werden gecached.
            </p>
          </div>

          <div className="legal__data-row">
            <div className="legal__data-row-title">Benachrichtigungen (optional)</div>
            <p>
              Wenn du Benachrichtigungen aktivierst, fragt Calira die Browser-Berechtigung dafür an.
              Es handelt sich um <em>lokale Benachrichtigungen</em>, die ausschließlich aus deinem
              Browser heraus angezeigt werden. Es gibt keinen Push-Server und keine Übermittlung an Dritte.
            </p>
          </div>

          <h3 className="legal__h3">4. Deine Rechte</h3>
          <p>Du hast nach DSGVO folgende Rechte:</p>
          <ul className="legal__list">
            <li>Auskunft (Art. 15)</li>
            <li>Berichtigung (Art. 16)</li>
            <li>Löschung (Art. 17) — alle Gesundheitsdaten kannst du in Calira jederzeit unter „Daten → Alle Daten löschen" entfernen</li>
            <li>Einschränkung der Verarbeitung (Art. 18)</li>
            <li>Datenübertragbarkeit (Art. 20) — Export als JSON ist in Calira eingebaut</li>
            <li>Widerspruch (Art. 21)</li>
            <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77)</li>
          </ul>
          <p>
            Für Anfragen wende dich an die im Impressum angegebene E-Mail-Adresse.
          </p>

          <h3 className="legal__h3">5. Datensicherheit</h3>
          <p>
            Die Verbindung ist mit HTTPS verschlüsselt (TLS). Eingegebene Gesundheitsdaten verlassen
            dein Gerät jedoch ohnehin nicht.
          </p>
        </section>

        {/* ───────── DISCLAIMER ───────── */}
        <section ref={disclaimerRef} className="legal__section">
          <h2 className="legal__h2">Medizinischer Hinweis</h2>
          <p className="legal__meta">Wichtig — bitte lesen.</p>

          <div className="legal__notice">
            <Icon name="bolt" size={16} />
            <div>
              <strong>Calira ist kein Medizinprodukt.</strong> Es ist ein digitales Tagebuch und ersetzt
              keine ärztliche Diagnose, Beratung oder Behandlung.
            </div>
          </div>

          <p>
            Die Anwendung dient ausschließlich dazu, dir das Erfassen deiner eigenen Beobachtungen
            (Schmerz, Medikamente, Trigger, Wetter) zu erleichtern und dir Muster über die Zeit sichtbar zu
            machen. Die in Calira berechneten Werte — wie etwa die <em>Kopfschmerz-Wahrscheinlichkeit</em> —
            sind <em>statistische Schätzungen aus deinen eigenen Daten</em>, keine medizinischen Prognosen.
          </p>

          <h3 className="legal__h3">Wann du eine*n Ärzt*in aufsuchen solltest</h3>
          <ul className="legal__list">
            <li>plötzliche, ungewohnt starke Kopfschmerzen („Donnerschlag-Kopfschmerz")</li>
            <li>Kopfschmerzen mit Lähmungen, Sprachstörungen, Sehstörungen oder Bewusstseinstrübung</li>
            <li>Kopfschmerzen nach einer Kopfverletzung</li>
            <li>Fieber, Nackensteifigkeit oder Hautausschlag in Verbindung mit Kopfschmerzen</li>
            <li>häufige Einnahme von Akut-Schmerzmitteln (mehr als 10 Tage pro Monat)</li>
            <li>jede deutliche Veränderung deines gewohnten Kopfschmerz-Musters</li>
          </ul>

          <div className="legal__notice legal__notice--strong">
            <Icon name="bolt" size={16} />
            <div>
              <strong>Im Notfall:</strong> Wähle 112 (Deutschland) oder die Notrufnummer deines Landes.
              Calira kann und darf einen Notruf nicht ersetzen.
            </div>
          </div>

          <h3 className="legal__h3">Medikamenten-Übergebrauch-Kopfschmerz</h3>
          <p>
            Wenn Akut-Schmerzmittel über mehrere Monate an mehr als 10 (Triptane, Mischpräparate)
            bzw. 15 Tagen (einfache Analgetika) pro Monat eingenommen werden, kann sich ein eigener
            Kopfschmerz-Typ entwickeln. Calira weist auf diesen Schwellwert hin — diese Hinweise
            sind <em>Erinnerungen</em>, keine Diagnose. Bei Bedarf bitte ärztlich abklären lassen.
          </p>

          <h3 className="legal__h3">Keine Verantwortung für medizinische Entscheidungen</h3>
          <p>
            Entscheidungen über Diagnose, Therapie, Medikamenten-Dosierungen oder das Absetzen von
            Medikamenten triffst du gemeinsam mit deinen behandelnden Ärzt*innen — niemals auf
            Grundlage von Calira allein.
          </p>
        </section>

        <p className="legal__foot">
          Hast du Fragen, einen Hinweis oder einen Fehler entdeckt? Schreib eine kurze E-Mail an{' '}
          <a href="mailto:fabian.eichinger.privat@gmail.com">fabian.eichinger.privat@gmail.com</a>.
        </p>
      </main>
    </div>
  )
}
