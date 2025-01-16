// service-worker.js
const VIDEO_CACHE = 'video-cache-v1';

self.addEventListener('fetch', event => {
    if (event.request.url.endsWith('.mp4')) {
        event.respondWith(
            caches.open(VIDEO_CACHE).then(cache =>
                cache.match(event.request).then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
            )
        );
    }
});

// Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== VIDEO_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});