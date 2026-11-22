/**
 * ============================================================================
 * MÓDULO PRINCIPAL: js/app.js
 * RESPONSABILIDAD: Orquesta la pantalla de carga (3 s), el aviso de instalación
 * PWA (5 s), el registro del Service Worker, el carrusel, el teclado virtual,
 * la delegación de eventos, el estado online/offline y la limpieza de memoria.
 * ============================================================================
 */

import {
  cargarCatalogo,
  formatearPrecio,
  formatearMaples,
  limitarCantidad,
  cargarPedido,
  guardarPedido,
  porId,
  crearTarjeta,
  actualizarTarjeta
} from "./catalogo.js";

const $ = window.jQuery;
const ctrl = new AbortController();
const { signal } = ctrl;

/* ============================================================================
 * BLOQUE 1: PANTALLA DE CARGA INICIAL (SPLASH SCREEN DE 3 SEGUNDOS)
 * Ocupa toda la pantalla con el logo del negocio y se oculta con .fadeOut().
 * ============================================================================ */
function iniciarPantallaCarga() {
  const splash = $("#pantalla-carga");
  if (!splash.length) return;
  const dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280;
  const timerSplash = setTimeout(() => {
    splash.fadeOut(dur, () => splash.prop("hidden", true));
  }, 3000);

  signal.addEventListener("abort", () => {
    clearTimeout(timerSplash);
    splash.stop(true, true);
  }, { once: true });
}

iniciarPantallaCarga();

/* ============================================================================
 * BLOQUE 2: AVISO DE INSTALACIÓN PWA EN LA PARTE SUPERIOR (5 SEGUNDOS)
 * Muestra #aviso-instalar con .fadeIn() y lo oculta automáticamente con .fadeOut().
 * ============================================================================ */
function iniciarAvisoInstalar(mostrarAyuda) {
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) return;

  const aviso = $("#aviso-instalar");
  const btnAviso = $("#instalar-aviso");
  if (!aviso.length) return;

  let eventoInstall = null;
  const dur = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);

  function ocultarAviso() {
    clearTimeout(timerAviso);
    aviso.stop(true, true).fadeOut(dur(), () => aviso.prop("hidden", true));
  }

  /* Se muestra después de la pantalla de carga y dura 5 segundos visibles. */
  let timerAviso = null;
  const timerMostrar = setTimeout(() => {
    btnAviso.prop("disabled", false);
    aviso.prop("hidden", false).hide().fadeIn(dur());
    timerAviso = setTimeout(ocultarAviso, 5000);
  }, 3100);

  window.addEventListener("beforeinstallprompt", ev => {
    ev.preventDefault();
    eventoInstall = ev;
  }, { signal });

  window.addEventListener("appinstalled", ocultarAviso, { signal });

  btnAviso.off(".instalar").on("click.instalar", async () => {
    ocultarAviso();
    if (eventoInstall) {
      const ev = eventoInstall;
      eventoInstall = null;
      try { await ev.prompt(); return; } catch {}
    }
    mostrarAyuda(
      "Instalar El Pollito",
      "Puedes añadir el catálogo a la pantalla de inicio.",
      "En Safari, usa Compartir y Agregar a pantalla de inicio. En Chrome/Android, busca Instalar aplicación en el menú."
    );
  });

  signal.addEventListener("abort", () => {
    clearTimeout(timerMostrar);
    clearTimeout(timerAviso);
    aviso.stop(true, true);
    btnAviso.off(".instalar");
  }, { once: true });
}

/* ============================================================================
 * BLOQUE 3: CARGA DIFERIDA DE MÓDULOS SECUNDARIOS (dialogos.js y metricas.js)
 * ============================================================================ */
function mostrarError() {
  const est = porId("estado");
  est.textContent = "No se pudo abrir esta opción. Intenta otra vez.";
  est.hidden = false;
}

const abrirAyuda = (...args) =>
  import("./dialogos.js").then(m => m.ayuda(...args)).catch(mostrarError);

iniciarAvisoInstalar(abrirAyuda);

const timerMetricas = setTimeout(() => import("./metricas.js").catch(console.warn), 600);

/* ============================================================================
 * BLOQUE 4: PREVENCIÓN DE MEMORY LEAKS Y TECLADO VIRTUAL (100dvh)
 * ============================================================================ */
window.addEventListener("pagehide", ev => {
  if (ev.persisted) return;
  clearTimeout(timerMetricas);
  ctrl.abort();
  $(document).off(".pollito");
  $("#productos,#pedido,#vaciar-desktop,#btn-carrito,#contacto,#carrusel").off(".pollito");
});

$(document).off("click.pollito", "[data-cerrar]").on("click.pollito", "[data-cerrar]", function () {
  this.closest("dialog").close();
});

const dlgCarrito = porId("carrito");
if (window.visualViewport) {
  const ajustarTeclado = () => {
    document.body.style.setProperty("--alto-visible", visualViewport.height + "px");
    document.body.classList.toggle("pollito--teclado", dlgCarrito.open && innerHeight - visualViewport.height > 100);
  };
  visualViewport.addEventListener("resize", ajustarTeclado, { signal });
  dlgCarrito.addEventListener("close", ajustarTeclado, { signal });
}

