/* Core Web Vitals locales. Consulta window.atlasMetricas en la consola o abre ?metricas=1. */
export function iniciarMetricas() {
  const tipos = globalThis.PerformanceObserver?.supportedEntryTypes || [];
  const mediciones = { LCP: null, CLS: null, INP: null };
  const depuracion = new URLSearchParams(location.search).has("metricas");
  window.atlasMetricas = mediciones;
  function registrar(nombre, valor) {
    if (mediciones[nombre] === valor) return;
    mediciones[nombre] = valor;
    if (depuracion) console.info("[Atlas Pixel]", nombre, valor, nombre === "CLS" ? "" : "ms");
  }
  function observar(tipo, procesar, opciones = {}) {
    if (!tipos.includes(tipo)) return null;
    const observador = new PerformanceObserver(lista => lista.getEntries().forEach(procesar));
    observador.observe({ type: tipo, buffered: true, ...opciones });
    return () => {
      observador.takeRecords().forEach(procesar);
      observador.disconnect();
    };
  }
  const cerrarLCP = observar("largest-contentful-paint", entrada => registrar("LCP", Math.round(entrada.startTime)));
  let inicio = null, ultima = null, suma = 0, maximo = 0;
  const cerrarCLS = observar("layout-shift", entrada => {
    if (entrada.hadRecentInput) return;
    if (inicio === null || entrada.startTime - ultima >= 1000 || entrada.startTime - inicio >= 5000) {
      inicio = entrada.startTime;
      suma = 0;
    }
    ultima = entrada.startTime;
    suma += entrada.value;
    maximo = Math.max(maximo, suma);
    registrar("CLS", Number(maximo.toFixed(4)));
  });
  if (cerrarCLS) registrar("CLS", 0);
  const interacciones = new Map();
  let menorId = Infinity, mayorId = 0;
  function procesarInteraccion(entrada) {
    const id = entrada.interactionId;
    if (!id) return;
    menorId = Math.min(id, menorId);
    mayorId = Math.max(id, mayorId);
    const duracion = Math.max(interacciones.get(id) || 0, entrada.duration);
    if (interacciones.size < 10 || interacciones.has(id) || duracion > Math.min(...interacciones.values())) {
      interacciones.set(id, duracion);
    }
    const ordenadas = [...interacciones].sort((a, b) => b[1] - a[1]);
    if (ordenadas.length > 10) interacciones.delete(ordenadas.pop()[0]);
    const cantidad = performance.interactionCount || (mayorId - menorId) / 7 + 1;
    registrar("INP", ordenadas[Math.min(ordenadas.length - 1, Math.floor(cantidad / 50))][1]);
  }
  const cerrarINP = observar("event", procesarInteraccion, { durationThreshold: 16 });
  const cerrarPrimera = observar("first-input", procesarInteraccion);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") cerrarLCP?.();
  });
  window.addEventListener("pagehide", evento => {
    if (evento.persisted) return;
    cerrarLCP?.();
    cerrarCLS?.();
    cerrarINP?.();
    cerrarPrimera?.();
  }, { once: true });
}
