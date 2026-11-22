/**
 * ARCHIVO PRINCIPAL: js/inicio.js
 * RESPONSABILIDAD:
 *  - Enrutador SPA por hash (#inicio, #catalogo, #contacto) con carga diferida de módulos.
 *  - Animación de bienvenida a pantalla completa durante 3 segundos.
 *  - Control de estado de red (online / offline).
 *  - Gestión del teclado virtual móvil (visualViewport) para no tapar el buscador ni la barra inferior.
 *  - Hidratación inicial de botones, registro del Service Worker (proxy offline) y Core Web Vitals.
 */

import { mostrarElemento, hidratarBotones } from "./nucleo/utilidades-ui.js";
import { observarWebVitals } from "./nucleo/metricas-web-vitals.js";

let moduloCatalogo;
let pantallaActual;
let secuenciaNav = 0;
let enfocarBuscador = false;
const pantallas = ["inicio", "catalogo", "contacto"];

/* ==========================================================================
   1. ENRUTADOR SPA Y CARGA DIFERIDA DE MÓDULOS
   ========================================================================== */

async function navegar() {
  const actual = ++secuenciaNav;
  const [ruta, subruta] = location.hash.slice(1).split("/");
  const destino = pantallas.includes(ruta) ? ruta : "inicio";
  const cambioPantalla = pantallaActual !== destino;

  if (destino !== "catalogo") moduloCatalogo?.desactivarCatalogo();
  for (const id of pantallas) {
    mostrarElemento(document.getElementById(id), id === destino);
  }
  document.querySelectorAll(".navegacion a").forEach(a => {
    a.hash === "#" + destino ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });

  if (cambioPantalla && pantallaActual) {
    scrollTo(0, 0);
    if (!enfocarBuscador) {
      document.querySelector("#titulo-" + destino)?.focus({ preventScroll: true });
    }
  }
  pantallaActual = destino;

  if (destino === "catalogo" && enfocarBuscador) {
    document.querySelector("#busqueda")?.focus();
  }
  enfocarBuscador = false;

  try {
    if (destino === "catalogo") {
      moduloCatalogo ??= await import("./modulos/catalogo.js");
      if (actual === secuenciaNav) await moduloCatalogo.activarCatalogo(subruta);
    } else if (destino === "contacto") {
      const mod = await import("./modulos/contacto.js");
      if (actual === secuenciaNav) await mod.mostrarContacto();
    }
  } catch {
    actualizarEstadoRed("No pudimos abrir esta sección. Vuelve a intentarlo.");
  }
}

/* ==========================================================================
   2. CONTROL DE CONEXIÓN ONLINE / OFFLINE
   ========================================================================== */

const estadoRedEl = document.querySelector("#estado-red");
function actualizarEstadoRed(mensaje) {
  estadoRedEl.textContent = mensaje || "Sin conexión. Puedes consultar el contenido guardado.";
  mostrarElemento(estadoRedEl, !navigator.onLine || !!mensaje);
}
addEventListener("online", () => actualizarEstadoRed());
addEventListener("offline", () => actualizarEstadoRed());
actualizarEstadoRed();

/* ==========================================================================
   3. BÚSQUEDA RÁPIDA DESDE CABECERA E INICIALIZACIÓN DE RUTAS
   ========================================================================== */

document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.matches("[data-buscar]")) {
    if (pantallaActual === "catalogo") {
      document.querySelector("#busqueda")?.focus();
    } else {
      enfocarBuscador = true;
      location.hash = "#catalogo";
    }
  }
});

addEventListener("hashchange", navegar);
navegar();
hidratarBotones(document);

/* ==========================================================================
   4. PANTALLA DE BIENVENIDA (3 SEGUNDOS)
   ========================================================================== */

(() => {
  const bienvenida = document.getElementById("bienvenida");
  if (!bienvenida) return;
  const cerrarBienvenida = () => {
    if (bienvenida.classList.contains("bienvenida--salida")) return;
    bienvenida.classList.add("bienvenida--salida");
    setTimeout(() => bienvenida.remove(), 480);
  };
  const timer = setTimeout(cerrarBienvenida, 3000);
  bienvenida.addEventListener("click", () => {
    clearTimeout(timer);
    cerrarBienvenida();
  });
})();

/* ==========================================================================
   5. GESTIÓN DE TECLADO VIRTUAL MÓVIL (100dvh + visualViewport)
   ========================================================================== */

const viewport = window.visualViewport;
function ajustarTeclado() {
  const activo = document.activeElement?.matches("input[type=search]");
  const teclado =
    activo && viewport && viewport.scale === 1 ? Math.max(0, innerHeight - viewport.height - viewport.offsetTop) : 0;
  document.documentElement.classList.toggle("teclado-visible", !!activo);
  document.documentElement.style.setProperty("--teclado", teclado + "px");
}
viewport?.addEventListener("resize", ajustarTeclado);
document.addEventListener("focusin", ajustarTeclado);
document.addEventListener("focusout", e => {
  if (e.target.matches("input[type=search]")) {
    document.documentElement.classList.remove("teclado-visible");
    document.documentElement.style.removeProperty("--teclado");
  }
});

/* ==========================================================================
   6. SERVICE WORKER (PROXY OFFLINE), CORE WEB VITALS Y CARRUSEL DIFERIDO
   ========================================================================== */

"serviceWorker" in navigator && navigator.serviceWorker.register("./sw.js").catch(() => {});
observarWebVitals();

(() => {
  const iniciar = () => import("./modulos/carrusel.js").then(m => m.iniciarCarrusel()).catch(() => {});
  "requestIdleCallback" in window ? requestIdleCallback(iniciar, { timeout: 700 }) : setTimeout(iniciar, 0);
})();
