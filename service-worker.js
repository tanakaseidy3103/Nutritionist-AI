const CACHE_NAME = 'nutritionist-ai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/camera.js',
  '/main.js',
  '/openai.js',
  '/voice.js',
  '/history.js',
  '/manifest.json',
  '/favicon-192.png',
  '/favicon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME && caches.delete(key))
    ))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
