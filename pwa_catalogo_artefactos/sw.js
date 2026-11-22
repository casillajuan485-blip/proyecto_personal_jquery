/**
 * SERVICE WORKER (PROXY OFFLINE): sw.js
 * RESPONSABILIDAD:
 *  - Cachear HTML, CSS, módulos JS, librerías, iconos, datos JSON e imágenes locales.
 *  - Permitir funcionamiento completo sin conexión (offline) tras la primera carga.
 *  - Limpiar cachés antiguas cuando cambia VERSION.
 */

const VERSION = "luminatech-v7-defensa-1";

const RECURSOS = [
  ".nojekyll",
  "index.html",
  "manifest.webmanifest",
  "datos-guia.md",
  "css/base.css",
  "css/pantallas.css",
  "css/responsivo.css",
  "datos/cables.json",
  "datos/focos.json",
  "datos/lamparas.json",
  "datos/negocio.json",
  "datos/respaldo/cables.json",
  "datos/respaldo/focos.json",
  "datos/respaldo/lamparas.json",
  "datos/respaldo/negocio.json",
  "iconos/icono-192.png",
  "iconos/icono-512.png",
  "imagenes/cables.webp",
  "imagenes/colgante.webp",
  "imagenes/focos.webp",
  "imagenes/lamparas.webp",
  "imagenes/mapa.webp",
  "imagenes/mesa.webp",
  "imagenes/mimbre.webp",
  "imagenes/portada-movil.webp",
  "imagenes/portada.webp",
  "imagenes/productos/c01.jpg",
  "imagenes/productos/c02.jpg",
  "imagenes/productos/c03.jpg",
  "imagenes/productos/c04.jpg",
  "imagenes/productos/c05.jpg",
  "imagenes/productos/c06.jpg",
  "imagenes/productos/c07.jpg",
  "imagenes/productos/c08.jpg",
  "imagenes/productos/c09.jpg",
  "imagenes/productos/f01.jpg",
  "imagenes/productos/f02.jpg",
  "imagenes/productos/f03.jpg",
  "imagenes/productos/f04.jpg",
  "imagenes/productos/f05.jpg",
  "imagenes/productos/f06.jpg",
  "imagenes/productos/f07.jpg",
  "imagenes/productos/f08.jpg",
  "imagenes/productos/f09.jpg",
  "imagenes/productos/f10.jpg",
  "imagenes/productos/lp01.jpg",
  "imagenes/productos/lp02.jpg",
  "imagenes/productos/lp03.jpg",
  "imagenes/productos/lp04.jpg",
  "imagenes/productos/lp05.jpg",
  "imagenes/productos/lt01.jpg",
  "imagenes/productos/lt02.jpg",
  "imagenes/productos/lt03.jpg",
  "imagenes/productos/lt04.jpg",
  "imagenes/productos/lt05.jpg",
  "imagenes/productos/lt06.jpg",
  "js/inicio.js",
  "js/librerias/dompurify.js",
  "js/librerias/interop-cjs.js",
  "js/librerias/jquery.js",
  "js/nucleo/datos-y-seguridad.js",
  "js/nucleo/metricas-web-vitals.js",
  "js/nucleo/negocio.js",
  "js/nucleo/utilidades-ui.js",
  "js/modulos/carrusel.js",
  "js/modulos/catalogo.js",
  "js/modulos/contacto.js",
  "js/modulos/ficha-producto.js"
];

const PREFIJO = "luminatech:" + self.registration.scope + ":";
const CACHE = PREFIJO + VERSION;
const URL_LOCAL = ruta => new URL(ruta, self.registration.scope).href;

/* Instalación: precarga de todos los recursos esenciales en Cache Storage */
self.addEventListener("install", evento => {
  evento.waitUntil(caches.open(CACHE).then(cache => cache.addAll(RECURSOS.map(URL_LOCAL))));
});

/* Activación: eliminación controlada de versiones anteriores de caché */
self.addEventListener("activate", evento => {
  evento.waitUntil(
    (async () => {
      for (const clave of await caches.keys()) {
        if (clave.startsWith(PREFIJO) && clave !== CACHE) await caches.delete(clave);
      }
      await self.clients.claim();
    })()
  );
});

/* Estrategia Network-First con respaldo para archivos JSON de datos */
async function responderDatos(peticion) {
  const cache = await caches.open(CACHE);
  try {
    const respuesta = await fetch(peticion);
    if (!respuesta.ok) throw new Error("Datos no disponibles");
    return respuesta;
  } catch {
    const anterior = await cache.match(peticion);
    if (!anterior) return Response.error();
    const headers = new Headers(anterior.headers);
    headers.set("X-Luz-Respaldo", "1");
    return new Response(anterior.body, { headers, status: anterior.status });
  }
}

/* Interceptación de peticiones GET (Proxy Offline) */
self.addEventListener("fetch", evento => {
  const peticion = evento.request;
  const url = new URL(peticion.url);
  if (peticion.method !== "GET" || !url.href.startsWith(self.registration.scope)) return;

  if (peticion.mode === "navigate") {
    evento.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(URL_LOCAL("index.html"))) || fetch(peticion);
      })()
    );
  } else if (url.pathname.endsWith(".json") && !url.pathname.includes("/respaldo/")) {
    evento.respondWith(responderDatos(peticion));
  } else {
    evento.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const guardado = await cache.match(peticion);
        if (guardado) return guardado;
        try {
          const respuesta = await fetch(peticion);
          if (respuesta.ok && peticion.destination === "image") {
            await cache.put(peticion, respuesta.clone()).catch(() => {});
          }
          if (!respuesta.ok && peticion.destination === "image") {
            throw new Error("Imagen no disponible");
          }
          return respuesta;
        } catch {
          if (peticion.destination === "image") {
            return (await cache.match(URL_LOCAL("imagenes/lamparas.webp"))) || Response.error();
          }
          return Response.error();
        }
      })()
    );
  }
});
