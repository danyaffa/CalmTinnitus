// /public/sw.js

self.addEventListener("install", (event) => {
  // You can pre-cache files here if you want
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  clients.claim();
});

// Very simple "network first" fetch handler
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        return response || new Response("Offline", { status: 503 });
      });
    })
  );
});
