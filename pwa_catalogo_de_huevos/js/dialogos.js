/**
 * ============================================================================
 * MÓDULO: js/dialogos.js (CARGA DIFERIDA / LAZY MODULE)
 * RESPONSABILIDAD: Modales de detalle del producto, carrito en 2 pasos,
 * información del negocio y alertas de ayuda usando jQuery (.off/.on,
 * .show, .hide, .slideToggle) + Debounce en campos de entrada.
 * ============================================================================
 */

import { limpiarTexto, debounce, formatearPrecio, formatearMaples, porId } from "./catalogo.js";

const $ = window.jQuery;

/* ============================================================================
 * BLOQUE 1: MODAL DE DETALLE DEL PRODUCTO (#detalle)
 * Muestra toda la información del tamaño elegido y permite agregar al carrito.
 * ============================================================================ */
export function detalle(producto, cantidadActual, onGuardar) {
  const dlg = porId("detalle");
  if (dlg.open) return;

  const foto = porId("detalle-foto");
  foto.src = producto.imagen || "./img/maple-mediana.jpg";
  foto.alt = "Maple de 30 huevos " + producto.nombre;

  $("#detalle-titulo").text("Huevos de " + producto.nombre.toLocaleLowerCase("es"));
  $("#detalle-tamano").text(producto.tamano);
  $("#detalle-talla").text(producto.referencia || ("Talla " + producto.talla));
  $("#detalle-unidades").text(producto.unidades + " huevos por maple");
  $("#detalle-precio").text(formatearPrecio(producto.precioCentavos) + " por maple");
  $("#detalle-peso").text(producto.peso);
  porId("fila-peso").hidden = !producto.peso;

  let cant = cantidadActual > 0 ? cantidadActual : 1;
  const out = porId("detalle-cantidad");
  const btnMenos = porId("detalle-menos");
  const btnMas = porId("detalle-mas");
  const btnAgregar = porId("agregar");

  function refrescar() {
    out.value = String(cant);
    btnMenos.disabled = cant <= 1;
    btnMas.disabled = cant >= 999;
    btnAgregar.textContent =
      (cantidadActual > 0 ? "Actualizar (" : "Agregar ") +
      formatearMaples(cant) +
      (cantidadActual > 0 ? ")" : " al carrito");
  }
  refrescar();

  /* Delegación con .off() y .on() para evitar duplicación de eventos al reabrir. */
  $(btnMenos).off(".detalle").on("click.detalle", () => {
    if (cant > 1) { cant--; refrescar(); }
  });
  $(btnMas).off(".detalle").on("click.detalle", () => {
    if (cant < 999) { cant++; refrescar(); }
  });
  $(btnAgregar).off(".detalle").on("click.detalle", () => {
    onGuardar(cant);
    dlg.close();
  });

  /* Prevención de Memory Leaks al cerrar el modal. */
  $(dlg).off(".detalle").one("close.detalle", () => {
    $(btnMenos).off(".detalle");
    $(btnMas).off(".detalle");
    $(btnAgregar).off(".detalle");
  });

  dlg.showModal();
}

/* ============================================================================
 * BLOQUE 2: MODAL DEL CARRITO EN 2 PASOS (#carrito)
 * Paso 1: Revisar, modificar (+ / -) o descartar (×) productos.
 * Paso 2: Al pulsar "Confirmar productos", muestra entrega/pago y "Pedir por WhatsApp".
 * ============================================================================ */
