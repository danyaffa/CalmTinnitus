// /public/sw.js — CalmTinnitus Service Worker

const CACHE_NAME = "calmtinnitus-v1";
const OFFLINE_URL = "/offline.html";

// Assets to pre-cache on install
const PRE_CACHE = [
  "/",
  "/offline.html",
  "/CalmTinnitus-Logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy with cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API calls and Firebase requests
  if (
    request.url.includes("/api/") ||
    request.url.includes("firestore.googleapis.com") ||
    request.url.includes("firebase") ||
    request.url.includes("googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Serve from cache, or offline page for navigation requests
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});
