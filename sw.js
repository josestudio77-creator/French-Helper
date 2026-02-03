// sw.js - Service Worker V10 (Network-First Strategy)
const CACHE_NAME = 'french-helper-v10'; // Incremented version
const urlsToCache = [
  './',
  './index.html',
  './icon.png',
  './manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  self.skipWaiting(); // Force the new service worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - Network First Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If network works, save to cache and return
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Only cache our local files, not the translation API
            if (!event.request.url.includes('mymemory')) {
              cache.put(event.request, responseToCache);
            }
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), use cache
        return caches.match(event.request);
      })
  );
});

// Activate event - Delete ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control of all open tabs immediately
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});
