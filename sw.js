const CACHE_NAME = "mtu-cup-v1";

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.add("./");
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(async () => {
                return await caches.match("./");
            })
        );
    }
});
