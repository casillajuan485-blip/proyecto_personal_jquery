/**
 * Módulo de la vista Contacto.
 * Responsabilidad: presentar el canal directo de WhatsApp y el desplegable con .slideToggle().
 */

import { vincularWhatsapp } from "./whatsapp.js";
import { alternarDesplegable, delegarEventos } from "./dom.js";

export function montar(contenedor) {
  contenedor.innerHTML = `
    <div class="contacto__panel">
      <div class="contacto__contenido">
        <div class="contacto__cabecera">
          <h1 class="titulo" tabindex="-1">Hablemos por<br>WhatsApp</h1>
          <span class="acento-linea" aria-hidden="true"></span>
        </div>

        <div class="contacto__burbuja" aria-hidden="true">
          <svg class="contacto__wa-grande" viewBox="0 0 64 64" fill="none">
            <path d="M32 6C17.64 6 6 17.64 6 32c0 4.82 1.32 9.33 3.6 13.2L6.2 57.8l12.9-3.38A25.86 25.86 0 0 0 32 58c14.36 0 26-11.64 26-26S46.36 6 32 6z" fill="#25b83b"/>
            <path d="M32 10.5c11.87 0 21.5 9.63 21.5 21.5S43.87 53.5 32 53.5c-4.1 0-7.93-1.15-11.2-3.15l-.8-.48-7.65 2 2.05-7.45-.52-.83A21.38 21.38 0 0 1 10.5 32c0-11.87 9.63-21.5 21.5-21.5z" fill="#25b83b" stroke="#fff" stroke-width="3"/>
            <path d="M25.6 21.8c-.45-.98-.92-1-1.35-1.02h-1.15c-.4 0-1.05.15-1.6.75-.55.6-2.1 2.05-2.1 5s2.15 5.8 2.45 6.2c.3.4 4.15 6.65 10.25 9.05 5.07 2 6.1 1.6 7.2 1.5 1.1-.1 3.55-1.45 4.05-2.85.5-1.4.5-2.6.35-2.85-.15-.25-.55-.4-1.15-.7-.6-.3-3.55-1.75-4.1-1.95-.55-.2-.95-.3-1.35.3-.4.6-1.55 1.95-1.9 2.35-.35.4-.7.45-1.3.15-.6-.3-2.53-.93-4.82-2.98-1.78-1.59-2.98-3.55-3.33-4.15-.35-.6-.04-.92.26-1.22.27-.27.6-.7.9-1.05.3-.35.4-.6.6-1 .2-.4.1-.75-.05-1.05-.15-.3-1.32-3.25-1.85-4.45z" fill="#fff"/>
          </svg>
        </div>

        <div class="contacto__ayuda">
          <div class="contacto__tarjeta">
            <svg class="contacto__icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <span>Consultar<br>disponibilidad</span>
          </div>
          <div class="contacto__tarjeta">
            <svg class="contacto__icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>Coordinar<br>tu entrega</span>
          </div>
        </div>

        <a class="boton boton--verde contacto__accion" aria-disabled="true" target="_blank" rel="noopener noreferrer">
          <svg class="wa-icono" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.12c-.24.68-1.41 1.3-1.95 1.38-.52.08-1.18.11-1.9-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5.01-4.37-5.16-4.57-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.52c.28-.3.61-.38.81-.38h.58c.19 0 .44-.07.69.53.24.59.83 2.02.9 2.17.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.32.39-.45.52-.15.15-.31.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.45 1.51.3.15.48.13.66-.08.18-.2.76-.89.96-1.19.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.99.3.15.5.23.58.35.07.13.07.73-.17 1.41z"/>
          </svg>
          <span>Abrir WhatsApp</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </a>
        <p class="contacto__estado" role="status"></p>

        <button type="button" class="boton contacto__como-btn" aria-expanded="false" aria-controls="como-comprar">Cómo comprar</button>
        <p class="contacto__explicacion" id="como-comprar" hidden>Elige un producto del catálogo, selecciona cuántas cajas deseas y coordina la entrega directamente por WhatsApp.</p>
      </div>

      <div class="contacto__media">
        <img class="contacto__imagen" src="https://eworld2.dxn2u.com/optimized/hero-img-v2-6.jpg" width="1200" height="820" loading="lazy" alt="Productos DXN Ganoderma">
      </div>
    </div>
  `;

  // [HIDRATACIÓN] Vincula el botón de contacto con WhatsApp.
  const wa = vincularWhatsapp(
    contenedor.querySelector("a"),
    contenedor.querySelector("[role=status]"),
    () => "Hola, vi su catálogo DXN. Quisiera consultar por los productos disponibles."
  );

  // [ANIMACIÓN .slideToggle()] Despliega la explicación al hacer clic en "Cómo comprar".
  const limpiarEventos = delegarEventos(contenedor, "contacto", [
    [
      "click",
      "button",
      (_e, btn) =>
        btn.setAttribute("aria-expanded", String(alternarDesplegable(contenedor.querySelector("#como-comprar")))),
    ],
  ]);

  return () => {
    limpiarEventos();
    wa.limpiar();
  };
}
