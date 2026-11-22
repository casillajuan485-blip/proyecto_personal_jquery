/**
 * MÓDULO: js/nucleo/utilidades-ui.js
 * RESPONSABILIDAD:
 *  - Control de animaciones jQuery (.fadeIn, .fadeOut, .show, .hide)
 *    respetando prefers-reduced-motion.
 *  - Función debounce para evitar ejecuciones excesivas al escribir en búsquedas.
 *  - Función explícita de hidratación de botones (hidratarBotones).
 */

import { a as obtenerJQuery } from "../librerias/jquery.js";
import { b as interop } from "../librerias/interop-cjs.js";

const jq = interop(obtenerJQuery());
const $ = jq.default;

/* Desactiva animaciones jQuery si el usuario prefiere movimiento reducido */
$.fx.off = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================================
   1. ANIMACIONES DE VISIBILIDAD CON JQUERY
   ========================================================================== */

/** Muestra u oculta un elemento del DOM con .fadeIn() / .fadeOut() o .show() / .hide(). */
function mostrarElemento(elemento, visible, animar = false) {
  const $el = $(elemento).stop(true, true);
  if (visible) {
    elemento.hidden = false;
    animar ? $el.hide().fadeIn(180) : $el.show();
  } else if (animar && !elemento.hidden) {
    $el.fadeOut(180, () => {
      elemento.hidden = true;
    });
  } else {
    $el.hide();
    elemento.hidden = true;
  }
}

/* ==========================================================================
   2. DEBOUNCE PARA BÚSQUEDAS Y FILTROS
   ========================================================================== */

/** Retrasa la ejecución de una función hasta que pasen `esperaMs` sin nuevas llamadas. */
function debounce(fn, esperaMs) {
  let temporizador;
  const envuelta = (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), esperaMs);
  };
  envuelta.cancelar = () => clearTimeout(temporizador);
  return envuelta;
}

/* ==========================================================================
   3. HIDRATACIÓN EXPLÍCITA DE BOTONES
   ========================================================================== */

/**
 * Hidrata los botones y controles interactivos dentro de un contenedor:
 *  - Marca data-hidratado="true" para confirmar interactividad tras renderizar.
 *  - Asegura atributos de accesibilidad y retroalimentación táctil inmediata.
 */
function hidratarBotones(contenedor = document) {
  $(contenedor)
    .find("button, .boton, [role='button']")
    .each(function () {
      if (this.dataset.hidratado === "true") return;
      this.dataset.hidratado = "true";
      this.setAttribute("aria-busy", "false");
      $(this).on("pointerdown.hidratacion", function () {
        this.dataset.tocado = "true";
      });
    });
}

export { mostrarElemento, debounce, hidratarBotones };
