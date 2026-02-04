// sw.js - Service Worker V60 (Force Refresh Edition)
const CACHE_NAME = 'french-helper-v60'; // Jump to V60 to ensure update
const urlsToCache = [
  './',
  './index.html',
  './icon.png',
  './manifest.json'
];

// Install event - force immediate takeover
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event - delete ALL old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - NETWORK FIRST strategy
// This ensures that when you have internet, the phone gets the newest code from GitHub.
self.addEventListener('fetch', e => {
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          // If the internet works, update the cache with the new file
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          return response;
        })
        .catch(() => {
          // If internet fails (offline), use the cache
          return caches.match(e.request);
        })
    );
  } else {
    // For external things like translations, just use network
    e.respondWith(fetch(e.request));
  }
});
