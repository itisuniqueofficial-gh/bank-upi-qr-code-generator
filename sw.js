/* UPI QR Code Generator — service worker */
const VERSION = 'v5';

const PRECACHE = [
  './',
  './index.html',
  './css/reset.css',
  './css/variables.css',
  './css/layout.css',
  './css/forms.css',
  './css/utilities.css',
  './css/main.css',
  './css/qr.css',
  './js/app.js',
  './js/utils.js',
  './js/validator.js',
  './js/theme.js',
  './js/clipboard.js',
  './js/download.js',
  './js/qr.js',
  './js/config.js',
  './js/generator.js',
  './js/storage.js',
  './manifest.webmanifest',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
];

const CACHE_NAME = `upi-qr-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