export function abrirCarrito({
  obtenerItems,
  onCambiar,
  onDescartar,
  onEnviarWhatsApp,
  iniciarConfirmado = false
}) {
  const dlg = porId("carrito");
  if (dlg.open) return;

  let confirmado = iniciarConfirmado;
  const lista = porId("carrito-lista");
  const vacio = porId("carrito-vacio");
  const totales = porId("carrito-totales");
  const entregaBox = porId("carrito-datos-entrega");
  const btnConfirmar = porId("carrito-confirmar-btn");
  const btnWhatsapp = porId("carrito-whatsapp-btn");
  const campoDir = porId("campo-direccion");

  function actualizarEntrega() {
    const esDelivery = $('input[name="entrega"]:checked').val() === "Delivery";
    campoDir.hidden = !esDelivery;
  }

  function render() {
    const items = obtenerItems();
    const hayItems = items.length > 0;
    vacio.hidden = hayItems;
    lista.hidden = !hayItems;
    totales.hidden = !hayItems;

    if (!hayItems) {
      confirmado = false;
      entregaBox.hidden = true;
      btnConfirmar.hidden = true;
      btnWhatsapp.hidden = true;
      lista.replaceChildren();
      return;
    }

    let totalMaples = 0;
    let totalCentavos = 0;
    const frag = document.createDocumentFragment();

    for (const { producto, cantidad } of items) {
      totalMaples += cantidad;
      totalCentavos += cantidad * producto.precioCentavos;

      const li = document.createElement("li");
      li.className = "carrito-item";

      const infoEl = document.createElement("div");
      infoEl.className = "carrito-item__info";
      const nom = document.createElement("strong");
      nom.textContent = producto.nombre + " (" + producto.talla + ")";
      const sub = document.createElement("span");
      sub.textContent = formatearPrecio(producto.precioCentavos) + " c/u · " + formatearPrecio(cantidad * producto.precioCentavos);
      infoEl.append(nom, sub);

      const ctrlEl = document.createElement("div");
      ctrlEl.className = "carrito-item__ctrl";

      const bMenos = document.createElement("button");
      bMenos.type = "button";
      bMenos.className = "boton carrito-item__btn";
      bMenos.textContent = "−";
      bMenos.setAttribute("aria-label", "Quitar 1 de " + producto.nombre);
      bMenos.dataset.id = producto.id;
      bMenos.dataset.op = "menos";

      const qty = document.createElement("output");
      qty.className = "carrito-item__qty";
      qty.value = String(cantidad);

      const bMas = document.createElement("button");
      bMas.type = "button";
      bMas.className = "boton carrito-item__btn";
      bMas.textContent = "+";
      bMas.setAttribute("aria-label", "Agregar 1 de " + producto.nombre);
      bMas.dataset.id = producto.id;
      bMas.dataset.op = "mas";

      const bDel = document.createElement("button");
      bDel.type = "button";
      bDel.className = "boton boton--claro carrito-item__del";
      bDel.textContent = "×";
      bDel.setAttribute("aria-label", "Descartar " + producto.nombre);
      bDel.dataset.id = producto.id;
      bDel.dataset.op = "descartar";

      ctrlEl.append(bMenos, qty, bMas, bDel);
      li.append(infoEl, ctrlEl);
      frag.append(li);
    }

    lista.replaceChildren(frag);
    $("#carrito-resumen-texto").text(formatearMaples(totalMaples));
    $("#carrito-total-bs").text(formatearPrecio(totalCentavos));

    entregaBox.hidden = !confirmado;
    btnConfirmar.hidden = confirmado;
    btnWhatsapp.hidden = !confirmado;
    if (confirmado) actualizarEntrega();
  }

  /* Delegación dinámica con .off() y .on() sobre los ítems del carrito. */
  $(lista).off(".carrito").on("click.carrito", "button[data-op]", function () {
    const { id, op } = this.dataset;
    if (op === "descartar") onDescartar(id);
    else onCambiar(id, op === "mas" ? 1 : -1);
    render();
  });

  $(btnConfirmar).off(".carrito").on("click.carrito", () => {
    confirmado = true;
    render();
  });

  /* Evento change en modalidad de entrega. */
  $('input[name="entrega"]').off(".carrito").on("change.carrito", actualizarEntrega);

  /* Evento input con Debounce y sanitización DOMPurify en tiempo real. */
  const validarInput = debounce(el => {
    el.value = limpiarTexto(el.value, el.maxLength || 60);
  }, 250);
  $("#cliente-nombre,#cliente-direccion").off(".carrito").on("input.carrito", function () {
    validarInput(this);
  });

  /* Evento submit del formulario del pedido. */
  $("#form-carrito").off(".carrito").on("submit.carrito", e => {
    e.preventDefault();
    if (!confirmado || !obtenerItems().length) return;
    const entrega = $('input[name="entrega"]:checked').val() || "Retiro en tienda";
    const pago = $('input[name="pago"]:checked').val() || "Efectivo";
    const nombre = limpiarTexto(porId("cliente-nombre").value, 48);
    const direccion = entrega === "Delivery" ? limpiarTexto(porId("cliente-direccion").value, 90) : "";
    dlg.close();
    onEnviarWhatsApp({ nombre, entrega, direccion, pago });
  });

  /* Limpieza de eventos al cerrar el diálogo (Prevención de Memory Leaks). */
  $(dlg).off(".carrito").one("close.carrito", () => {
    $(lista).off(".carrito");
    $(btnConfirmar).off(".carrito");
    $('input[name="entrega"]').off(".carrito");
    $("#cliente-nombre,#cliente-direccion").off(".carrito");
    $("#form-carrito").off(".carrito");
  });

  render();
  dlg.showModal();
}

/* ============================================================================
 * BLOQUE 3: MODAL DE INFORMACIÓN DEL NEGOCIO (#info)
 * ============================================================================ */
export function info(datosNegocio, onWhatsapp) {
  const dlg = porId("info");
  if (dlg.open) return;

  $("#info-horario").text(datosNegocio.horario);
  $("#info-zona").text(datosNegocio.zona);

  $("#info-whatsapp").off(".info").on("click.info", () => {
    dlg.close();
    onWhatsapp();
  });

  $(dlg).off(".info").one("close.info", () => {
    $("#info-whatsapp").off(".info");
  });

  dlg.showModal();
}

/* ============================================================================
 * BLOQUE 4: MODAL DE AYUDA / ALERTAS (#ayuda)
 * Utiliza manipulaciones jQuery: .show(), .hide() y .slideToggle().
 * ============================================================================ */
export function ayuda(titulo, mensaje, pasos = "") {
  const dlg = porId("ayuda");
  if (dlg.open) return;

  const btnExtra = $("#ayuda-extra");
  const txtPasos = $("#ayuda-pasos").text(pasos).prop("hidden", false).stop(true, true).hide();

  $("#ayuda-titulo").text(titulo);
  $("#ayuda-mensaje").text(mensaje);
  btnExtra.off(".ayuda").attr("aria-expanded", "false");
  pasos ? btnExtra.show() : btnExtra.hide();

  btnExtra.on("click.ayuda", () => {
    const dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 135;
    txtPasos.stop(true, true).slideToggle(dur);
    btnExtra.attr("aria-expanded", btnExtra.attr("aria-expanded") === "false" ? "true" : "false");
  });

  $(dlg).off(".ayuda").one("close.ayuda", () => {
    txtPasos.stop(true, true).hide();
    btnExtra.off(".ayuda");
  });

  dlg.showModal();
}
