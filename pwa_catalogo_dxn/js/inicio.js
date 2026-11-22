/**
 * Script principal de arranque de la PWA Catálogo DXN Ganoderma.
 * Responsabilidad: enrutamiento de vistas, carga diferida, instalación de 5s,
 * control de red, teclado virtual, pantalla de carga de 3s y registro de Service Worker.
 */

import { obtenerPorId, mostrarConEfecto, delegarEventos } from "./modulos/dom.js";

// [ENRUTAMIENTO Y CARGA DIFERIDA DE MÓDULOS]
const vistas = {
  inicio: obtenerPorId("inicio"),
  catalogo: obtenerPorId("catalogo"),
  contacto: obtenerPorId("contacto"),
};

const cargadores = {
  catalogo: () => import("./modulos/catalogo.js"),
  contacto: () => import("./modulos/contacto.js"),
};

let numeroNavegacion = 0;
let limpiarVistaActual;

async function navegar(enfocarTitulo = true) {
  const turno = ++numeroNavegacion;
  limpiarVistaActual?.();
  limpiarVistaActual = undefined;

  const [vistaRaw, ...segmentos] = location.hash.slice(1).split("/");
  const vista = Object.hasOwn(vistas, vistaRaw) ? vistaRaw : "inicio";
  const seccion = vistas[vista];

  document.body.classList.toggle("app--inicio", vista === "inicio");
  for (const [nombre, nodo] of Object.entries(vistas)) {
    nodo.hidden = nombre !== vista;
  }
  for (const enlace of document.querySelectorAll(".nav__enlace")) {
    if (enlace.hash === "#" + vista) enlace.setAttribute("aria-current", "page");
    else enlace.removeAttribute("aria-current");
  }

  scrollTo(0, 0);

  if (cargadores[vista]) {
    seccion.innerHTML = '<h1 class="titulo" tabindex="-1">Cargando…</h1>';
    try {
      const modulo = await cargadores[vista]();
      if (turno !== numeroNavegacion) return;
      const limpieza = await modulo.montar(seccion, segmentos, () => numeroNavegacion === turno);
      if (turno !== numeroNavegacion) {
        limpieza?.();
        return;
      }
      limpiarVistaActual = limpieza;
    } catch {
      if (turno !== numeroNavegacion) return;
      seccion.innerHTML =
        '<h1 class="titulo" tabindex="-1">No se pudo cargar esta vista</h1><p>Comprueba tu conexión y vuelve a intentarlo.</p><button class="boton boton--rojo" data-reintentar>Reintentar</button>';
    }
  }

  if (enfocarTitulo) seccion.querySelector("h1")?.focus({ preventScroll: true });
}

addEventListener("hashchange", () => navegar());
navegar(false);

// [AVISO DE INSTALACIÓN PWA DE 5 SEGUNDOS EN LA PARTE SUPERIOR]
const avisoInstalacion = obtenerPorId("aviso-instalacion");
let eventoInstalacion;
let temporizadorAviso;
let avisoMostrado = false;

const yaInstalada =
  matchMedia("(display-mode: standalone)").matches || navigator.standalone;
const esIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function ocultarAvisoInstalacion() {
  clearTimeout(temporizadorAviso);
  mostrarConEfecto(avisoInstalacion, false);
}

function mostrarAviso5Segundos() {
  if (yaInstalada || avisoMostrado) return;
  avisoMostrado = true;
  mostrarConEfecto(avisoInstalacion, true);
  temporizadorAviso = setTimeout(ocultarAvisoInstalacion, 5000);
}

addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  eventoInstalacion = e;
  mostrarAviso5Segundos();
});

addEventListener("appinstalled", () => {
  eventoInstalacion = undefined;
  ocultarAvisoInstalacion();
});

if (esIOS) mostrarAviso5Segundos();

async function ejecutarInstalacion() {
  if (eventoInstalacion) {
    const prompt = eventoInstalacion;
    eventoInstalacion = undefined;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      // Usuario canceló la instalación.
    }
    ocultarAvisoInstalacion();
  } else if (esIOS) {
    clearTimeout(temporizadorAviso);
    avisoInstalacion.querySelector("span").textContent =
      "En Safari toca Compartir y luego Añadir a pantalla de inicio.";
    mostrarConEfecto(avisoInstalacion, true, "directo");
  }
}

// [HIDRATACIÓN GLOBAL Y DELEGACIÓN CON .off() / .on()]
const reglasGlobales = [
  ["click", "[data-instalar]", ejecutarInstalacion],
  ["click", "#cerrar-instalacion", ocultarAvisoInstalacion],
  ["click", "[data-reintentar]", () => navegar()],
];

let limpiarGlobales = delegarEventos(document, "aplicacion", reglasGlobales);
obtenerPorId("jquery")?.addEventListener(
  "load",
  () => {
    limpiarGlobales();
    limpiarGlobales = delegarEventos(document, "aplicacion", reglasGlobales);
  },
  { once: true }
);

// [CONTROL DE CONEXIÓN ONLINE / OFFLINE]
const actualizarEstadoRed = () => mostrarConEfecto(obtenerPorId("aviso-red"), !navigator.onLine);
for (const ev of ["online", "offline"]) addEventListener(ev, actualizarEstadoRed);
actualizarEstadoRed();

// [TECLADO VIRTUAL] Oculta la barra inferior si el teclado móvil ocupa la pantalla.
const viewport = window.visualViewport;
function detectarTeclado() {
  const hayCampoActivo = document.activeElement?.matches("input,textarea");
  const tecladoVisible =
    viewport && window.innerHeight - viewport.height > 110 && viewport.scale === 1;
  document.body.classList.toggle("app--teclado", Boolean(hayCampoActivo && tecladoVisible));
}
viewport?.addEventListener("resize", detectarTeclado);
document.addEventListener("focusin", detectarTeclado);
document.addEventListener("focusout", () => requestAnimationFrame(detectarTeclado));

// [PREVENCIÓN DE MEMORY LEAKS AL SALIR DE LA PÁGINA]
addEventListener("pagehide", (e) => {
  if (!e.persisted) {
    limpiarVistaActual?.();
    limpiarGlobales();
    clearTimeout(temporizadorAviso);
  }
});

// [SERVICE WORKER / PROXY OFFLINE]
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .catch((err) => console.warn("Caché PWA:", err.message));
}

// [PANTALLA DE CARGA DE 3 SEGUNDOS CON LOGO DXN]
const pantallaCarga = obtenerPorId("pantalla-carga");
if (pantallaCarga) {
  setTimeout(() => {
    pantallaCarga.classList.add("is-hidden");
    setTimeout(() => pantallaCarga.remove(), 480);
  }, 3000);
}

// [CORE WEB VITALS (CLS, LCP, INP)] Medición diferida cuando el navegador está libre.
const iniciarMetricas = () =>
  import("./modulos/metricas.js")
    .then((m) => m.medirMetricasWeb())
    .catch(() => {});

if ("requestIdleCallback" in window) {
  requestIdleCallback(iniciarMetricas, { timeout: 2500 });
} else {
  setTimeout(iniciarMetricas, 1200);
}
