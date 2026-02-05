// sw.js - Service Worker V100
const CACHE_NAME = 'french-helper-v100'; // This is the version you asked about
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
self.addEventListener('fetch', e => {
  if (e.request.url.startsWith(self.location.origin)) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(fetch(e.request));
  }
});
