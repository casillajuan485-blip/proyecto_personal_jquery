import { escapeHTML as escape, record } from "../utilidades.js";
import { fragmentoSeguro } from "../seguridad/html-seguro.js";

/* Carrusel: diapositivas, estado de pausa, transición y limpieza del temporizador. */
export function crearCarrusel({ juegos, media, duracion, vista }) {
  let featured = juegos.filter((game) => game.featured), pause = { manual: media.matches, hover: false, focus: false, modal: false }, slideIndex = 0, carouselTimer = null, slideRemaining = 6;
  function goTo(index) {
    if (!featured.length) return;
    slideIndex = (index + featured.length) % featured.length, slideRemaining = 6;
    let game = featured[slideIndex];
    const escena = game.hero;
    $("#slides").stop(true, true).css("min-height", $("#slides").height()).fadeOut(duracion(), function() {
      $(this).empty().append(fragmentoSeguro(`<div class="carousel__slide carousel__slide--transition" data-id="${escape(game.id)}"><img class="carousel__image" loading="eager" fetchpriority="auto" decoding="async" src="${escape(escena)}" alt="" width="1280" height="720"><div class="carousel__content"><span class="featured-label">\u2726 DESTACADO DE ATLAS</span><h3 title="${escape(game.name)}">${escape(game.name)}</h3><p>${escape(game.synopsis)}</p><button class="btn primary detail" type="button">Explorar \u2192</button></div></div>`)).fadeIn(duracion(), () => $(this).css("min-height", ""));
    }), $("#dots button").removeAttr("aria-current").eq(slideIndex).attr("aria-current", "true");
  }
  /* TEMPORIZADOR: avance del carrusel con pausas y limpieza. */ function refreshCarouselTimer() {
    clearInterval(carouselTimer), carouselTimer = null;
    let playing = vista() === "inicio" && featured.length > 1 && !Object.values(pause).some(Boolean) && !document.hidden;
    $("#carouselClock").text(playing ? "Siguiente en " + slideRemaining + " s" : "En pausa"), playing && (carouselTimer = setInterval(() => {
      slideRemaining--, slideRemaining <= 0 && (goTo(slideIndex + 1), record("timer", "Cambio autom\xE1tico del destacado.")), $("#carouselClock").text("Siguiente en " + slideRemaining + " s");
    }, 1e3));
  }
  function setManualPause(value) {
    pause.manual = value, record("timer", value ? "Carrusel pausado." : "Carrusel reanudado."), $("#pp").attr("aria-label", value ? "Reanudar avance autom\xE1tico" : "Pausar avance autom\xE1tico").find("i").empty().attr("class", value ? "bi bi-play" : "bi bi-pause"), refreshCarouselTimer();
  }
  return { featured, pause, goTo, refreshCarouselTimer, setManualPause, mover: diferencia => goTo(slideIndex + diferencia), detener: () => clearInterval(carouselTimer) };
}
