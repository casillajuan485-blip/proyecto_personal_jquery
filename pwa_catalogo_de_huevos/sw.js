// Proxy offline: caché aislado por ruta y versión para convivir con otras PWA.
const alcance = self.registration.scope;
const prefijo = 'el-pollito:' + alcance + ':';
const nombre = prefijo + 'v7-defensa-completa';
const archivos = ["css/base.css","css/catalogo.css","css/responsivo.css","datos/cuarta.json","datos/negocio.json","datos/primera.json","datos/quinta.json","datos/segunda.json","datos/tercera.json","img/carrusel-canasta.jpg","img/carrusel-maples.jpg","img/granja.webp","img/icono-192.png","img/icono-512.png","img/logo.webp","img/maple-320.webp","img/maple-640.webp","img/maple-mediana.jpg","img/maple-pequena.jpg","img/maple-primera.jpg","img/maple-segunda.jpg","index.html","js/app.js","js/catalogo.js","js/dialogos.js","js/metricas.js","manifest.webmanifest","vendor/LICENCIA-dompurify-Apache.txt","vendor/LICENCIA-dompurify-MPL.txt","vendor/LICENCIA-jquery.txt","vendor/LICENCIA-web-vitals.txt","vendor/dompurify.js","vendor/jquery.js"];
const esenciales = new Set(archivos.map(ruta => new URL(ruta, alcance).href));

self.addEventListener('install', evento => {
  evento.waitUntil(caches.open(nombre).then(cache => cache.addAll(
    archivos.map(ruta => new Request(new URL(ruta, alcance), {cache:'reload'}))
  )));
});
self.addEventListener('activate', evento => {
  evento.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter(id => id.startsWith(prefijo) && id !== nombre).map(id => caches.delete(id)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', evento => {
  const {request} = evento;
  if (request.method !== 'GET' || !request.url.startsWith(alcance)) return;
  if (request.mode !== 'navigate' && !esenciales.has(request.url)) return;
  evento.respondWith((async () => {
    const cache = await caches.open(nombre);
    // Catálogo y navegación usan una versión coherente. Se actualizan con el siguiente despliegue.
    if (request.mode === 'navigate') {
      const url = new URL(request.url);
      if (url.pathname === new URL(alcance).pathname || url.pathname === new URL('index.html',alcance).pathname) {
        return (await cache.match(new URL('index.html',alcance))) ?? fetch(request);
      }
      return fetch(request);
    }
    return (await cache.match(request)) ?? fetch(request);
  })());
});