/**
 * Módulo de la vista Catálogo.
 * Responsabilidad: renderizar tarjetas reutilizables, filtros, búsqueda con debounce y paginación.
 */

import { obtenerFamilias, cargarCatalogo } from "./datos.js";
import {
  obtenerPorId,
  asignarTexto,
  delegarEventos,
  crearDebounce,
  cargarFotoProducto,
} from "./dom.js";

const estado = { pagina: 0, categoria: "todos", consulta: "", formato: "" };
const familias = obtenerFamilias();
const mqMovil = matchMedia("(max-width:640px)");
const mqTablet = matchMedia("(max-width:1024px)");

const normalizar = (s) =>
  s.toLocaleLowerCase("es").normalize("NFD").replace(/\p{Diacritic}/gu, "");

/**
 * [REUTILIZACIÓN DE TARJETAS] Clona la plantilla <template id="plantilla-producto">
 * y rellena únicamente los nodos necesarios con texto sanitizado.
 */
function crearTarjeta(producto) {
  const frag = obtenerPorId("plantilla-producto").content.cloneNode(true);
  const h2 = frag.querySelector("h2");
  asignarTexto(h2, producto.nombre);
  h2.title = producto.nombre;

  const benef = frag.querySelector(".tarjeta__beneficio");
  if (benef) asignarTexto(benef, producto.beneficio_corto || "");

  asignarTexto(frag.querySelector(".tarjeta__presentacion"), producto.presentacion);
  cargarFotoProducto(frag.querySelector(".tarjeta__foto"), producto.imagen, producto.nombre);

  const enlace = frag.querySelector("a");
  enlace.href = "#catalogo/producto/" + encodeURIComponent(producto.id);
  enlace.setAttribute("aria-label", `Ver detalle de ${producto.nombre}, ${producto.presentacion}`);
  return frag;
}

