/* Service worker — Registro Presenze Portieri v1.9.0 */
const VERSION = "1.9.0";
const SHELL_CACHE = `cai-presenze-shell-${VERSION}`;
const DATA_CACHE = `cai-presenze-data-${VERSION}`;
const FONT_CACHE = `cai-presenze-font-${VERSION}`;

const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-maskable.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, DATA_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => keep.includes(k) ? null : caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isFontRequest(url){
  return url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

async function networkFirst(request, cacheName){
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    if(fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch(e) {
    const hit = await cache.match(request);
    if(hit) return hit;
    throw e;
  }
}

async function cacheFirst(request, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if(hit) return hit;
  const fresh = await fetch(request);
  if(fresh && (fresh.ok || fresh.type === "opaque")) cache.put(request, fresh.clone());
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if(request.method !== "GET") return; // gli invii al webhook non passano mai di qui

  const url = new URL(request.url);

  if(isFontRequest(url)){
    event.respondWith(cacheFirst(request, FONT_CACHE).catch(() => fetch(request)));
    return;
  }

  if(url.origin !== self.location.origin) return;

  // config.json e employees.json: sempre la versione più fresca, con ripiego locale
  if(url.pathname.endsWith("config.json") || url.pathname.endsWith("employees.json")){
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  if(request.mode === "navigate"){
    event.respondWith(
      networkFirst(request, SHELL_CACHE)
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    cacheFirst(request, SHELL_CACHE).catch(() => fetch(request))
  );
});
