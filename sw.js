// sw.js - Service Worker V987 (Modular JS architecture)
const CACHE_NAME = 'french-fun-v987'; // Bumped: force UI updates on mobile
const urlsToCache = [
  './',
  './index.html?v=987',
  './style.css?v=987',
  './manifest.json',
  './icon.png',
  './backpack.webp?v=987',
  './Practice.png?v=987',
  './presets.webp?v=987',
  './game.webp?v=987',
  './parent.webp?v=987',
  './KGPrimaryPenmanshipAlt.woff2',
  './js/storage.js?v=987',
  './js/speechcache.js?v=987',
  './js/config.js?v=987',
  './js/state.js?v=987',
  './js/audio.js?v=987',
  './js/ai.js?v=987',
  './js/ui.js?v=987',
  './js/homework.js?v=987',
  './js/game.js?v=987',
  './js/print.js?v=987',
  './js/spelling.js?v=987',
  './js/ocr.js?v=987',
  './js/main.js?v=987'
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