/* ============================================================================
 * BLOQUE 5: REGISTRO DEL SERVICE WORKER (PROXY OFFLINE)
 * ============================================================================ */
let swFallo = false;
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    swFallo = true;
    actualizarEstado();
  });
}

/* ============================================================================
 * BLOQUE 6: CARRUSEL DE 3 IMÁGENES CON SOPORTE TÁCTIL Y LIMPIEZA
 * ============================================================================ */
function iniciarCarrusel() {
  const raiz = porId("carrusel");
  if (!raiz) return;
  const slides = Array.from(raiz.querySelectorAll(".carrusel__slide"));
  const puntos = Array.from(raiz.querySelectorAll(".carrusel__punto"));
  if (slides.length < 2) return;

  let actual = 0;
  let pausa = false;
  let inicioX = 0;

  function irA(indice) {
    actual = (indice + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("carrusel__slide--activo", i === actual));
    puntos.forEach((p, i) => {
      const activo = i === actual;
      p.classList.toggle("carrusel__punto--activo", activo);
      p.setAttribute("aria-selected", String(activo));
    });
  }

  const timer = setInterval(() => {
    if (!pausa && !document.hidden) irA(actual + 1);
  }, 4500);

  $(raiz)
    .off(".pollito")
    .on("click.pollito", ".carrusel__flecha--prev", () => irA(actual - 1))
    .on("click.pollito", ".carrusel__flecha--sig", () => irA(actual + 1))
    .on("click.pollito", ".carrusel__punto", function () {
      irA(Number(this.dataset.slide) || 0);
    })
    .on("mouseenter.pollito focusin.pollito", () => { pausa = true; })
    .on("mouseleave.pollito focusout.pollito", () => { pausa = false; })
    .on("touchstart.pollito", ev => {
      pausa = true;
      inicioX = ev.originalEvent.touches?.[0]?.clientX ?? 0;
    })
    .on("touchend.pollito", ev => {
      const finX = ev.originalEvent.changedTouches?.[0]?.clientX ?? 0;
      const diff = finX - inicioX;
      if (Math.abs(diff) > 36) irA(actual + (diff < 0 ? 1 : -1));
      pausa = false;
    });

  signal.addEventListener("abort", () => clearInterval(timer), { once: true });
}

iniciarCarrusel();

/* ============================================================================
 * BLOQUE 7: INICIALIZACIÓN DEL CATÁLOGO CON DOCUMENTFRAGMENT (DOM ÓPTIMO)
 * ============================================================================ */
const datos = await cargarCatalogo();
const { productos } = datos;
const cantidades = cargarPedido(productos);
const contenedor = porId("productos");
const mapaProductos = new Map(productos.map(p => [p.id, p]));
const mapaTarjetas = new Map();

const unidadesUnicas = new Set(productos.map(p => p.unidades));
$("#unidades").text(
  unidadesUnicas.size === 1
    ? productos[0].unidades + " huevos por maple · Elige tamaño"
    : "Elige el tamaño y arma tu pedido"
);

const frag = document.createDocumentFragment();
productos.forEach((p, idx) => {
  const card = crearTarjeta(p, idx, formatearPrecio);
  mapaTarjetas.set(p.id, card);
  actualizarTarjeta(card, cantidades.get(p.id), p.precioCentavos);
  frag.append(card);
});
contenedor.append(frag);
contenedor.setAttribute("aria-busy", "false");

/* ============================================================================
 * BLOQUE 8: RENDERIZADO DEL RESUMEN Y CONTROL DE CONEXIÓN (ONLINE / OFFLINE)
 * ============================================================================ */
function obtenerSeleccionados() {
  return productos.filter(p => cantidades.get(p.id) > 0);
}

function obtenerItemsCarrito() {
  return obtenerSeleccionados().map(p => ({ producto: p, cantidad: cantidades.get(p.id) }));
}

function calcularTotalCentavos(seleccionados) {
  return seleccionados.reduce((acc, p) => acc + cantidades.get(p.id) * p.precioCentavos, 0);
}

function renderizarResumen() {
  const seleccionados = obtenerSeleccionados();
  let totalMaples = 0;
  const fragLineas = document.createDocumentFragment();

  for (const prod of seleccionados) {
    const cant = cantidades.get(prod.id);
    totalMaples += cant;
    const li = document.createElement("li");
    const span = document.createElement("span");
    const strong = document.createElement("strong");
    span.textContent = prod.nombre;
    strong.textContent = formatearMaples(cant);
    li.append(span, strong);
    fragLineas.append(li);
  }

  porId("lineas").replaceChildren(fragLineas);
  const totalCentavos = calcularTotalCentavos(seleccionados);
  $("#total").text(
    totalMaples > 0
      ? formatearMaples(totalMaples) + " · " + formatearPrecio(totalCentavos)
      : "Toca un tamaño o + para armar tu pedido"
  );

  const badge = porId("carrito-insignia");
  badge.textContent = String(totalMaples);
  badge.hidden = totalMaples === 0;
  porId("btn-carrito").classList.toggle("boton--carrito-activo", totalMaples > 0);

  porId("vaciar-desktop").hidden = totalMaples === 0;
  porId("enviar").disabled = !totalMaples || !navigator.onLine;
}

