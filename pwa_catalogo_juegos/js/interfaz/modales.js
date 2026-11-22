import { fragmentoSeguro } from "../seguridad/html-seguro.js";

/* Diálogos: inserción sanitizada, foco, cierre y cancelación de tareas. */
export function crearModales({ duracion, vista, pausarCarrusel }) {
  let opener = null, modalType = null, modalController = null;
  /* DIÁLOGOS: contenido dinámico, cierre y bloqueo del fondo. */ function openModal(content, type, id = null) {
    $("#modal").prop("hidden") && (opener = document.activeElement), modalController?.abort(), modalController = new AbortController(), modalType = type, $(".dialog").removeClass("dialog--log dialog--text").toggleClass("dialog--detail", type === "detail").toggleClass("dialog--log", type === "log").toggleClass("dialog--text", type === "text"), $("#mBody").empty().data("id", id).append(fragmentoSeguro(content)), $(".dialog").scrollTop(0), $("body").addClass("dialog-open"), $("header, main, footer, aside").prop("inert", true), $("#modal").stop(true, true).prop("hidden", false).hide().fadeIn(duracion()), $(".dialog").trigger("focus"), pausarCarrusel(true);
  }
  function closeModal() {
    modalController?.abort(), modalController = null, $("#modal").stop(true, true).fadeOut(duracion(), function() {
      $(this).prop("hidden", true), $("header, main, footer, aside").prop("inert", false), $("body").removeClass("dialog-open"), modalType = null, pausarCarrusel(false), opener && document.contains(opener) ? $(opener).trigger("focus") : $("#" + vista()).find("h1, h2").first().trigger("focus");
    });
  }
  return { openModal, closeModal, tipo: () => modalType, signal: () => modalController.signal, cancelar: () => modalController?.abort() };
}

