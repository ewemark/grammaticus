/* Grammaticus Service Worker — network-first for navigation & API, stale-while-revalidate for assets */
const CACHE = 'grammaticus-v2'
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/favicon.svg', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache API calls — always live data
  if (url.pathname.startsWith('/api/')) return

  // Navigation (page loads): network-first, fall back to cached shell when offline
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy))
          return resp
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    )
    return
  }

  // Same-origin static assets: stale-while-revalidate (instant load, fresh in background)
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((resp) => {
            if (resp.ok) {
              const copy = resp.clone()
              caches.open(CACHE).then((c) => c.put(request, copy))
            }
            return resp
          })
          .catch(() => cached)
        return cached || network
      })
    )
  }
})
