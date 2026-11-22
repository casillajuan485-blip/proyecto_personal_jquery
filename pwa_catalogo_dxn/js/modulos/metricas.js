/**
 * Módulo de Core Web Vitals (CLS, LCP e INP).
 * Responsabilidad: medir el rendimiento real de la PWA sin bloquear la carga inicial.
 */

/**
 * [CORE WEB VITALS] Registra las 3 métricas principales:
 * - LCP (Largest Contentful Paint): velocidad de carga del contenido principal.
 * - CLS (Cumulative Layout Shift): estabilidad visual sin saltos inesperados.
 * - INP (Interaction to Next Paint): capacidad de respuesta ante clics y toques.
 */
export async function medirMetricasWeb() {
  const urlLocal = new URL("./vendor/web-vitals.js", document.baseURI);
  const { onCLS, onLCP, onINP } = await import(urlLocal.href).catch(() =>
    import("https://cdn.jsdelivr.net/npm/web-vitals@5.1.0/web-vitals.js")
  );

  const registrar = ({ name, value, rating }) => {
    console.info("[Core Web Vitals]", name, Number(value.toFixed(3)), rating);
  };

  onCLS(registrar, { reportAllChanges: true });
  onLCP(registrar, { reportAllChanges: true });
  onINP(registrar, { reportAllChanges: true });
}
