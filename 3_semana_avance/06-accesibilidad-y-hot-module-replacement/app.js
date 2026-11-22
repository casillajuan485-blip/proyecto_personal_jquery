import * as estructura from "./auditoria-estructura.js";
import * as teclado from "./auditoria-teclado.js";

// Simulación de HMR estático: sustituye el módulo activo y conserva el DOM.
const versiones = [estructura, teclado];
let revision = 0;
document.querySelector("#accion").addEventListener("click", () => {
  const modulo = versiones[revision % versiones.length];
  revision += 1;
  document.querySelector("#diagnostico").textContent =
    "Ejecución " + revision + " · " + modulo.nombre + " · " + modulo.auditar(document);
});

// Si una portada remota falla, queda visible el nombre del juego.
document.querySelectorAll(".portada img").forEach(imagen => {
  const mostrarRespaldo = () => { imagen.hidden = true; };
  imagen.addEventListener("error", mostrarRespaldo, { once: true });
  if (imagen.complete && !imagen.naturalWidth) mostrarRespaldo();
});
