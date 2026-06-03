/* Calira service worker — bumping CACHE invalidates the old shell. */
const CACHE = 'calira-v4'
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './calira-icon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting()
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const targetUrl = e.notification.data?.url || './'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((all) => {
      // Reuse an existing tab if one is already open
      const existing = all.find((c) => c.url.includes(targetUrl))
      if (existing) return existing.focus()
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    })
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  // Navigations & the HTML shell: network-first, fall back to cache.
  // This means index.html and the bundled assets it pulls in get refreshed
  // whenever the user has network.
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put('./index.html', copy))
        return res
      }).catch(() => caches.match('./index.html'))
    )
    return
  }

  // Hashed assets (Vite emits content-hashed filenames in /assets/): cache-first,
  // network fallback that gets cached.
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      }).catch(() => cached)
    })
  )
})
