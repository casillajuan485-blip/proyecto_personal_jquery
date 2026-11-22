/**
 * MÓDULO: js/modulos/catalogo.js
 * RESPONSABILIDAD:
 *  - Cargar de forma asíncrona los catálogos JSON (lámparas, focos, cables).
 *  - Filtrar por texto (con debounce de 180 ms), categoría y sub-filtro de lámparas (De techo / Portátiles).
 *  - Renderizar tarjetas reutilizando <template> con DocumentFragment, lazy loading e hidratación de botones.
 *  - Delegar eventos dinámicos (.off() / .on()) para efecto pop-out en tarjetas, paginación y apertura de ficha.
 */

import { a as obtenerJQuery } from "../librerias/jquery.js";
import { b as interop } from "../librerias/interop-cjs.js";
import { cargarDatos, sanitizar, cargarImagen } from "../nucleo/datos-y-seguridad.js";
import { debounce, hidratarBotones } from "../nucleo/utilidades-ui.js";

const jq = interop(obtenerJQuery());
const catalogoEl = document.querySelector("#catalogo");
const busquedaEl = document.querySelector("#busqueda");
const estadoEl = document.querySelector("#estado-catalogo");
const productosEl = document.querySelector("#productos");
const paginacionEl = document.querySelector("#paginacion");
const subfiltrosEl = document.querySelector("#filtros-lamparas");
const limpiarEl = document.querySelector("#limpiar");
const reintentarEl = document.querySelector("#reintentar");

const categorias = ["lamparas", "focos", "cables"];
const POR_PAGINA = 8;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

let listaProductos = [];
let promesaCarga;
let avisoCarga = "";
let categoriaActiva = "todos";
let subcategoriaActiva = "todas";
let paginaActual = 1;
let ultimoRender = "";
let activo = false;

/** Clona la plantilla reutilizable de tarjeta y rellena datos sanitizados. */
function crearTarjeta(producto, idx) {
  const frag = document.querySelector("#plantilla-producto").content.cloneNode(true);
  const img = frag.querySelector("img");
  img.loading = idx < 4 ? "eager" : "lazy";
  cargarImagen(img, producto);
  img.alt = sanitizar(producto.nombre);

  const h2 = frag.querySelector("h2");
  h2.textContent = sanitizar(producto.nombre);
  h2.title = h2.textContent;

  frag.querySelector(".producto__dato").textContent = sanitizar(producto.resumen);
  frag.querySelector(".producto__codigo").textContent = "Código " + sanitizar(producto.codigo);

  const btn = frag.querySelector("button[data-detalle]");
  btn.dataset.detalle = producto.id;
  btn.setAttribute("aria-label", "Ver detalle de " + h2.textContent);
  return frag;
}

/** Normaliza texto eliminando tildes y espacios entre número y unidad para búsqueda flexible. */
function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/(\d)\s+(?=[a-z])/g, "$1");
}

function coincideSubcategoria(producto) {
  if (categoriaActiva !== "lamparas" || subcategoriaActiva === "todas") return true;
  const prefijo = subcategoriaActiva === "techo" ? "lamparas/lt" : "lamparas/lp";
  return producto.id.startsWith(prefijo);
}

/** Genera la barra de paginación compacta para evitar scroll vertical excesivo. */
function renderizarPaginacion(totalPaginas) {
  if (totalPaginas <= 1) {
    paginacionEl.hidden = true;
    paginacionEl.replaceChildren();
    return;
  }
  const frag = document.createDocumentFragment();
  const crearBtn = (texto, pagina, activoBtn = false, deshabilitado = false, etiqueta = "") => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texto;
    b.disabled = deshabilitado;
    if (activoBtn) b.setAttribute("aria-current", "page");
    if (etiqueta) b.setAttribute("aria-label", etiqueta);
    b.dataset.pag = String(pagina);
    return b;
  };
  frag.append(crearBtn("‹", paginaActual - 1, false, paginaActual <= 1, "Página anterior"));
  for (let i = 1; i <= totalPaginas; i++) {
    frag.append(crearBtn(String(i), i, i === paginaActual, false, "Página " + i));
  }
  frag.append(crearBtn("›", paginaActual + 1, false, paginaActual >= totalPaginas, "Página siguiente"));
  paginacionEl.replaceChildren(frag);
  paginacionEl.hidden = false;
  hidratarBotones(paginacionEl);
}

