/**
 * ============================================================================
 * MÓDULO: js/metricas.js (CARGA DIFERIDA / CORE WEB VITALS)
 * RESPONSABILIDAD: Medir las 3 métricas web esenciales (CLS, LCP e INP)
 * usando PerformanceObserver sin bloquear el renderizado inicial.
 * Los resultados se exponen en window.metricasElPollito.
 * ============================================================================
 */

const reporte = Object.create(null);
window.metricasElPollito = reporte;

function registrar(nombre, valor, unidad, umbrales) {
  const evaluacion =
    valor <= umbrales[0] ? "good" : valor <= umbrales[1] ? "needs-improvement" : "poor";
  reporte[nombre] = {
    valor: Number(valor.toFixed(3)),
    evaluacion,
    unidad
  };
}

function observar(tipo, callback) {
  try {
    if (!PerformanceObserver.supportedEntryTypes?.includes(tipo)) return null;
    const obs = new PerformanceObserver(lista => callback(lista.getEntries(), obs));
    obs.observe({ type: tipo, buffered: true });
    return obs;
  } catch {
    return null;
  }
}

/* ============================================================================
 * BLOQUE 1: CLS (Cumulative Layout Shift - Estabilidad visual)
 * ============================================================================ */
let clsAcumulado = 0;
const obsCls = observar("layout-shift", entradas => {
  for (const e of entradas) {
    if (!e.hadRecentInput) clsAcumulado += e.value;
  }
  registrar("CLS", clsAcumulado, "sin unidad", [0.1, 0.25]);
});

/* ============================================================================
 * BLOQUE 2: LCP (Largest Contentful Paint - Velocidad de carga visual)
 * ============================================================================ */
const obsLcp = observar("largest-contentful-paint", entradas => {
  const ultima = entradas[entradas.length - 1];
  if (ultima) registrar("LCP", ultima.startTime, "ms", [2500, 4000]);
});

/* ============================================================================
 * BLOQUE 3: INP (Interaction to Next Paint - Capacidad de respuesta)
 * ============================================================================ */
let peorInteraccion = 0;
const obsInp = observar("event", entradas => {
  for (const e of entradas) {
    if (e.interactionId && e.duration > peorInteraccion) {
      peorInteraccion = e.duration;
      registrar("INP", peorInteraccion, "ms", [200, 500]);
    }
  }
});

/* ============================================================================
 * BLOQUE 4: LIMPIEZA DE OBSERVADORES (PREVENCIÓN DE MEMORY LEAKS)
 * ============================================================================ */
window.addEventListener(
  "pagehide",
  () => {
    obsCls?.disconnect();
    obsLcp?.disconnect();
    obsInp?.disconnect();
  },
  { once: true }
);
