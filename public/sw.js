self.addEventListener('install', (e) => {
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
})

// Cache strategy
const CACHE = 'sd-static-v3'
const ASSETS = ['/','/index.html']

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET') return
  if (url.origin !== location.origin) return

  // Network-first for documents to avoid stale app shell
  if (req.destination === 'document'){
    event.respondWith((async () => {
      try{
        const res = await fetch(req, { cache: 'no-store' })
        const cache = await caches.open(CACHE)
        cache.put(req, res.clone())
        return res
      }catch{
        const cache = await caches.open(CACHE)
        const cached = await cache.match(req)
        return cached || caches.match('/')
      }
    })())
    return
  }

  // Stale-while-revalidate for scripts/styles
  if (req.destination === 'script' || req.destination === 'style'){
    event.respondWith((async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(req)
      const network = fetch(req).then(res => { if(res.ok) cache.put(req, res.clone()); return res })
      return cached || network
    })())
    return
  }
})


