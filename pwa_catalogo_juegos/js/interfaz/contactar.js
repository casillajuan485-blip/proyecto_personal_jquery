import { telefonoVendedor } from "../datos/vendedor.js";

/* Se comparte el mismo número en Contacto y en todas las fichas. */
export function mostrarWhatsApp(destino, juego, { etiqueta, botonPendiente = false } = {}) {
  const numero = telefonoVendedor.replace(/[\s()+-]/g, "");
  if (!/^591[0-9]{8}$/.test(numero)) {
    if (botonPendiente) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "btn primary contactar-vendedor";
      boton.textContent = etiqueta;
      destino.replaceChildren(boton);
    } else {
      destino.textContent = "WhatsApp pendiente de configurar.";
    }
    return;
  }
  const enlace = document.createElement("a");
  const mensaje = juego ? "Hola, ¿tiene disponible " + juego + "?" : "Hola, quisiera consultar por los juegos del catálogo.";
  enlace.href = "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensaje);
  enlace.className = "btn primary dialog__phone";
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  enlace.textContent = etiqueta ?? ("Abrir WhatsApp · +" + numero);
  destino.replaceChildren(enlace);
}
export function abrirContactoVendedor(openModal, juego) {
  openModal('<h2 id="mTitle">Consultar por WhatsApp</h2><p id="telefonoVendedor"></p>', "contacto");
  mostrarWhatsApp(document.querySelector("#telefonoVendedor"), juego);
}