function calcularPaginasVisibles(actual, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i);
  const paginas = new Set([0, total - 1, actual - 1, actual, actual + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const resultado = [];
  for (let i = 0; i < ordenadas.length; i++) {
    if (i > 0 && ordenadas[i] - ordenadas[i - 1] > 1) resultado.push("...");
    resultado.push(ordenadas[i]);
  }
  return resultado;
}

/**
 * [CARGA DIFERIDA DE MÓDULOS] Monta la vista de catálogo cuando el usuario navega a #catalogo.
 */
export async function montar(contenedor, segmentos, sigueVigente) {
  const { productos, respaldo } = await cargarCatalogo();
  if (!sigueVigente()) return;

  // Si la ruta apunta a un producto específico, carga el módulo detalle.js bajo demanda.
  if (segmentos[0] === "producto") {
    const prod = productos.find((item) => item.id === segmentos[1]);
    if (prod) {
      const detalle = await import("./detalle.js");
      return sigueVigente() ? detalle.montar(contenedor, prod) : undefined;
    }
    contenedor.innerHTML =
      '<div class="catalogo__vacio"><h1 class="titulo" tabindex="-1">Producto no encontrado</h1><a class="boton boton--rojo" href="#catalogo">Volver al catálogo</a></div>';
    return;
  }

  if (Object.hasOwn(familias, segmentos[0])) {
    Object.assign(estado, { categoria: segmentos[0], pagina: 0 });
  }

  contenedor.innerHTML = `
    <div class="catalogo__cabecera">
      <div class="catalogo__titulo-bloque">
        <h1 class="titulo" tabindex="-1">Catálogo</h1>
      </div>
      <form class="catalogo__busqueda" role="search">
        <svg class="catalogo__lupa" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input class="catalogo__campo" type="search" maxlength="100" aria-label="Buscar producto" placeholder="Buscar producto">
      </form>
    </div>
    <div class="catalogo__barra">
      <div class="catalogo__filtros" aria-label="Categorías"></div>
      <div class="catalogo__formato">
        <label class="sr-only" for="formato">Presentación</label>
        <select class="catalogo__selector" id="formato" aria-label="Filtrar por presentación">
          <option value="">Presentación: Todas</option>
          <option value="Sobres">Sobres</option>
          <option value="Botella">Botella</option>
          <option value="Frasco">Frasco</option>
        </select>
      </div>
    </div>
    <div class="catalogo__rejilla"></div>
    <p class="catalogo__estado" role="status"></p>
    <nav class="catalogo__paginas" aria-label="Páginas del catálogo"></nav>
  `;

  const input = contenedor.querySelector("input");
  const select = contenedor.querySelector("select");
  const rejilla = contenedor.querySelector(".catalogo__rejilla");
  const filtros = contenedor.querySelector(".catalogo__filtros");
  const paginasEl = contenedor.querySelector(".catalogo__paginas");

  input.value = estado.consulta;
  select.value = estado.formato;

  for (const [clave, nombre] of Object.entries({ todos: "Todos", ...familias })) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "boton catalogo__chip";
    btn.dataset.familia = clave;
    asignarTexto(btn, nombre);
    filtros.append(btn);
  }

  /**
   * [OPTIMIZACIÓN DEL DOM] Actualiza únicamente la rejilla de la página actual y la paginación.
   */
  function renderizar() {
    const porPagina = mqMovil.matches ? 4 : mqTablet.matches ? 6 : 8;
    const consultaNorm = normalizar(estado.consulta);
    const filtrados = productos.filter(
      (p) =>
        (estado.categoria === "todos" || p.familia === estado.categoria) &&
        (!estado.formato || normalizar(p.presentacion).includes(normalizar(estado.formato))) &&
        normalizar(`${p.nombre} ${p.id} ${p.descripcion}`).includes(consultaNorm)
    );

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    estado.pagina = Math.max(0, Math.min(estado.pagina, totalPaginas - 1));

    const frag = document.createDocumentFragment();
    for (const prod of filtrados.slice(estado.pagina * porPagina, (estado.pagina + 1) * porPagina)) {
      frag.append(crearTarjeta(prod));
    }
    rejilla.replaceChildren(frag);

    asignarTexto(
      contenedor.querySelector(".catalogo__estado"),
      (filtrados.length
        ? `${filtrados.length} ${filtrados.length === 1 ? "producto disponible" : "productos disponibles"}`
        : "Sin resultados. Prueba con otro nombre o filtro.") +
        (respaldo ? " · Datos locales" : "")
    );

    const pagFrag = document.createDocumentFragment();
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "catalogo__pag-nav";
    prev.dataset.paso = "-1";
    prev.setAttribute("aria-label", "Página anterior");
    prev.disabled = estado.pagina === 0;
    prev.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
    pagFrag.append(prev);

    for (const item of calcularPaginasVisibles(estado.pagina, totalPaginas)) {
      if (item === "...") {
        const dots = document.createElement("span");
        dots.className = "catalogo__pag-puntos";
        dots.textContent = "…";
        pagFrag.append(dots);
      } else {
        const num = document.createElement("button");
        num.type = "button";
        num.className = "catalogo__pag-num";
        num.dataset.pagina = String(item);
        num.textContent = String(item + 1);
        num.setAttribute("aria-label", `Página ${item + 1}`);
        if (item === estado.pagina) num.setAttribute("aria-current", "page");
        pagFrag.append(num);
      }
    }

    const next = document.createElement("button");
    next.type = "button";
    next.className = "catalogo__pag-nav";
    next.dataset.paso = "1";
    next.setAttribute("aria-label", "Página siguiente");
    next.disabled = estado.pagina >= totalPaginas - 1;
    next.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
    pagFrag.append(next);

    paginasEl.replaceChildren(pagFrag);

    for (const chip of filtros.children) {
      chip.setAttribute("aria-pressed", String(chip.dataset.familia === estado.categoria));
    }
  }

  // [DEBOUNCE] Retrasa la búsqueda 180ms mientras el usuario escribe.
  const buscar = () => {
    estado.consulta = input.value.trim().slice(0, 100);
    estado.pagina = 0;
    renderizar();
  };
  const buscarDebounced = crearDebounce(buscar);

  // [DELEGACIÓN DE EVENTOS: click, change, input, submit]
  const limpiarEventos = delegarEventos(contenedor, "catalogo", [
    ["input", "input", () => buscarDebounced()],
    [
      "submit",
      "form",
      (e) => {
        e.preventDefault();
        buscarDebounced.cancelar();
        buscar();
      },
    ],
    [
      "change",
      "select",
      () => {
        estado.formato = select.value;
        estado.pagina = 0;
        renderizar();
      },
    ],
    [
      "click",
      "[data-familia]",
      (_e, btn) => {
        estado.categoria = btn.dataset.familia;
        estado.pagina = 0;
        renderizar();
      },
    ],
    [
      "click",
      "[data-paso]",
      (_e, btn) => {
        estado.pagina += Number(btn.dataset.paso);
        renderizar();
        scrollTo({ top: 0, behavior: "smooth" });
      },
    ],
    [
      "click",
      "[data-pagina]",
      (_e, btn) => {
        estado.pagina = Number(btn.dataset.pagina);
        renderizar();
        scrollTo({ top: 0, behavior: "smooth" });
      },
    ],
  ]);

  for (const mq of [mqMovil, mqTablet]) mq.addEventListener("change", renderizar);
  renderizar();

  // [PREVENCIÓN DE MEMORY LEAKS] Libera escuchadores y temporizadores al salir de la vista.
  return () => {
    limpiarEventos();
    buscarDebounced.cancelar();
    for (const mq of [mqMovil, mqTablet]) mq.removeEventListener("change", renderizar);
  };
}
