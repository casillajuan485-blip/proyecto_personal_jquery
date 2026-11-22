/**
 * Módulo de la vista Detalle de Producto.
 * Responsabilidad: mostrar beneficios de salud, ingredientes, preparación y pedido por cajas vía WhatsApp.
 */

import { vincularWhatsapp } from "./whatsapp.js";
import { obtenerFamilias } from "./datos.js";
import { asignarTexto, delegarEventos, cargarFotoProducto } from "./dom.js";

const nombresFamilia = obtenerFamilias();

/**
 * Analiza la presentación para calcular si el producto se pide por cajas (sobres/paquetes) o por unidades.
 */
function analizarPresentacion(presentacion = "") {
  const match = presentacion.match(/^(\d+)\s+(sobres|paquetes)\b/i);
  if (match) {
    return {
      esCaja: true,
      porCaja: Number(match[1]),
      unidad: match[2].toLowerCase(),
    };
  }
  return { esCaja: false, porCaja: 1, unidad: "unidades" };
}

export function montar(contenedor, producto) {
  const infoCaja = analizarPresentacion(producto.presentacion);
  const etiquetaFamilia = nombresFamilia[producto.familia] || "DXN";
  const beneficios = Array.isArray(producto.beneficios) ? producto.beneficios : [];

  contenedor.innerHTML = `
    <div class="detalle">
      <div class="detalle__barra">
        <a class="detalle__volver" href="#catalogo" aria-label="Volver al catálogo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          <span class="detalle__volver-texto">Volver al catálogo</span>
        </a>
        <span class="detalle__codigo" data-codigo></span>
      </div>

      <div class="detalle__cuerpo">
        <div class="detalle__foto">
          <span class="detalle__badge" data-familia></span>
          <img width="460" height="460" decoding="async" alt="">
          <span hidden>Foto de esta presentación por confirmar</span>
        </div>

        <div class="detalle__texto">
          <div class="detalle__encabezado">
            <h1 class="titulo" tabindex="-1"></h1>
            <span class="acento-linea" aria-hidden="true"></span>
          </div>
          <p class="detalle__descripcion" data-descripcion></p>

          <div class="detalle__orden">
            <div class="detalle__presentacion">
              <svg class="detalle__caja-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <div class="detalle__presentacion-info">
                <strong data-pres-titulo></strong>
                <span data-pres-valor></span>
              </div>
            </div>

            <div class="detalle__orden-cuerpo">
              <div class="detalle__cantidad">
                <label for="cantidad" data-label-cantidad></label>
                <div class="detalle__stepper">
                  <button type="button" class="detalle__step-btn" data-cantidad="-1" aria-label="Restar uno">−</button>
                  <input class="contacto__cantidad" id="cantidad" type="number" inputmode="numeric" min="1" max="99" value="1">
                  <button type="button" class="detalle__step-btn" data-cantidad="1" aria-label="Sumar uno">+</button>
                </div>
                <span class="detalle__total-pill" data-total-pill></span>
              </div>

              <a class="boton boton--verde detalle__whatsapp" aria-disabled="true" target="_blank" rel="noopener noreferrer">
                <svg class="wa-icono" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.12c-.24.68-1.41 1.3-1.95 1.38-.52.08-1.18.11-1.9-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5.01-4.37-5.16-4.57-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.52c.28-.3.61-.38.81-.38h.58c.19 0 .44-.07.69.53.24.59.83 2.02.9 2.17.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.32.39-.45.52-.15.15-.31.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.45 1.51.3.15.48.13.66-.08.18-.2.76-.89.96-1.19.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.99.3.15.5.23.58.35.07.13.07.73-.17 1.41z"/>
                </svg>
                <span data-wa-texto>Pedir por WhatsApp</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
              </a>
              <p class="detalle__estado" role="status" data-estado></p>
            </div>
          </div>
        </div>
      </div>

      <div class="detalle__info-extra">
        <section class="detalle__beneficios" aria-label="Beneficios para tu bienestar">
          <h2 class="detalle__subtitulo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 21s-7-4.35-9.5-9.5C.7 7.8 3.2 4 7 4c2.1 0 3.8 1.1 5 2.7C13.2 5.1 14.9 4 17 4c3.8 0 6.3 3.8 4.5 7.5C19 16.65 12 21 12 21z"/>
            </svg>
            <span>¿En qué apoya a tu salud y bienestar?</span>
          </h2>
          <ul class="detalle__lista" data-beneficios></ul>
        </section>

        <div class="detalle__ficha">
          <article class="detalle__ficha-item">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
              <span>Ingredientes principales</span>
            </h3>
            <p data-ingredientes></p>
          </article>

          <article class="detalle__ficha-item">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
              <span>Cómo preparar / consumir</span>
            </h3>
            <p data-preparacion></p>
          </article>
        </div>
      </div>

      <p class="detalle__referencia" data-referencia hidden></p>
    </div>
  `;

  asignarTexto(contenedor.querySelector("[data-codigo]"), `Código ${producto.id}`);
  asignarTexto(contenedor.querySelector("[data-familia]"), `${etiquetaFamilia} DXN`);
  asignarTexto(contenedor.querySelector("h1"), producto.nombre);
  asignarTexto(contenedor.querySelector("[data-descripcion]"), producto.descripcion);

  asignarTexto(
    contenedor.querySelector("[data-pres-titulo]"),
    infoCaja.esCaja ? "Contenido por caja / empaque:" : "Presentación:"
  );
  asignarTexto(
    contenedor.querySelector("[data-pres-valor]"),
    infoCaja.esCaja ? `1 caja contiene ${producto.presentacion}` : producto.presentacion
  );
  asignarTexto(
    contenedor.querySelector("[data-label-cantidad]"),
    infoCaja.esCaja ? "Pedir por cajas:" : "Cantidad:"
  );

  asignarTexto(
    contenedor.querySelector("[data-ingredientes]"),
    producto.ingredientes || "Ingredientes naturales seleccionados de la línea DXN."
  );
  asignarTexto(
    contenedor.querySelector("[data-preparacion]"),
    producto.preparacion || "Consulta las indicaciones del empaque para su preparación."
  );

  const listaEl = contenedor.querySelector("[data-beneficios]");
  const itemsBeneficios = beneficios.length
    ? beneficios
    : ["Respaldo nutricional natural con ingredientes seleccionados de DXN."];

  for (const b of itemsBeneficios) {
    const li = document.createElement("li");
    li.innerHTML =
      '<svg class="detalle__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg><span></span>';
    asignarTexto(li.querySelector("span"), b);
    listaEl.append(li);
  }

  if (producto.referencia) {
    const ref = contenedor.querySelector("[data-referencia]");
    asignarTexto(ref, producto.referencia);
    ref.hidden = false;
  }

  cargarFotoProducto(contenedor.querySelector(".detalle__foto"), producto.imagen, producto.nombre);

  const input = contenedor.querySelector("input");
  const totalPill = contenedor.querySelector("[data-total-pill]");
  const waTexto = contenedor.querySelector("[data-wa-texto]");
  const getCantidad = () => Math.min(99, Math.max(1, Math.trunc(input.valueAsNumber || 1)));

  function actualizarResumen() {
    const cant = getCantidad();
    if (infoCaja.esCaja) {
      const totalSobres = cant * infoCaja.porCaja;
      const palabraCaja = cant === 1 ? "caja" : "cajas";
      asignarTexto(totalPill, `${totalSobres} ${infoCaja.unidad} en total`);
      asignarTexto(waTexto, `Pedir ${cant} ${palabraCaja} por WhatsApp`);
    } else {
      const palabraUnid = cant === 1 ? "unidad" : "unidades";
      asignarTexto(totalPill, `${cant} ${palabraUnid}`);
      asignarTexto(waTexto, `Pedir ${cant} ${palabraUnid} por WhatsApp`);
    }
  }

  // [HIDRATACIÓN] Vincula el botón de WhatsApp con el cálculo dinámico por cajas.
  const wa = vincularWhatsapp(
    contenedor.querySelector(".boton--verde"),
    contenedor.querySelector("[data-estado]"),
    () => {
      const cant = getCantidad();
      if (infoCaja.esCaja) {
        const totalSobres = cant * infoCaja.porCaja;
        const palabraCaja = cant === 1 ? "caja" : "cajas";
        return `Hola, me interesa ${producto.nombre} (1 caja de ${producto.presentacion}). Quiero pedir: ${cant} ${palabraCaja} (${totalSobres} ${infoCaja.unidad} en total). ¿Tiene disponible y cuál es el precio?`;
      }
      const palabraUnid = cant === 1 ? "unidad" : "unidades";
      return `Hola, me interesa ${producto.nombre} (${producto.presentacion}). Quiero pedir: ${cant} ${palabraUnid}. ¿Tiene disponible y cuál es el precio?`;
    }
  );

  actualizarResumen();

  // [DELEGACIÓN DE EVENTOS: click, input, change]
  const limpiarEventos = delegarEventos(contenedor, "detalle", [
    [
      "click",
      "[data-cantidad]",
      (_e, btn) => {
        input.value = Math.min(99, Math.max(1, getCantidad() + Number(btn.dataset.cantidad)));
        actualizarResumen();
        wa.actualizar();
      },
    ],
    [
      "input",
      "input",
      () => {
        actualizarResumen();
        wa.actualizar();
      },
    ],
    [
      "change",
      "input",
      () => {
        input.value = getCantidad();
        actualizarResumen();
        wa.actualizar();
      },
    ],
  ]);

  return () => {
    limpiarEventos();
    wa.limpiar();
  };
}
