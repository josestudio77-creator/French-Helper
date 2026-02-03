// sw.js - Service Worker V12 (Improved)
const CACHE_NAME = 'french-helper-v12';
const urlsToCache = ['./', './index.html', './icon.png', './manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if (k !== CACHE_NAME) {
          console.log('Deleting old cache:', k);
          return caches.delete(k);
        }
      })
    ))
  );
});

self.addEventListener('fetch', e => {
  // Always try network first for API calls (translations)
  if (e.request.url.includes('mymemory.translated.net')) {
    return; // Let browser handle API requests normally
  }
  
  // For app files: try cache first, then network
  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        // Return cached version if found
        if (cached) return cached;
        
        // Otherwise fetch from network
        return fetch(e.request)
          .then(networkResponse => {
            // Don't cache API responses or non-GET requests
            if (!networkResponse || networkResponse.status !== 200 || 
                e.request.method !== 'GET') {
              return networkResponse;
            }
            
            // Cache successful responses
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(e.request, responseClone));
            
            return networkResponse;
          })
          .catch(() => {
            // If network fails and no cache, return offline fallback
            if (e.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
