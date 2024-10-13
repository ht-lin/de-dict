const VERSION = "v1.1.0";
const CACHE_NAME = `De-dictionary-${VERSION}`;

const APP_STATIC_RESOURCES = [
  "./",
  "./index.html",
  "./bootstrap.min.css",
  "./app.js",
  "./loadDict.js",
  "./parseDict.js",
  "./icons/dict.png",
  "./de-de-dict.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll(APP_STATIC_RESOURCES);
    })(),
  );
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map( name => {
          if(name !== CACHE_NAME) {
            return caches.delete(name);
          }
        } ),
      );
      await clients.claim();
    })(),
  );
})

self.addEventListener("fetch", event => {
  if(event.request.mode === "navigate") {
    event.respondWith(caches.match("./"));
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request.url);
      if(cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request.url);
    })(),
  );
})
