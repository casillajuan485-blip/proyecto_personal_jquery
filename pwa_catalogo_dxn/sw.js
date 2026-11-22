// [PROXY OFFLINE / SERVICE WORKER]
// Cachea el cascarón de la PWA, los archivos JSON, íconos y fotos para funcionar sin conexión.
const prefijo = "dxn-catalogo:" + self.registration.scope;
const cacheBase = prefijo + ":base-v6-45";
const cacheFotos = prefijo + ":fotos-v1";

const archivos = [
  "./index.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/vistas.css",
  "./css/responsivo.css",
  "./datos/cafes.json",
  "./datos/bebidas.json",
  "./datos/alimentos.json",
  "./datos/suplementos.json",
  "./datos/contacto.json",
  "./img/icono-192.png",
  "./img/icono-512.png",
  "./img/logo-dxn.png",
  "./js/inicio.js",
  "./js/modulos/dom.js",
  "./js/modulos/datos.js",
  "./js/modulos/whatsapp.js",
  "./js/modulos/catalogo.js",
  "./js/modulos/detalle.js",
  "./js/modulos/contacto.js",
  "./js/modulos/metricas.js",
  "./js/modulos/respaldo.js",
  "./vendor/jquery.js",
  "./vendor/dompurify.js",
  "./vendor/web-vitals.js",
];

// [INSTALACIÓN] Precarga los recursos críticos en Cache Storage.
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(cacheBase).then((cache) => cache.addAll(archivos)))
);

// [ACTIVACIÓN] Elimina versiones antiguas de caché para evitar archivos obsoletos.
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      for (const clave of await caches.keys()) {
        if (clave.startsWith(prefijo + ":") && ![cacheBase, cacheFotos].includes(clave)) {
          await caches.delete(clave);
        }
      }
      await self.clients.claim();
    })()
  )
);

async function estrategiaLocal(solicitud) {
  const cache = await caches.open(cacheBase);
  if (solicitud.url.includes("/datos/")) {
    try {
      const respuesta = await fetch(solicitud, { signal: AbortSignal.timeout(3200) });
      if (respuesta.ok) {
        try {
          await cache.put(solicitud, respuesta.clone());
        } catch {}
        return respuesta;
      }
    } catch {}
    return (await cache.match(solicitud)) ?? Response.error();
  }
  if (solicitud.mode === "navigate") {
    try {
      return await fetch(solicitud, { signal: AbortSignal.timeout(3200) });
    } catch {
      return (await cache.match("./index.html")) ?? Response.error();
    }
  }
  return (await cache.match(solicitud)) ?? fetch(solicitud);
}

async function estrategiaDiferida(solicitud) {
  const cache = await caches.open(cacheFotos);
  const guardada = await cache.match(solicitud);
  if (guardada) return guardada;
  try {
    const respuesta = await fetch(solicitud);
    if (respuesta.ok || respuesta.type === "opaque") {
      try {
        await cache.put(solicitud, respuesta.clone());
        const claves = await cache.keys();
        for (const antigua of claves.slice(0, Math.max(0, claves.length - 80))) {
          await cache.delete(antigua);
        }
      } catch {}
    }
    return respuesta;
  } catch {
    return Response.error();
  }
}

// [INTERCEPTOR FETCH] Sirve recursos locales, imágenes de DXN y Web Vitals offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (
    e.request.destination === "image" &&
    (url.href.startsWith(self.registration.scope) ||
      ["www.dxn2u.com", "eworld2.dxn2u.com"].includes(url.hostname))
  ) {
    e.respondWith(estrategiaDiferida(e.request));
  } else if (url.href.startsWith(self.registration.scope)) {
    e.respondWith(estrategiaLocal(e.request));
  } else if (url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(estrategiaDiferida(e.request));
  }
});
