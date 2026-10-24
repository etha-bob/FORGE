const CACHE = 'forge-v2-2026-10-24';
const CORE = [
  './', './index.html', './forge-core.js', './manifest.webmanifest',
  './assets/icon-192.png', './assets/icon-512.png',
  './assets/exercises/arnold-press-finish.jpg', './assets/exercises/arnold-press-start.jpg',
  './assets/exercises/bicep-curl-finish.jpg', './assets/exercises/bicep-curl-start.jpg',
  './assets/exercises/bulgarian-split-squat-finish.jpg', './assets/exercises/bulgarian-split-squat-start.jpg',
  './assets/exercises/calf-raise-finish.jpg', './assets/exercises/calf-raise-start.jpg',
  './assets/exercises/chest-supported-row-finish.jpg', './assets/exercises/chest-supported-row-start.jpg',
  './assets/exercises/flat-db-bench-finish.jpg', './assets/exercises/flat-db-bench-start.jpg',
  './assets/exercises/goblet-squat-finish.jpg', './assets/exercises/goblet-squat-start.jpg',
  './assets/exercises/hammer-curl-finish.jpg', './assets/exercises/hammer-curl-start.jpg',
  './assets/exercises/hanging-leg-raise-finish.jpg', './assets/exercises/hanging-leg-raise-start.jpg',
  './assets/exercises/hip-thrust-finish.jpg', './assets/exercises/hip-thrust-start.jpg',
  './assets/exercises/incline-db-press-finish.jpg', './assets/exercises/incline-db-press-start.jpg',
  './assets/exercises/lateral-raise-finish.jpg', './assets/exercises/lateral-raise-start.jpg',
  './assets/exercises/one-arm-row-finish.jpg', './assets/exercises/one-arm-row-start.jpg',
  './assets/exercises/overhead-triceps-finish.jpg', './assets/exercises/overhead-triceps-start.jpg',
  './assets/exercises/plank-finish.jpg', './assets/exercises/plank-start.jpg',
  './assets/exercises/pull-up-finish.jpg', './assets/exercises/pull-up-start.jpg',
  './assets/exercises/pullover-finish.jpg', './assets/exercises/pullover-start.jpg',
  './assets/exercises/reverse-lunge-finish.jpg', './assets/exercises/reverse-lunge-start.jpg',
  './assets/exercises/romanian-deadlift-finish.jpg', './assets/exercises/romanian-deadlift-start.jpg',
  './assets/exercises/single-leg-rdl-finish.jpg', './assets/exercises/single-leg-rdl-start.jpg',
  './assets/exercises/shoulder-press-finish.jpg', './assets/exercises/shoulder-press-start.jpg',
  './assets/exercises/skull-crusher-finish.jpg', './assets/exercises/skull-crusher-start.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok && new URL(event.request.url).origin === location.origin) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
