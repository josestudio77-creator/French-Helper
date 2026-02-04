// sw.js - Service Worker V31
const CACHE_NAME = 'french-helper-v31';
const urlsToCache = ['./', './index.html', './icon.png', './manifest.json'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); }))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => { if (e.request.url.startsWith(self.location.origin)) { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); } else { e.respondWith(fetch(e.request)); } });