function actualizarEstado() {
  const avisos = [];
  if (!navigator.onLine) avisos.push("Sin conexión · WhatsApp requiere internet");
  if (datos.respaldo) avisos.push("Datos de respaldo");
  if (datos.demostracion) avisos.push("Precios de muestra");
  if (swFallo) avisos.push("Sin modo offline");

  const el = porId("estado");
  el.textContent = avisos.join(" · ");
  el.hidden = avisos.length === 0;
  renderizarResumen();
}

window.addEventListener("online", actualizarEstado, { signal });
window.addEventListener("offline", actualizarEstado, { signal });

/* ============================================================================
 * BLOQUE 9: DELEGACIÓN DE EVENTOS DINÁMICOS Y HIDRATACIÓN DE BOTONES DE CABECERA
 * ============================================================================ */
function fijarCantidad(id, nuevaCantidad) {
  const prod = mapaProductos.get(id);
  const nueva = limitarCantidad(nuevaCantidad);
  cantidades.set(id, nueva);
  actualizarTarjeta(mapaTarjetas.get(id), nueva, prod.precioCentavos);
  guardarPedido(cantidades);
  renderizarResumen();
}

function cambiarCantidad(id, delta) {
  fijarCantidad(id, cantidades.get(id) + delta);
}

$("#productos").off("click.pollito", "[data-accion]").on("click.pollito", "[data-accion]", async function () {
  const id = this.closest(".producto").dataset.id;
  const accion = this.dataset.accion;
  if (accion !== "detalle") {
    cambiarCantidad(id, accion === "mas" ? 1 : -1);
    return;
  }
  try {
    const { detalle } = await import("./dialogos.js");
    detalle(mapaProductos.get(id), cantidades.get(id), nueva => fijarCantidad(id, nueva));
  } catch {
    mostrarError();
  }
});

$("#vaciar-desktop").off(".pollito").on("click.pollito", () => {
  for (const prod of productos) {
    cantidades.set(prod.id, 0);
    actualizarTarjeta(mapaTarjetas.get(prod.id), 0, prod.precioCentavos);
  }
  guardarPedido(cantidades);
  renderizarResumen();
});

function abrirWhatsApp(mensaje) {
  if (!navigator.onLine) {
    abrirAyuda("Sin conexión", "Conéctate a internet para abrir WhatsApp.");
    return;
  }
  if (!datos.whatsapp) {
    abrirAyuda("WhatsApp pendiente", "Falta configurar el número de la vendedora en datos/negocio.json.");
    return;
  }
  location.href = "https://wa.me/" + datos.whatsapp + (mensaje ? "?text=" + encodeURIComponent(mensaje) : "");
}

function enviarPedidoPorWhatsApp({ nombre, entrega, direccion, pago }) {
  const items = obtenerItemsCarrito();
  if (!items.length) return;
  const totalCentavos = calcularTotalCentavos(items.map(i => i.producto));
  const lineas = items.map(
    ({ producto, cantidad }) =>
      "• " + formatearMaples(cantidad) + " de " + producto.nombre + " (" + formatearPrecio(cantidad * producto.precioCentavos) + ")"
  );
  const partes = [
    nombre ? `Hola, soy ${nombre}. Quisiera pedir:` : "Hola, quisiera pedir:",
    ...lineas,
    datos.demostracion || datos.respaldo ? "" : `Total: ${formatearPrecio(totalCentavos)}`,
    `Entrega: ${entrega}${direccion ? " (" + direccion + ")" : ""}`,
    `Pago: ${pago}`
  ].filter(Boolean);

  abrirWhatsApp(partes.join("\n"));
}

async function mostrarModalCarrito(iniciarConfirmado = false) {
  try {
    const { abrirCarrito } = await import("./dialogos.js");
    abrirCarrito({
      obtenerItems: obtenerItemsCarrito,
      onCambiar: cambiarCantidad,
      onDescartar: id => fijarCantidad(id, 0),
      onEnviarWhatsApp: enviarPedidoPorWhatsApp,
      iniciarConfirmado
    });
  } catch {
    mostrarError();
  }
}

/* Hidratación de botones principales de cabecera y formulario. */
$("#btn-carrito").off(".pollito").on("click.pollito", () => mostrarModalCarrito(false)).prop("disabled", false);

$("#pedido").off(".pollito").on("submit.pollito", ev => {
  ev.preventDefault();
  if (!obtenerSeleccionados().length) return;
  mostrarModalCarrito(true);
});

$("#contacto").off(".pollito").on("click.pollito", async () => {
  try {
    const { info } = await import("./dialogos.js");
    info(datos, () => abrirWhatsApp("Hola, quiero consultar sobre los maples de huevos."));
  } catch {
    mostrarError();
  }
}).prop("disabled", false);

actualizarEstado();
