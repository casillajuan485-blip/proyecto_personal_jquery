/**
 * MÓDULO: js/nucleo/metricas-web-vitals.js
 * RESPONSABILIDAD:
 *  - Medir en tiempo real las 3 métricas esenciales Core Web Vitals:
 *    1) LCP (Largest Contentful Paint)
 *    2) CLS (Cumulative Layout Shift)
 *    3) INP (Interaction to Next Paint)
 *  - Desconectar todos los observadores al salir (prevención de memory leaks).
 */

function observarWebVitals() {
  const metricas = (window.luminatechMetricas = {
    LCP: null,
    CLS: globalThis.PerformanceObserver?.supportedEntryTypes.includes("layout-shift") ? 0 : null,
    INP: null
  });

  const registrar = (nombre, valor) => {
    metricas[nombre] = Math.round(valor * 1000) / 1000;
    console.info("[LUMINATECH · Core Web Vitals]", nombre, metricas[nombre]);
  };

  const observadores = [];

  function crearObservador(tipo, manejador, opciones = {}) {
    if (!globalThis.PerformanceObserver?.supportedEntryTypes.includes(tipo)) return;
    const obs = new PerformanceObserver(lista => manejador(lista.getEntries()));
    obs.observe({ type: tipo, buffered: true, ...opciones });
    observadores.push({ obs, manejador });
  }

  /* 1. LCP: tiempo hasta el renderizado del elemento visual más grande */
  crearObservador("largest-contentful-paint", entradas => {
    if (entradas.length) registrar("LCP", entradas.at(-1).startTime);
  });

  /* 2. CLS: estabilidad visual acumulada sin desplazamientos inesperados */
  let inicioVentana = 0;
  let ultimaEntrada = 0;
  let acumulado = 0;
  crearObservador("layout-shift", entradas => {
    for (const e of entradas) {
      if (e.hadRecentInput) continue;
      acumulado =
        acumulado && e.startTime - ultimaEntrada < 1000 && e.startTime - inicioVentana < 5000
          ? acumulado + e.value
          : e.value;
      if (acumulado === e.value) inicioVentana = e.startTime;
      ultimaEntrada = e.startTime;
      if (acumulado > (metricas.CLS ?? 0)) registrar("CLS", acumulado);
    }
  });

  /* 3. INP: latencia de respuesta a interacciones del usuario */
  const interacciones = new Map();
  crearObservador(
    "event",
    entradas => {
      for (const e of entradas) {
        if (!e.interactionId) continue;
        const prev = interacciones.get(e.interactionId) || 0;
        interacciones.set(e.interactionId, Math.max(prev, e.duration));
      }
      const duraciones = [...interacciones.values()].sort((a, b) => b - a);
      const p98 = Math.min(duraciones.length - 1, Math.floor((performance.interactionCount || duraciones.length) / 50));
      if (p98 >= 0) registrar("INP", duraciones[p98]);
    },
    { durationThreshold: 16 }
  );

  /* Prevención de fugas de memoria: desconectar observadores al ocultar página */
  addEventListener("pagehide", evento => {
    if (!evento.persisted) {
      for (const { obs, manejador } of observadores) {
        manejador(obs.takeRecords());
        obs.disconnect();
      }
    }
  });
}

export { observarWebVitals };
