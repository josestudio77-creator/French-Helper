// sw.js - Service Worker V906 (Modular JS architecture)
const CACHE_NAME = 'french-fun-v931'; // Bumped: force UI updates on mobile
const urlsToCache = [
  './',
  './index.html?v=931',
  './style.css?v=931',
  './manifest.json',
  './icon.png',
  './KGPrimaryPenmanshipAlt.woff2',
  './js/storage.js?v=931',
  './js/speechcache.js?v=931',
  './js/config.js?v=931',
  './js/state.js?v=931',
  './js/audio.js?v=931',
  './js/ai.js?v=931',
  './js/ui.js?v=931',
  './js/homework.js?v=931',
  './js/game.js?v=931',
  './js/print.js?v=931',
  './js/spelling.js?v=931',
  './js/ocr.js?v=931',
  './js/main.js?v=931'
];

// Install event - cache files
self.addEventListener('install', event => {
  self.skipWaiting(); // Forces the new code to take over immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches (Crucial for fixing the "Star Icon" bug)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - NETWORK FIRST
// This ensures your fixes to the dictionary appear immediately.
self.addEventListener('fetch', event => {
  // Only handle GET requests for our own origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If network is available, update the cache and return
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), use the cache
        return caches.match(event.request);
      })
  );
});

