const CACHE_NAME = 'nutritionist-ai-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/camera.js',
  '/main.js',
  '/openai.js',
  '/voice.js',
  '/history.js',
  '/firebase.js',
  '/auth.js',
  '/auth-guard.js',
  '/preferences.js',
  '/login.html',
  '/login.js',
  '/register.html',
  '/register.js',
  '/manifest.json',
  '/favicon-192.png',
  '/favicon-512.png'
];

self.addEventListener('install', event => {
  // Ativa imediatamente a nova versão do SW
  self.skipWaiting();
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
  // Garante que os clientes usem este SW imediatamente
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
