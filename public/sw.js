const CACHE_VERSION = "v2";

// Force activate immediately, replacing old SW
self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  // Clear all old caches
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.map(function (name) {
          return caches.delete(name);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Network-first: always fetch from network, never serve stale cache
self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request));
});
