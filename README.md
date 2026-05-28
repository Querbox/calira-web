# Calira Web

Web-MVP von Calira – Tracking-App für chronische Kopfschmerzen. Drei Check-ins pro Tag, Medikamente, Schübe, Tagesverlauf. Alle Daten bleiben lokal im Browser (LocalStorage).

🔗 **Live:** https://querbox.github.io/calira-web/

## Stack
- React 19 + Vite
- LocalStorage als Datenspeicher
- Dark theme im warm-rose Stil

## Entwicklung
```bash
npm install
npm run dev
```

## Deploy
Push auf `main` löst Build + Deploy via GitHub Actions auf GitHub Pages aus (siehe `.github/workflows/deploy.yml`).

Pages-Einstellung im Repo muss auf **Source: GitHub Actions** stehen.
