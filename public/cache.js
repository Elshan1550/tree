// Create a cache name for videos
const VIDEO_CACHE = "video-cache-v1";

// Function to cache videos
async function cacheVideos() {
  const videoUrls = [
    "/videos/background_video.mp4",
    "/videos/welcome_video.mp4",
    "/videos/thank_you_video.mp4"
  ];

  try {
    const cache = await caches.open(VIDEO_CACHE);

    // Check which videos need to be cached
    const cachedUrls = await Promise.all(
      videoUrls.map(async (url) => {
        const match = await cache.match(url);
        return { url, isCached: !!match };
      })
    );

    // Cache only uncached videos
    const urlsToCache = cachedUrls
      .filter((item) => !item.isCached)
      .map((item) => item.url);

    if (urlsToCache.length > 0) {
      console.log("Caching videos:", urlsToCache);
      await Promise.all(
        urlsToCache.map((url) =>
          fetch(url)
            .then((response) => cache.put(url, response))
            .catch((error) => console.error(`Failed to cache ${url}:`, error))
        )
      );
    } else {
      console.log("All videos are already cached");
    }
  } catch (error) {
    console.error("Failed to cache videos:", error);
  }
}

// Function to intercept video requests and serve from cache
async function handleVideoRequest(url) {
  try {
    const cache = await caches.open(VIDEO_CACHE);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      console.log("Serving from cache:", url);
      return cachedResponse;
    }

    console.log("Fetching from network:", url);
    const networkResponse = await fetch(url);
    await cache.put(url, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error("Error handling video request:", error);
    throw error;
  }
}

// Register service worker to handle caching
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("ServiceWorker registered:", registration);
    })
    .catch((error) => {
      console.error("ServiceWorker registration failed:", error);
    });
}

// Initialize caching when the page loads
document.addEventListener("DOMContentLoaded", () => {
  cacheVideos();
});
