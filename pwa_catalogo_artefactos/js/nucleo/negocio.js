/**
 * MÓDULO: js/nucleo/negocio.js
 * RESPONSABILIDAD:
 *  - Cargar la configuración del negocio (LUMINATECH) desde datos/negocio.json.
 *  - Construir enlaces seguros a WhatsApp (wa.me) con mensaje sanitizado.
 */

import { cargarDatos, sanitizar } from "./datos-y-seguridad.js";

let promesaNegocio;

/** Obtiene y cachea en memoria los datos de negocio.json. */
function cargarNegocio() {
  promesaNegocio ??= cargarDatos(
    "negocio",
    obj => !!(obj && typeof obj === "object" && !Array.isArray(obj))
  )
    .then(({ datos }) => datos)
    .catch(() => {
      promesaNegocio = undefined;
      return {};
    });
  return promesaNegocio;
}

/** Genera la URL de WhatsApp con el número validado y el mensaje codificado. */
function crearEnlaceWhatsapp(negocio, mensaje) {
  const telefono = sanitizar(negocio.whatsapp).replace(/[ +()-]/g, "");
  return /^[1-9]\d{7,14}$/.test(telefono)
    ? "https://wa.me/" + telefono + "?text=" + encodeURIComponent(sanitizar(mensaje))
    : "";
}

export { cargarNegocio, crearEnlaceWhatsapp };
