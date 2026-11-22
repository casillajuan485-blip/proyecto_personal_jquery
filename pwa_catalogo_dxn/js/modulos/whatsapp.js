/**
 * Módulo de hidratación de botones de WhatsApp y control de conexión.
 * Responsabilidad: vincular enlaces wa.me sanitizados y reaccionar a eventos online/offline.
 */

import { obtenerJson } from "./datos.js";
import { sanitizarTexto, asignarTexto } from "./dom.js";

/**
 * [HIDRATACIÓN + CONTROL DE CONEXIÓN]
 * Configura dinámicamente el botón de WhatsApp con el número en datos/contacto.json
 * y actualiza su estado si el dispositivo pierde o recupera la conexión.
 */
export function vincularWhatsapp(enlace, estadoEl, construirMensaje) {
  let numero = "";
  let activo = true;

  function actualizar() {
    if (numero && navigator.onLine) {
      const url = new URL("https://wa.me/" + numero);
      url.searchParams.set("text", sanitizarTexto(construirMensaje()));
      enlace.href = url.href;
      enlace.removeAttribute("aria-disabled");
    } else {
      enlace.removeAttribute("href");
      enlace.setAttribute("aria-disabled", "true");
    }
    asignarTexto(
      estadoEl,
      navigator.onLine
        ? numero
          ? ""
          : "WhatsApp pendiente de configurar."
        : "Conéctate a internet para enviar tu pedido por WhatsApp."
    );
  }

  const controlador = new AbortController();
  for (const evento of ["online", "offline"]) {
    addEventListener(evento, actualizar, { signal: controlador.signal });
  }

  actualizar();

  obtenerJson("./datos/contacto.json")
    .then((datos) => {
      if (activo && /^591[67]\d{7}$/.test(datos.whatsapp)) {
        numero = datos.whatsapp;
        actualizar();
      }
    })
    .catch(() => {});

  return {
    actualizar,
    limpiar() {
      activo = false;
      controlador.abort();
    },
  };
}
