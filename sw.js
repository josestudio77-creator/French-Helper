// sw.js - Service Worker V11
const CACHE_NAME = 'french-helper-v11';
const urlsToCache = ['./', './index.html', './icon.png', './manifest.json'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200 && event.request.method === 'GET') {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (!event.request.url.includes('mymemory')) cache.put(event.request, copy);
        });
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([self.clients.claim(), caches.keys().then(keys => {
    return Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }));
  })]));
});
