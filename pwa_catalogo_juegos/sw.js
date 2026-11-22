/* Proxy offline. La compilación rellena el inventario de la versión publicada. */
const VERSION = "compacto-3f2cb828";
const ESENCIALES = [
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/maskable-512.png",
  "assets/vendor/bootstrap-icons.css",
  "assets/vendor/bootstrap-icons.woff2",
  "assets/vendor/jquery-3.7.1.min.js",
  "assets/vendor/purify.min.js",
  "css/ajustes-atlas.css",
  "css/base.css",
  "css/componentes-base.css",
  "css/componentes.css",
  "css/layout.css",
  "css/responsivo.css",
  "css/tarjetas.css",
  "datos/colecciones.json",
  "datos/videojuegos.json",
  "index.html",
  "js/app.js",
  "js/componentes/tarjeta-juego.js",
  "js/datos/bitacora-indexeddb.js",
  "js/datos/catalogos.js",
  "js/datos/respaldo-juegos.js",
  "js/datos/respaldo-secciones.js",
  "js/datos/secciones.js",
  "js/datos/vendedor.js",
  "js/interfaz/bitacora.js",
  "js/interfaz/carrusel.js",
  "js/interfaz/catalogo.js",
  "js/interfaz/contactar.js",
  "js/interfaz/hidratacion.js",
  "js/interfaz/modales.js",
  "js/pwa/instalacion.js",
  "js/pwa/metricas.js",
  "js/seguridad/html-seguro.js",
  "js/seguridad/imagen-remota.js",
  "js/utilidades.js",
  "manifest.webmanifest",
  "offline.html"
];
const PREFIJO = "atlaspixel-" + encodeURIComponent(self.registration.scope) + "-";
const CACHE = PREFIJO + VERSION;
const ruta = nombre => new URL(nombre, self.registration.scope).href;

/* Precarga antes de activar. Si falla una descarga, el worker anterior sigue operativo. */
self.addEventListener("install", evento => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ESENCIALES.map(nombre => new Request(ruta(nombre), { cache: "reload" })));
    await self.skipWaiting();
  })());
});

/* La limpieza afecta solo a las versiones anteriores del mismo alcance. */
self.addEventListener("activate", evento => {
  evento.waitUntil((async () => {
    for (const nombre of await caches.keys()) {
      if (nombre.startsWith(PREFIJO) && nombre !== CACHE) await caches.delete(nombre);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("message", evento => {
  if (evento.data?.type === "SKIP_WAITING") evento.waitUntil(self.skipWaiting());
  if (evento.data?.type === "STATUS") evento.source?.postMessage({ type: "OFFLINE_READY" });
});

/* Network-First: el contenido publicado se consulta sin reutilizar el caché HTTP. */
const alcance = new URL(self.registration.scope);
const esenciales = new Set(ESENCIALES.map(ruta));

self.addEventListener("fetch", evento => {
  const peticion = evento.request;
  const url = new URL(peticion.url);
  if (peticion.method !== "GET" || url.origin !== alcance.origin ||
      !url.pathname.startsWith(alcance.pathname) || peticion.headers.has("range")) return;

  const documento = peticion.mode === "navigate";
  const recurso = url.origin + url.pathname;
  const portada = documento && (recurso === alcance.href || recurso === ruta("index.html"));
  const clave = portada ? ruta("index.html") : recurso;
  if (!documento && !esenciales.has(clave)) return;

  evento.respondWith((async () => {
    let cache;
    try { cache = await caches.open(CACHE); } catch { /* Puede estar deshabilitado. */ }
    let respuesta;
    try {
      respuesta = await fetch(peticion, { cache: "no-store" });
      if (respuesta.ok) {
        if (cache && esenciales.has(clave) && respuesta.status === 200 && !respuesta.redirected) {
          try { await cache.put(clave, respuesta.clone()); } catch { /* La red sigue disponible. */ }
        }
        return respuesta;
      }
      if (respuesta.status < 500) return respuesta;
    } catch { /* Sin red: se busca la última respuesta guardada. */ }

    const guardado = esenciales.has(clave) ? await cache?.match(clave) : null;
    if (guardado) return guardado;
    if (respuesta) return respuesta;
    if (documento) {
      const paginaOffline = await cache?.match(ruta("offline.html"));
      if (paginaOffline) return paginaOffline;
    }
    return new Response("Recurso no preparado sin conexión.", { status: 503 });
  })());
});
