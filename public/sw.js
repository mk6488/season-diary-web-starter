self.addEventListener('install', (e) => {
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

// Cache-first for static assets
const CACHE = 'sd-static-v1'
const ASSETS = ['/','/index.html']

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET') return
  if (url.origin !== location.origin) return
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(req)
    if (cached) return cached
    const res = await fetch(req)
    if (res.ok && (req.destination === 'style' || req.destination === 'script' || req.destination === 'document')){
      cache.put(req, res.clone())
    }
    return res
  })())
})


