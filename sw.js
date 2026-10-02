/* sw.js – Offline-Betrieb von ChemLab.
   Die App ist eine einzige Datei (index.html) plus Symbole. Alles wird beim ersten Besuch gespeichert.
   Danach startet die App sofort aus dem Speicher; ist Internet da, wird im Hintergrund nach einer
   neuen Version gesucht und diese beim nächsten Öffnen verwendet. */
const CACHE = "chemlab-e2b1708e28";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./maskable-512.png", "./apple-touch-icon.png", "./favicon-32.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("chemlab-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate";
  const key = isPage ? "./index.html" : req;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(req, isPage ? { cache: "no-cache" } : undefined).then((res) => {
      if (res && res.ok && !isPage) c.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || (isPage ? c.match("./index.html") : Response.error());
  }));
});
