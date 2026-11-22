/**
 * MÓDULO: js/modulos/ficha-producto.js
 * RESPONSABILIDAD:
 *  - Abrir el modal <dialog id="ficha"> con la información completa del producto.
 *  - Mostrar especificaciones técnicas con animación .slideToggle() de jQuery.
 *  - Conectar el botón "Contactar por WhatsApp" directamente al número de LUMINATECH.
 */

import { a as obtenerJQuery } from "../librerias/jquery.js";
import { b as interop } from "../librerias/interop-cjs.js";
import { sanitizar, cargarImagen } from "../nucleo/datos-y-seguridad.js";
import { cargarNegocio, crearEnlaceWhatsapp } from "../nucleo/negocio.js";
import { hidratarBotones } from "../nucleo/utilidades-ui.js";

const jq = interop(obtenerJQuery());
const fichaEl = document.querySelector("#ficha");
let secuencia = 0;

/** Rellena y muestra el modal de detalle del producto seleccionado. */
async function abrirFicha(producto, disparador) {
  const $ = jq.default;
  const actual = ++secuencia;
  const el = id => document.getElementById(id);

  cargarImagen(el("ficha-foto"), producto);
  el("ficha-foto").alt = sanitizar(producto.nombre);
  el("ficha-titulo").textContent = sanitizar(producto.nombre);
  el("ficha-descripcion").textContent = sanitizar(producto.descripcion);
  el("ficha-codigo").textContent = "Código " + sanitizar(producto.codigo);

  const datosEl = el("ficha-datos");
  const nodos = Object.entries(producto.especificaciones ?? {}).flatMap(([clave, valor]) => {
    const fila = document.createElement("div");
    fila.className = "ficha__fila";
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = sanitizar(clave);
    dd.textContent = sanitizar(valor);
    fila.append(dt, dd);
    return [fila];
  });
  datosEl.replaceChildren(...nodos);
  $(datosEl).stop(true, true).show();
  fichaEl.querySelector("[data-especificaciones]").setAttribute("aria-expanded", "true");
  fichaEl.scrollTop = 0;

  let negocio = {};
  const waBtn = el("whatsapp-producto");

  const actualizarContacto = () => {
    const enlace = crearEnlaceWhatsapp(
      negocio,
      "Hola, vi " +
        sanitizar(producto.nombre) +
        " (código " +
        sanitizar(producto.codigo) +
        ") en su catálogo de LUMINATECH. Quisiera consultar precio y disponibilidad."
    );
    waBtn.hidden = !enlace;
    el("ficha-contacto-pendiente").hidden = !!enlace;
    enlace ? (waBtn.href = enlace) : waBtn.removeAttribute("href");
  };

  $(fichaEl)
    .off(".ficha")
    .on("click.ficha", "[data-especificaciones]", function () {
      const abierto = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", String(!abierto));
      $(datosEl).stop(true, true).slideToggle(180);
    })
    .one("close.ficha", () => {
      $(datosEl).stop(true, true);
      $(fichaEl).off(".ficha");
      disparador.focus({ preventScroll: true });
    });

  hidratarBotones(fichaEl);
  actualizarContacto();
  fichaEl.open || fichaEl.showModal();
  negocio = await cargarNegocio();
  if (fichaEl.open && actual === secuencia) actualizarContacto();
}

export { abrirFicha };
