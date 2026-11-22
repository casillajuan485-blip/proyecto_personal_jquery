/**
 * ============================================================================
 * MÓDULO: js/catalogo.js
 * RESPONSABILIDAD: Carga asíncrona de archivos JSON, datos de respaldo offline,
 * sanitización XSS con DOMPurify, persistencia en localStorage y construcción
 * reutilizable de tarjetas con hidratación de botones.
 * ============================================================================
 */

/* ============================================================================
 * BLOQUE 1: DATOS DE RESPALDO OFFLINE
 * Si falla Fetch API (sin internet), la PWA muestra estos datos seguros.
 * ============================================================================ */
const BASE_PRODUCTOS = [
  { id: "primera", nombre: "Primera", tamano: "Muy grandes", talla: "XL", referencia: "Talla XL · Repostería y mesa", imagen: "./img/maple-primera.jpg", precioCentavos: 3900, unidades: 30, peso: "" },
  { id: "segunda", nombre: "Segunda", tamano: "Grandes", talla: "L", referencia: "Talla L · Uso diario", imagen: "./img/maple-segunda.jpg", precioCentavos: 3700, unidades: 30, peso: "" },
  { id: "tercera", nombre: "Tercera", tamano: "Medianos", talla: "M", referencia: "Talla M · Económico", imagen: "./img/maple-mediana.jpg", precioCentavos: 3500, unidades: 30, peso: "" },
  { id: "cuarta", nombre: "Cuarta", tamano: "Pequeños", talla: "S", referencia: "Talla S · Práctico", imagen: "./img/maple-pequena.jpg", precioCentavos: 3300, unidades: 30, peso: "" },
  { id: "quinta", nombre: "Quinta", tamano: "Muy pequeños", talla: "XS", referencia: "Talla XS · Rendidor", imagen: "./img/maple-pequena.jpg", precioCentavos: 3100, unidades: 30, peso: "" }
];

/* ============================================================================
 * BLOQUE 2: SANITIZACIÓN OBLIGATORIA CONTRA XSS CON DOMPurify
 * Limpia cualquier texto proveniente de JSON externos o formularios del usuario.
 * ============================================================================ */
export function limpiarTexto(valor, max = 48) {
  const texto = String(valor ?? "").slice(0, 256);
  return window.DOMPurify.sanitize(texto, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/[\u0000-\u001f<>]/g, "")
    .trim()
    .slice(0, max);
}

/* ============================================================================
 * BLOQUE 3: FUNCIÓN DEBOUNCE
 * Evita ejecuciones excesivas mientras el usuario escribe en inputs/búsquedas.
 * ============================================================================ */
export function debounce(fn, esperaMs = 200) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), esperaMs);
  };
}

/* ============================================================================
 * BLOQUE 4: FETCH API Y CARGA ASÍNCRONA DE JSON INDEPENDIENTES
 * Lee negocio.json y cada tamaño (primera.json ... quinta.json) en paralelo.
 * ============================================================================ */
async function leerJson(nombre) {
  const res = await fetch("./datos/" + nombre + ".json", { signal: AbortSignal.timeout(3500) });
  if (!res.ok) throw new Error("No se pudo leer el catálogo");
  return res.json();
}

export async function cargarCatalogo() {
  const [negocioRes, ...productosRes] = await Promise.allSettled([
    leerJson("negocio"),
    ...BASE_PRODUCTOS.map(async base => {
      const dato = await leerJson(base.id);
      if (
        dato.id !== base.id ||
        !Number.isInteger(dato.precioCentavos) ||
        dato.precioCentavos < 0 ||
        dato.precioCentavos > 99999999 ||
        !Number.isInteger(dato.unidades) ||
        dato.unidades < 1 ||
        dato.unidades > 999
      ) {
        throw new Error("Producto inválido");
      }
      return {
        ...base,
        nombre: limpiarTexto(dato.nombre, 28) || base.nombre,
        tamano: limpiarTexto(dato.tamano) || base.tamano,
        peso: limpiarTexto(dato.peso),
        unidades: dato.unidades,
        precioCentavos: dato.precioCentavos
      };
    })
  ]);

  const negocio = negocioRes.status === "fulfilled" ? negocioRes.value : {};
  const wa = negocio?.whatsapp;

  return {
    productos: productosRes.map((res, idx) => (res.status === "fulfilled" ? res.value : BASE_PRODUCTOS[idx])),
    respaldo: [negocioRes, ...productosRes].some(res => res.status === "rejected"),
    demostracion: negocio?.demostracion !== false,
    whatsapp: typeof wa === "string" && /^[1-9]\d{7,14}$/.test(wa) ? wa : "",
    horario: limpiarTexto(negocio?.horario, 64) || "Lunes a sábado · 08:00 a 19:00",
    zona: limpiarTexto(negocio?.zona, 64) || "Retiro en tienda y delivery"
  };
}

