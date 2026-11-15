/* OFFLINE: versión coherente, preparación completa y dos descargas simultáneas. */
const VERSION = "2c78923654a57d46";
const PREFIX = "atlaspixel-" + encodeURIComponent(self.registration.scope) + "-";
const CACHE = PREFIX + VERSION;
const FILES = ["./", "app.js", "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/maskable-512.png", "assets/vendor/bootstrap-icons.css", "assets/vendor/bootstrap-icons.woff2", "assets/vendor/jquery-3.7.1.min.js", "catalogo.json", "estilo.css", "index.html", "manifest.webmanifest", "modules/chunk-2DIKP4N2.js", "modules/data-KVRB3A4U.js", "modules/log-view-NZ2N4KNU.js", "offline.html", "assets/images/alyx-scene.webp", "assets/images/alyx-wide.webp", "assets/images/alyx.webp", "assets/images/among-scene.webp", "assets/images/among-wide.webp", "assets/images/among.webp", "assets/images/bg3-scene.webp", "assets/images/bg3-wide.webp", "assets/images/bg3.webp", "assets/images/celeste-scene.webp", "assets/images/celeste-wide.webp", "assets/images/celeste.webp", "assets/images/civilization-scene.webp", "assets/images/civilization-wide.webp", "assets/images/civilization.webp", "assets/images/cuphead-scene.webp", "assets/images/cuphead-wide.webp", "assets/images/cuphead.webp", "assets/images/disco-scene.webp", "assets/images/disco-wide.webp", "assets/images/disco.webp", "assets/images/doom-scene.webp", "assets/images/doom-wide.webp", "assets/images/doom.webp", "assets/images/elden-scene.webp", "assets/images/elden-wide.webp", "assets/images/elden.webp", "assets/images/forza-scene.webp", "assets/images/forza-wide.webp", "assets/images/forza.webp", "assets/images/hades-scene.webp", "assets/images/hades-wide.webp", "assets/images/hades.webp", "assets/images/hifi-scene.webp", "assets/images/hifi-wide.webp", "assets/images/hifi.webp", "assets/images/hollow-scene.webp", "assets/images/hollow-wide.webp", "assets/images/hollow.webp", "assets/images/horizon-scene.webp", "assets/images/horizon-wide.webp", "assets/images/horizon.webp", "assets/images/outer-scene.webp", "assets/images/outer-wide.webp", "assets/images/outer.webp", "assets/images/portal2-scene.webp", "assets/images/portal2-wide.webp", "assets/images/portal2.webp", "assets/images/psychonauts-scene.webp", "assets/images/psychonauts-wide.webp", "assets/images/psychonauts.webp", "assets/images/rdr2-scene.webp", "assets/images/rdr2-wide.webp", "assets/images/rdr2.webp", "assets/images/rocket-scene.webp", "assets/images/rocket-wide.webp", "assets/images/rocket.webp", "assets/images/souls-scene.webp", "assets/images/souls-wide.webp", "assets/images/souls.webp", "assets/images/stardew-scene.webp", "assets/images/stardew-wide.webp", "assets/images/stardew.webp", "assets/images/terraria-scene.webp", "assets/images/terraria-wide.webp", "assets/images/terraria.webp", "assets/images/undertale-scene.webp", "assets/images/undertale-wide.webp", "assets/images/undertale.webp", "assets/images/witcher3-scene.webp", "assets/images/witcher3-wide.webp", "assets/images/witcher3.webp"];
const absolute = (path) => new URL(path, self.registration.scope).href;
async function progress(done) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const c of clients) c.postMessage({ type: "OFFLINE_PROGRESS", done, total: FILES.length });
}
/* INSTALACIÓN: descarga recursos y confirma preparación solo al finalizar. */
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let next = 0, done = 0;
    try {
      await Promise.all(Array.from({ length: 2 }, async () => {
        while (next < FILES.length) {
          const name = FILES[next++], url = absolute(name), response = await fetch(new Request(url, { cache: "reload" }));
          if (!response.ok || response.type === "opaque") throw new Error("Recurso offline no disponible");
          await cache.put(url, response);
          done++;
          if (done % 10 === 0 || done === FILES.length) await progress(done);
        }
      }));
      await cache.put(absolute("__offline_ready__"), new Response("ready"));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});
/* ACTIVACIÓN: limpia cachés propias anteriores cuando no hay varias pestañas. */
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    if (clients.length <= 1) {
      for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
/* MENSAJES: estado offline y actualización solicitada desde la interfaz. */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "STATUS") event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    event.ports[0]?.postMessage({ ready: !!await cache.match(absolute("__offline_ready__")), version: VERSION });
  })());
});
/* PETICIONES: responde desde caché y gestiona recursos no disponibles. */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = event.request.mode === "navigate" ? absolute("index.html") : event.request;
    const saved = await cache.match(key);
    if (saved) return saved;
    try {
      const response = await fetch(event.request);
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response;
    } catch {
      if (event.request.mode === "navigate") return await cache.match(absolute("offline.html")) || new Response("Atlas Pixel no est\xE1 listo offline.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      return new Response("Recurso no disponible sin conexi\xF3n", { status: 503 });
    }
  })());
});
