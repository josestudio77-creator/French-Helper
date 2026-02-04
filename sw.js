// sw.js - Service Worker V29
const CACHE_NAME = 'french-helper-v29';
const urlsToCache = ['./', './index.html', './icon.png', './manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // SECURITY FIX: Only cache files from our own origin (GitHub)
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        return cached || fetch(e.request).then(response => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          }
          return response;
        });
      })
    );
  } else {
    // External APIs (Translations) are fetched but not cached in the SW 
    // (We save them in LocalStorage instead)
    e.respondWith(fetch(e.request));
  }
});