/** Filtra, pagina, actualiza el DOM solo si cambió y aplica animación escalonada jQuery. */
function renderizar() {
  if (!activo) return;
  const $ = jq.default;

  const mostrarSub = categoriaActiva === "lamparas";
  if (subfiltrosEl.hidden === mostrarSub) {
    subfiltrosEl.hidden = !mostrarSub;
    if (mostrarSub && !reduceMotion.matches) {
      $(subfiltrosEl).hide().fadeIn(180);
    }
  }

  const termino = normalizar(sanitizar(busquedaEl.value));
  const filtrados = listaProductos.filter(
    p =>
      (categoriaActiva === "todos" || p.categoria === categoriaActiva) &&
      coincideSubcategoria(p) &&
      termino.split(/\s+/).every(t => p.indice.includes(t))
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  if (paginaActual > totalPaginas) paginaActual = 1;
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visibles = filtrados.slice(inicio, inicio + POR_PAGINA);

  const firma = JSON.stringify({ ids: visibles.map(p => p.id), pagina: paginaActual });
  if (firma !== ultimoRender) {
    const frag = document.createDocumentFragment();
    visibles.forEach((p, idx) => frag.append(crearTarjeta(p, idx)));
    productosEl.replaceChildren(frag);
    hidratarBotones(productosEl);
    ultimoRender = firma;

    if (!reduceMotion.matches && visibles.length) {
      $(productosEl)
        .children(".producto")
        .each(function (idx) {
          $(this)
            .hide()
            .delay(Math.min(idx * 25, 180))
            .fadeIn(190);
        });
    }
  }

  renderizarPaginacion(totalPaginas);
  estadoEl.textContent = avisoCarga || (filtrados.length ? "" : "No encontramos productos.");
  limpiarEl.hidden = !!filtrados.length || (!termino && categoriaActiva === "todos");
}

/** Carga asíncrona en paralelo de las 3 categorías JSON con manejo de errores. */
async function cargarCatalogo() {
  const resultados = (
    await Promise.allSettled(
      categorias.map(async cat => {
        const { datos, respaldo } = await cargarDatos(
          cat,
          arr => Array.isArray(arr) && arr.every(p => p && typeof p.id === "string" && typeof p.nombre === "string")
        );
        return {
          respaldo,
          productos: datos.map(p => ({
            ...p,
            id: cat + "/" + p.id,
            categoria: cat,
            indice: normalizar(
              sanitizar(
                [p.codigo, p.nombre, p.resumen, p.modelo, p.descripcion, ...Object.values(p.especificaciones ?? {})].join(
                  " "
                )
              )
            )
          }))
        };
      })
    )
  )
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);

  const maxLen = Math.max(0, ...resultados.map(r => r.productos.length));
  listaProductos = Array.from({ length: maxLen }, (_, idx) =>
    resultados.flatMap(r => (r.productos[idx] ? [r.productos[idx]] : []))
  ).flat();

  ultimoRender = "";
  reintentarEl.hidden = resultados.length === categorias.length;
  avisoCarga = resultados.length
    ? resultados.length < categorias.length
      ? "Algunas categorías no pudieron cargarse."
      : resultados.some(r => r.respaldo)
        ? "Estás viendo una copia guardada del catálogo."
        : ""
    : "No pudimos cargar el catálogo. Intenta nuevamente.";
}

const renderizarDebounced = debounce(() => {
  paginaActual = 1;
  renderizar();
}, 180);

/** Activa la sección Catálogo, registra eventos delegados y renderiza productos. */
async function activarCatalogo(cat) {
  const $ = jq.default;
  activo = true;
  const nuevaCat = categorias.includes(cat) ? cat : "todos";
  if (nuevaCat !== categoriaActiva) {
    categoriaActiva = nuevaCat;
    subcategoriaActiva = "todas";
    paginaActual = 1;
    subfiltrosEl.querySelector('input[value="todas"]').checked = true;
  }
  catalogoEl.querySelector('input[value="' + categoriaActiva + '"]').checked = true;

  $(catalogoEl)
    .off(".catalogo")
    .on("mouseenter.catalogo focusin.catalogo", ".producto", function () {
      $(this).addClass("producto--activo");
    })
    .on("mouseleave.catalogo focusout.catalogo", ".producto", function () {
      $(this).removeClass("producto--activo");
    })
    .on("input.catalogo", "#busqueda", renderizarDebounced)
    .on("change.catalogo", "[name=categoria]", function () {
      subcategoriaActiva = "todas";
      paginaActual = 1;
      subfiltrosEl.querySelector('input[value="todas"]').checked = true;
      location.hash = this.value === "todos" ? "#catalogo" : "#catalogo/" + this.value;
    })
    .on("change.catalogo", "[name=subcategoria]", function () {
      subcategoriaActiva = this.value;
      paginaActual = 1;
      renderizar();
    })
    .on("click.catalogo", "[data-pag]", function () {
      const nueva = Number(this.dataset.pag);
      if (Number.isFinite(nueva) && nueva >= 1) {
        paginaActual = nueva;
        renderizar();
        window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
      }
    })
    .on("submit.catalogo", "#form-busqueda", e => {
      e.preventDefault();
      renderizarDebounced.cancelar();
      paginaActual = 1;
      renderizar();
    })
    .on("click.catalogo", "#limpiar", () => {
      busquedaEl.value = "";
      categoriaActiva = "todos";
      subcategoriaActiva = "todas";
      paginaActual = 1;
      subfiltrosEl.querySelector('input[value="todas"]').checked = true;
      location.hash !== "#catalogo" ? (location.hash = "#catalogo") : renderizar();
    })
    .on("click.catalogo", "#reintentar", async () => {
      reintentarEl.disabled = true;
      await (promesaCarga = cargarCatalogo());
      reintentarEl.disabled = false;
      renderizar();
    })
    .on("click.catalogo", "[data-detalle]", async function () {
      const producto = listaProductos.find(p => p.id === this.dataset.detalle);
      if (producto) {
        try {
          const { abrirFicha } = await import("./ficha-producto.js");
          if (activo) await abrirFicha(producto, this);
        } catch {
          estadoEl.textContent = "No pudimos abrir la ficha. Intenta nuevamente.";
        }
      }
    });

  hidratarBotones(catalogoEl);
  if (!promesaCarga) {
    estadoEl.textContent = "Cargando productos…";
    promesaCarga = cargarCatalogo();
  }
  await promesaCarga;
  renderizar();
}

/** Limpia temporizadores y eventos delegados al salir de Catálogo (prevención de memory leaks). */
function desactivarCatalogo() {
  activo = false;
  renderizarDebounced.cancelar();
  jq.default(catalogoEl).off(".catalogo");
}

export { activarCatalogo, desactivarCatalogo };
