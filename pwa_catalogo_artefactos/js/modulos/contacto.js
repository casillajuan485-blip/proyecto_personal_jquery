/**
 * MÓDULO: js/modulos/contacto.js
 * RESPONSABILIDAD:
 *  - Cargar y mostrar en la pantalla Contacto los datos de LUMINATECH
 *    (dirección, horario, descripción, enlace a Google Maps y botón de WhatsApp).
 */

import { sanitizar, validarMapa } from "../nucleo/datos-y-seguridad.js";
import { cargarNegocio, crearEnlaceWhatsapp } from "../nucleo/negocio.js";
import { hidratarBotones } from "../nucleo/utilidades-ui.js";

function asignarEnlace(id, url) {
  const el = document.getElementById(id);
  el.hidden = !url;
  url ? (el.href = url) : el.removeAttribute("href");
}

async function mostrarContacto() {
  const negocio = await cargarNegocio();
  for (const campo of ["direccion", "horario", "descripcion"]) {
    if (negocio[campo]) {
      document.getElementById(campo).textContent = sanitizar(negocio[campo]);
    }
  }
  const enlaceWa = crearEnlaceWhatsapp(negocio, "Hola, quisiera consultar sobre sus productos de LUMINATECH.");
  asignarEnlace("whatsapp-general", enlaceWa);
  document.getElementById("whatsapp-pendiente").hidden = !!enlaceWa;
  asignarEnlace("ruta-mapa", validarMapa(sanitizar(negocio.mapa)));
  hidratarBotones(document.getElementById("contacto"));
}

export { mostrarContacto };
