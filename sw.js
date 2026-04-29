/* =========================================================
   TrainFlow – Service Worker
   Strategie: Cache-First für alle App-Ressourcen
   ========================================================= */

const CACHE_NAME = 'trainflow-v2';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './sw.js',
  './manifest.json',
  './icon.svg'
];

// Installation: Cache-Dateien vorladen
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.warn('Nicht alle Ressourcen gecacht:', err);
      });
    })
  );
  self.skipWaiting();
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Cache-First, dann Netzwerk
self.addEventListener('fetch', e => {
  // Nur GET-Anfragen cachen
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      
      return fetch(e.request).then(response => {
        // Nur valide Responses cachen
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, toCache));
        return response;
      }).catch(() => {
        // Offline-Fallback für HTML-Seiten
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