/* ============================================================================
 * BLOQUE 5: UTILIDADES DE FORMATO Y ALMACENAMIENTO LOCAL (localStorage)
 * Persiste el carrito entre recargas sin requerir servidor.
 * ============================================================================ */
export const formatearPrecio = centavos =>
  "Bs " + new Intl.NumberFormat("es-BO").format(centavos / 100);

export const formatearMaples = cantidad =>
  cantidad + (cantidad === 1 ? " maple" : " maples");

export const limitarCantidad = valor =>
  Number.isInteger(valor) ? Math.max(0, Math.min(999, valor)) : 0;

export function cargarPedido(productos) {
  let guardado = null;
  try {
    guardado = JSON.parse(localStorage.getItem("pollito-pedido"));
  } catch {
    guardado = null;
  }
  return new Map(productos.map(({ id }) => [id, limitarCantidad(guardado?.[id])]));
}

export function guardarPedido(mapa) {
  try {
    localStorage.setItem("pollito-pedido", JSON.stringify(Object.fromEntries(mapa)));
  } catch {}
}

export const porId = id => document.getElementById(id);

/* ============================================================================
 * BLOQUE 6: REUTILIZACIÓN DE TARJETAS (<template>) E HIDRATACIÓN DE BOTONES
 * Clona #plantilla-producto, aplica Lazy Loading e hidrata cada botón.
 * ============================================================================ */
export function crearTarjeta(producto, indice, formatear) {
  const card = porId("plantilla-producto").content.firstElementChild.cloneNode(true);
  card.dataset.id = producto.id;
  card.classList.add("producto--" + producto.id);

  const q = sel => card.querySelector(sel);
  const img = q("img");

  /* Lazy Loading en imágenes secundarias; la primera carga con prioridad alta (LCP). */
  img.loading = indice ? "lazy" : "eager";
  if (!indice) img.fetchPriority = "high";
  img.src = producto.imagen || "./img/maple-mediana.jpg";

  q(".producto__talla").textContent = producto.talla;
  q(".producto__nombre").textContent = producto.nombre;
  q(".producto__tamano").textContent = producto.tamano;
  q(".producto__precio").textContent = formatear(producto.precioCentavos);

  /* Hidratación: los botones inician disabled en HTML y se activan aquí al estar listos. */
  for (const [accion, texto] of [
    ["detalle", "Ver detalle de"],
    ["menos", "Quitar un maple de"],
    ["mas", "Agregar un maple de"]
  ]) {
    const btn = q('[data-accion="' + accion + '"]');
    btn.setAttribute("aria-label", texto + " " + producto.nombre);
    btn.disabled = false;
  }

  return card;
}

/* ============================================================================
 * BLOQUE 7: OPTIMIZACIÓN DEL DOM (ACTUALIZACIÓN PUNTUAL)
 * Solo actualiza los nodos que cambiaron en la tarjeta seleccionada.
 * ============================================================================ */
export function actualizarTarjeta(card, cantidad, precioCentavos) {
  card.querySelector("output").value = String(cantidad);
  card.querySelector('[data-accion="menos"]').disabled = cantidad === 0;
  card.querySelector('[data-accion="mas"]').disabled = cantidad === 999;
  card.classList.toggle("producto--elegido", cantidad > 0);

  const badge = card.querySelector(".producto__badge-cant");
  if (badge) {
    badge.hidden = cantidad === 0;
    badge.textContent = String(cantidad);
  }

  const sub = card.querySelector(".producto__subtotal");
  if (sub) {
    sub.hidden = cantidad === 0;
    if (cantidad > 0) {
      sub.textContent = "Sub: " + formatearPrecio(cantidad * precioCentavos);
    }
  }
}
