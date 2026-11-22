/**
 * MÓDULO: js/modulos/carrusel.js
 * RESPONSABILIDAD:
 *  - Controlar el carrusel de 3 diapositivas (Lámparas, Focos, Cables) en Inicio.
 *  - Soportar botones Anterior/Siguiente, indicadores numéricos, pausa y gesto táctil (swipe).
 *  - Aplicar efectos jQuery en las tarjetas de categoría, sombra en cabecera y botón volver arriba.
 */

import { a as obtenerJQuery } from "../librerias/jquery.js";
import { b as interop } from "../librerias/interop-cjs.js";
import { hidratarBotones } from "../nucleo/utilidades-ui.js";

const jq = interop(obtenerJQuery());

function iniciarCarrusel() {
  const $ = jq.default;
  const $carrusel = $("#carrusel");
  const $slides = $carrusel.find("[data-slide]");
  const enlaces = ["#catalogo/lamparas", "#catalogo/focos", "#catalogo/cables"];
  const descripciones = [
    "Lámparas de techo y portátiles para tu hogar o negocio",
    "Focos LED, filamento, reflectores y opciones de tres tonos",
    "Cables eléctricos, cordones y cableado de red para cada uso"
  ];
  const etiquetas = ["Ver lámparas", "Ver focos", "Ver cables"];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  let indice = 0;
  let pausado = reduceMotion.matches;
  let temporizador;
  let toqueX = 0;

  /** Cambia la diapositiva activa con animación .fadeIn() de jQuery. */
  function irA(nuevo) {
    indice = (nuevo + $slides.length) % $slides.length;
    $slides.stop(true, true).prop("hidden", true).hide();
    const $actual = $slides.eq(indice);
    $actual.prop("hidden", false);
    reduceMotion.matches ? $actual.show() : $actual.fadeIn(300);

    const $texto = $carrusel.find(".portada__texto");
    $carrusel.find(".portada__descripcion").text(descripciones[indice]);
    $carrusel.find(".portada__enlace").attr("href", enlaces[indice]).text(etiquetas[indice]);
    if (!reduceMotion.matches) {
      $texto.stop(true, true).css("opacity", 0.35).animate({ opacity: 1 }, 240);
    }

    $carrusel
      .find("[data-pagina]")
      .attr("aria-pressed", "false")
      .eq(indice)
      .attr("aria-pressed", "true");
  }

  /** Programa la rotación automática cuando la pestaña e Inicio están visibles. */
  function programar() {
    clearInterval(temporizador);
    if (
      !pausado &&
      !document.hidden &&
      ["", "#inicio"].includes(location.hash) &&
      !$carrusel.is(":hover") &&
      !$carrusel[0].contains(document.activeElement)
    ) {
      temporizador = setInterval(() => irA(indice + 1), 5600);
    }
  }

  function actualizarBotonPausa() {
    $carrusel
      .find("[data-pausa]")
      .text(pausado ? "▶" : "Ⅱ")
      .attr("aria-label", pausado ? "Reproducir carrusel" : "Pausar carrusel");
  }

  /* Delegación de eventos con .off() y .on() para evitar duplicados */
  $carrusel
    .off(".carrusel")
    .on("click.carrusel", "[data-pagina]", function () {
      irA(Number(this.dataset.pagina));
    })
    .on("click.carrusel", "[data-anterior]", () => irA(indice - 1))
    .on("click.carrusel", "[data-siguiente]", () => irA(indice + 1))
    .on("click.carrusel", "[data-pausa]", () => {
      pausado = !pausado;
      actualizarBotonPausa();
      programar();
    })
    .on("touchstart.carrusel", e => {
      toqueX = e.originalEvent.changedTouches?.[0]?.clientX ?? 0;
    })
    .on("touchend.carrusel", e => {
      const finX = e.originalEvent.changedTouches?.[0]?.clientX ?? 0;
      const delta = finX - toqueX;
      if (Math.abs(delta) > 40) irA(delta < 0 ? indice + 1 : indice - 1);
    })
    .on("mouseenter.carrusel mouseleave.carrusel focusin.carrusel focusout.carrusel", () =>
      queueMicrotask(programar)
    );

  /* Efecto hover/focus jQuery en tarjetas de categoría del inicio */
  $(".categorias")
    .off(".categorias")
    .on("mouseenter.categorias focusin.categorias", ".categoria", function () {
      $(this).addClass("categoria--activa");
    })
    .on("mouseleave.categorias focusout.categorias", ".categoria", function () {
      $(this).removeClass("categoria--activa");
    });

  /* Sombra en cabecera y botón flotante "Volver arriba" */
  const $cabecera = $(".cabecera");
  const $subir = $("#subir");
  function actualizarScroll() {
    const y = $(window).scrollTop();
    $cabecera.toggleClass("cabecera--sombra", y > 12);
    if (y > 260) {
      if ($subir.prop("hidden")) {
        $subir.prop("hidden", false);
        if (!reduceMotion.matches) $subir.hide().fadeIn(180);
      }
    } else if (!$subir.prop("hidden")) {
      $subir.prop("hidden", true);
    }
  }
  $subir.off(".subir").on("click.subir", () => {
    reduceMotion.matches ? window.scrollTo(0, 0) : $("html, body").stop(true).animate({ scrollTop: 0 }, 320);
  });

  $(document).off("visibilitychange.carrusel").on("visibilitychange.carrusel", programar);
  $(window)
    .off(".carrusel")
    .on("hashchange.carrusel pageshow.carrusel", programar)
    .on("scroll.carrusel", actualizarScroll)
    .on("pagehide.carrusel", () => clearInterval(temporizador));

  reduceMotion.addEventListener("change", () => {
    pausado = reduceMotion.matches;
    actualizarBotonPausa();
    programar();
  });

  hidratarBotones($carrusel[0]);
  hidratarBotones($subir.parent()[0]);
  actualizarBotonPausa();
  actualizarScroll();
  programar();
}

export { iniciarCarrusel };
