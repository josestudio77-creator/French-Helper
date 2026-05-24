// sw.js - Service Worker V999 (Modular JS architecture)
const CACHE_NAME = 'french-fun-v999'; // Bumped: force UI updates on mobile
const urlsToCache = [
  './',
  './index.html?v=999',
  './style.css?v=999',
  './manifest.json',
  './icon.png',
  './backpack.webp?v=999',
  './Practice.png?v=999',
  './presets.webp?v=999',
  './game.webp?v=999',
  './parent.webp?v=999',
  './KGPrimaryPenmanshipAlt.woff2',
  './js/storage.js?v=999',
  './js/speechcache.js?v=999',
  './js/config.js?v=999',
  './js/state.js?v=999',
  './js/audio.js?v=999',
  './js/ai.js?v=999',
  './js/ui.js?v=999',
  './js/homework.js?v=999',
  './js/game.js?v=999',
  './js/print.js?v=999',
  './js/spelling.js?v=999',
  './js/ocr.js?v=999',
  './js/main.js?v=999'
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

