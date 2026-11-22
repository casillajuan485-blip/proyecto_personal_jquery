import { iniciarMetricas } from "./metricas.js";

iniciarMetricas();
const nombres = { LCP: " ms", CLS: "", INP: " ms" };
function mostrarMetricas() {
  for (const [nombre, unidad] of Object.entries(nombres)) {
    const etiqueta = document.getElementById(nombre.toLowerCase());
    const valor = window.atlasMetricas[nombre];
    const texto = valor === null ? etiqueta.dataset.espera : valor + unidad;
    if (etiqueta.textContent !== texto) etiqueta.textContent = texto;
  }
}
const tipos = globalThis.PerformanceObserver?.supportedEntryTypes || [];
const entradas = { LCP: "largest-contentful-paint", CLS: "layout-shift", INP: "event" };
for (const [nombre, tipo] of Object.entries(entradas)) {
  const etiqueta = document.getElementById(nombre.toLowerCase());
  etiqueta.dataset.espera = tipos.includes(tipo) ? etiqueta.textContent : "API no disponible";
}
mostrarMetricas();
for (const tipo of Object.values(entradas).filter(tipo => tipos.includes(tipo))) {
  new PerformanceObserver(mostrarMetricas).observe({ type: tipo, buffered: true });
}
if (tipos.includes("first-input")) {
  new PerformanceObserver(mostrarMetricas).observe({ type: "first-input", buffered: true });
}

// Cambia la coincidencia del selector sin modificar el resto del catálogo.
const muestra = document.querySelector("#especificidad");
document.querySelector("#regla").addEventListener("click", evento => {
  const boton = evento.currentTarget;
  const activar = boton.getAttribute("aria-pressed") === "false";
  boton.setAttribute("aria-pressed", activar);
  muestra.id = activar ? "especificidad" : "oferta";
  document.querySelector("#selector").textContent = activar
    ? "Gana #especificidad .insignia (1,1,0) sobre .insignia (0,1,0)."
    : "Aplica .insignia (0,1,0).";
});

document.querySelector("#sanear").addEventListener("click", () => {
  const resultado = document.querySelector("#resultado");
  if (!globalThis.DOMPurify?.isSupported) {
    resultado.textContent = "DOMPurify no está disponible en este navegador.";
    return;
  }
  const ficha = '<strong>Tekken 8</strong> · Consulta disponibilidad. <span style="color:red">Oferta Atlas Pixel</span>';
  const fragmento = DOMPurify.sanitize(ficha, {
    ALLOWED_TAGS: ["strong", "span"], ALLOWED_ATTR: [], RETURN_DOM_FRAGMENT: true
  });
  const resumen = document.createElement("p");
  resumen.textContent = fragmento.querySelector("span[style]")
    ? "El atributo de estilo sigue presente."
    : "DOMPurify eliminó el atributo style y conservó el texto y la etiqueta strong.";
  resultado.replaceChildren(fragmento, resumen);
});

// Si una portada remota falla, queda visible el nombre del juego.
document.querySelectorAll(".portada img").forEach(imagen => {
  const mostrarRespaldo = () => { imagen.hidden = true; };
  imagen.addEventListener("error", mostrarRespaldo, { once: true });
  if (imagen.complete && !imagen.naturalWidth) mostrarRespaldo();
});
