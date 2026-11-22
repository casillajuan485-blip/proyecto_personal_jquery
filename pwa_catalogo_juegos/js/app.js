import { loadCatalog } from "./datos/catalogos.js";
import { cargarSeccion } from "./datos/secciones.js";
import { startPWA } from "./pwa/instalacion.js";
import { cover, etiquetasConsola } from "./componentes/tarjeta-juego.js";
import { crearCarrusel } from "./interfaz/carrusel.js";
import { crearModales } from "./interfaz/modales.js";
import { abrirContactoVendedor, mostrarWhatsApp } from "./interfaz/contactar.js";
import { hidratarControles } from "./interfaz/hidratacion.js";
import { crearCatalogo } from "./interfaz/catalogo.js";
import { fragmentoSeguro } from "./seguridad/html-seguro.js";
import { iniciarMetricas } from "./pwa/metricas.js";
/* ATLAS PIXEL: lógica frontend. Comentarios solo por bloques. */
import { debounce, escapeHTML, pageSize, record } from "./utilidades.js";
$(async function() {
  iniciarMetricas();
  document.documentElement.dataset.hydration = "connecting";
  let lifetime = new AbortController(), eventTargets = /* @__PURE__ */ new Set();
  function track($root) {
    return $root.each((_, node) => eventTargets.add(node)), $root;
  }
  function cleanupEvents() {
    for (let node of eventTargets) $(node).off(".atlas");
    eventTargets.clear();
  }
  lifetime.signal.addEventListener("abort", cleanupEvents, { once: true });
  let viewTimers = /* @__PURE__ */ new Set();
  function later(fn, ms) {
    let id = setTimeout(() => {
      viewTimers.delete(id), fn();
    }, ms);
    return viewTimers.add(id), id;
  }
  function cleanupView() {
    for (let id of viewTimers) clearTimeout(id);
    viewTimers.clear(), $(".click-wave").remove(), $(".game-card").removeClass("card-pressed favorite-celebrate");
  }
  let GAMES;
  try {
    let loaded = await loadCatalog(lifetime.signal, record);
    GAMES = loaded.games, loaded.source !== "json" && $("#note").text("Cat\xE1logo de respaldo disponible. Puedes seguir explorando.").prop("hidden", false), record("fetch", "Cat\xE1logo cargado desde " + loaded.source + ".");
  } catch {
    $("#bootStatus").text("No se pudo abrir el cat\xE1logo. Recarga cuando tengas conexi\xF3n."), $("#main").attr("aria-busy", "false");
    return;
  }
  $("#bootStatus").remove(), $("#main").attr("aria-busy", "false");
  let KEYS = { favorites: "atlaspixel.favs", theme: "atlaspixel.theme" }, PAGE_SIZE = pageSize(innerWidth), state = { q: "", genre: "", plat: "", year: "", collection: "", sort: "az", page: 1, favPage: 1 }, collections = {}, views = ["inicio", "catalogo", "favoritos", "contactos"], media = window.matchMedia("(prefers-reduced-motion: reduce)"), duration = media.matches ? 0 : 180, favorites = /* @__PURE__ */ new Set(), activeView = "inicio", notificationTimer = null, byId = (id) => GAMES.find((game) => game.id === id), unique = (key) => [...new Set(GAMES.flatMap((game) => game[key]))], escape = escapeHTML;
  function storageWarning() {
    $("#note").text("No pudimos guardar tus preferencias. Puedes seguir usando la p\xE1gina durante esta sesi\xF3n.").prop("hidden", false).hide().slideDown(duration);
  }
  function persist(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      storageWarning();
    }
  }
  function setTheme(theme, save = true) {
    let light = theme === "light";
    $("html").attr("data-theme", light ? "light" : "dark"), $("#themeBtn").attr({ "aria-pressed": String(light), "aria-label": light ? "Activar tema oscuro" : "Activar tema claro" }).find("i").empty().attr("class", light ? "bi bi-moon" : "bi bi-sun"), save && persist(KEYS.theme, light ? "light" : "dark");
  }
  function loadPreferences() {
    try {
      let raw = localStorage.getItem(KEYS.favorites);
      if (raw) try {
        let ids = JSON.parse(raw);
        if (Array.isArray(ids)) ids.filter(id => typeof id === "string" && byId(id)).forEach(id => favorites.add(id));
      } catch {
        favorites.clear();
      }
      setTheme(localStorage.getItem(KEYS.theme), false);
    } catch {
      setTheme("dark", false), storageWarning();
    }
  }
  function notify(message) {
    clearTimeout(notificationTimer), $("#toast").stop(true, true).text(message).slideDown(duration), notificationTimer = setTimeout(() => $("#toast").stop(true, true).fadeOut(duration), 2600);
  }
  /* NAVEGACIÓN: activa una pantalla y actualiza foco e historial. */ function showView(id, focus = true) {
    cleanupView(), searchCatalog.cancel(), activeView = views.includes(id) ? id : "inicio", document.body.dataset.view = activeView, prepararSeccion(activeView), $("#filters").stop(true, true).prop("hidden", true).hide(), $("#filtBtn").attr("aria-expanded", "false"), $("#nav a").each(function() {
      $(this).attr("aria-label", this.textContent.trim());
    }), record("navigation", "Vista: " + activeView), $("main > .view").stop(true, true).prop("hidden", true).hide(), $("#" + activeView).prop("hidden", false).fadeIn(duration), activeView === "catalogo" && renderCatalog(), activeView === "favoritos" && renderFavorites(), viewport(), $("#sideNav a, #nav a").removeAttr("aria-current").filter('[href="#' + activeView + '"]').attr("aria-current", "page"), $("#menuBtn").attr({ "aria-expanded": "false", "aria-label": "Abrir men\xFA" }), document.title = "Atlas Pixel \xB7 " + { inicio: "Inicio", catalogo: "Cat\xE1logo", favoritos: "Favoritos", contactos: "Contacto" }[activeView], refreshCarouselTimer(), focus && (window.scrollTo({ top: 0, behavior: "instant" }), $("#" + activeView).find("h1, h2").first().trigger("focus"));
  }
  function navigate(id, focus = true) {
    location.hash === "#" + id ? showView(id, focus) : location.hash = id;
  }
    const { renderCatalog, renderFavorites, syncFavorites, renderHome, buildFilters, clearFilters } = crearCatalogo({ juegos: GAMES, estado: state, favorites, byId, unique, medidas: () => ({ page: PAGE_SIZE, vista: activeView, duration, collections }), tipoModal: () => modales.tipo(), cancelarBusqueda: () => searchCatalog.cancel(), ajustarViewport: () => viewport() });
  function togglePanel($panel, $button) {
    $panel.stop(true, true);
    let opening = $panel.prop("hidden");
    opening ? $panel.prop("hidden", false).hide().slideToggle(duration) : $panel.slideToggle(duration, () => $panel.prop("hidden", true)), $button.attr("aria-expanded", String(opening));
  }
  function showDetail(id) {
    let game = byId(id);
    if (!game) return;
    let images = galleryImages(game), tabs = ["Resumen", "Galer\xEDa", "Datos"];
    openModal(`<div class="dialog__heading"><span class="eyebrow">DESCUBRE EL JUEGO</span><h2 id="mTitle">${escape(game.name)}</h2></div>
      <div class="dialog__tabs" role="tablist" aria-label="Ficha del juego">${tabs.map((t, i) => `<button class="btn" id="detail-tab-${i}" role="tab" aria-selected="${i === 0}" aria-controls="detail-pane-${i}" tabindex="${i === 0 ? 0 : -1}" data-detail-tab="${i}">${t}</button>`).join("")}</div>
      <div class="dialog__pane" id="detail-pane-0" role="tabpanel" aria-labelledby="detail-tab-0"><img class="detail-scene" width="1280" height="720" decoding="async" src="${escape(game.hero)}" alt="Captura de ${escape(game.name)}"><div class="detail-summary"><p class="detail-synopsis">${escape(game.synopsis)}</p><p>${escape(game.description)}</p><div class="tags"><span class="tag">${escape(game.genres.join(" \xB7 "))}</span></div>${etiquetasConsola(game.platforms)}</div></div>
      <div class="dialog__pane" id="detail-pane-1" role="tabpanel" aria-labelledby="detail-tab-1" hidden><div class="game-gallery" role="region" aria-label="Galer\xEDa"><div class="gallery-heading"><h3>Dentro de este mundo</h3><span id="galleryCount" role="status">1 de ${images.length}</span></div><div class="gallery-stage"><img class="dialog__gallery-image" width="1280" height="720" decoding="async" data-src="${escape(images[0].src)}" alt="${escape(images[0].label + " de " + game.name)}"><button class="gallery-arrow gallery-prev" aria-label="Imagen anterior">\u2039</button><button class="gallery-arrow gallery-next" aria-label="Imagen siguiente">\u203A</button><p class="gallery-error" hidden>Imagen no disponible.</p></div><div class="gallery-thumbs">${images.map((img, i) => `<button class="dialog__gallery-thumb" data-index="${i}" aria-pressed="${i === 0}" aria-label="Imagen ${i + 1}"><img loading="lazy" decoding="async" data-src="${escape(img.src)}" alt="${escape(img.label)}"></button>`).join("")}</div></div></div>
      <div class="dialog__pane" id="detail-pane-2" role="tabpanel" aria-labelledby="detail-tab-2" hidden><dl class="game-data"><dt>Juego</dt><dd>${escape(game.name)}</dd><dt>Plataformas</dt><dd>${escape(game.platforms.join(" \xB7 "))}</dd><dt>G\xE9neros</dt><dd>${escape(game.genres.join(" \xB7 "))}</dd><dt>Año de edición</dt><dd>${game.year}</dd></dl><p class="edition-note">Im\xE1genes \xA9 sus respectivos titulares.</p></div>
      <div class="dialog__actions"><button class="btn fav" type="button" aria-pressed="${favorites.has(id)}" data-id="${escape(id)}"><i class="bi ${favorites.has(id) ? "bi-heart-fill" : "bi-heart"}" aria-hidden="true"></i><span>${favorites.has(id) ? "Quitar de favoritos" : "Agregar a favoritos"}</span></button><button class="btn primary contactar-vendedor" type="button">Consultar por WhatsApp</button></div>`, "detail", id), $("#mBody").data("galleryIndex", 0), record("click", "Ficha de videojuego abierta.");
  }
  function galleryImages(game) {
    return game.gallery?.length ? game.gallery : [{ src: game.hero, label: "Captura del juego" }, { src: game.cover, label: "Arte promocional" }];
  }
  function changeGallery(index) {
    if (modales.tipo() !== "detail") return;
    let game = byId($("#mBody").data("id")), images = galleryImages(game);
    index = (index + images.length) % images.length, $("#mBody").data("galleryIndex", index), $(".gallery-error").prop("hidden", true), $(".dialog__gallery-image").stop(true, true).fadeOut(duration, function() {
      $(this).attr({ src: images[index].src, alt: images[index].label + " de " + game.name }).fadeIn(duration);
    }), $("#galleryCount").text(index + 1 + " de " + images.length), $(".dialog__gallery-thumb").attr("aria-pressed", "false").eq(index).attr("aria-pressed", "true");
  }
  function showQuickView(id) {
    const game = byId(id);
    if (!game) return;
    openModal(`<span class="eyebrow">VISTA RÁPIDA</span><h2 id="mTitle">${escape(game.name)}</h2>${cover(game)}<p>${escape(game.synopsis)}</p>${etiquetasConsola(game.platforms)}<div class="quick-actions"><button class="btn detail" type="button" data-id="${escape(id)}">Ver ficha completa ↗</button><div id="quickWhatsApp"></div></div>`, "quick", id);
    mostrarWhatsApp(document.querySelector("#quickWhatsApp"), game.name, {
      etiqueta: "Consultar por WhatsApp",
      botonPendiente: true
    });
  }
  /* Las secciones dinámicas se hidratan al abrirse y comparten sus eventos delegados. */
  const tareasSeccion = new Map();
  function prepararSeccion(id) {
    const nombre = id === "inicio" || id === "catalogo" ? "colecciones" : null;
    if (!nombre || tareasSeccion.has(nombre)) return;
    tareasSeccion.set(nombre, cargarSeccion(nombre, lifetime.signal).then(data => {
      if (lifetime.signal.aborted) return;
      collections = data;
      buildCollections();
    }).catch(() => {
      tareasSeccion.delete(nombre);
      notify("No se pudo abrir esta sección. Intenta nuevamente.");
    }));
  }
  function buildCollections() {
    const tiles = Object.entries(collections).map(([key, item]) => `<button type="button" class="collection-tile" data-collection="${escape(key)}"><i class="bi bi-${escape(item.icon)}" aria-hidden="true"></i><span><strong>${escape(item.title)}</strong><small>${escape(item.description)}</small></span><span class="collection-count">${item.ids.filter(byId).length} →</span></button>`);
    $("#collections").empty().append(fragmentoSeguro(tiles.join("")));
  }
  const carrusel = crearCarrusel({ juegos: GAMES, media, duracion: () => duration, vista: () => activeView });
  const { featured, pause, goTo, refreshCarouselTimer, setManualPause } = carrusel;
  const modales = crearModales({
    duracion: () => duration, vista: () => activeView, 
    pausarCarrusel: valor => { pause.modal = valor; refreshCarouselTimer(); }
  });
  const { openModal, closeModal } = modales;
  track($("#main")).off("pointermove.atlas", ".game-card").on("pointermove.atlas", ".game-card", function(event) {
    if (media.matches || event.originalEvent?.pointerType === "touch") return;
    let box = this.getBoundingClientRect();
    if (!box.width || !box.height) return;
    let x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
    $(this).css({ "--pointer-x": x * 100 + "%", "--pointer-y": y * 100 + "%", "--tilt-x": (0.5 - y) * 5 + "deg", "--tilt-y": (x - 0.5) * 7 + "deg" });
  }).off("pointerleave.atlas", ".game-card").on("pointerleave.atlas", ".game-card", function() {
    $(this).css({ "--tilt-x": "0deg", "--tilt-y": "0deg" });
  }).off("pointerdown.atlas", ".game-card").on("pointerdown.atlas", ".game-card", function(event) {
    if (media.matches || event.button !== void 0 && event.button !== 0) return;
    let box = this.getBoundingClientRect(), size = Math.max(box.width, box.height) * 2, $wave = $("<span class='click-wave' aria-hidden='true'>").css({ width: size, height: size, left: event.clientX - box.left - size / 2, top: event.clientY - box.top - size / 2 });
    $(this).append($wave).addClass("card-pressed"), later(() => $(this).removeClass("card-pressed"), 180), later(() => $wave.remove(), 700);
  }).off("click.atlas", ".game-card").on("click.atlas", ".game-card", function(event) {
    $(event.target).closest("button, a").length || showDetail($(this).data("id"));
  }), track($(document)).off("click.atlas", "a[href^='#']").on("click.atlas", "a[href^='#']", function(event) {
    let id = this.getAttribute("href").slice(1);
    views.includes(id) && (event.preventDefault(), navigate(id));
  }), track($(window)).off("hashchange.atlas").on("hashchange.atlas", () => showView(location.hash.slice(1)));
  function focusSearch() {
    activeView !== "catalogo" && (history.pushState(null, "", "#catalogo"), showView("catalogo", false)), $("#filters").stop(true, true).prop("hidden", false).show(), $("#filtBtn").attr("aria-expanded", "true"), document.querySelector("#globalSearch").focus();
  }
  let searchCatalog = debounce(function() {
    state.q = $("#globalSearch").val(), renderCatalog(true), record("input", "B\xFAsqueda actualizada despu\xE9s de una pausa."), activeView !== "catalogo" && (history.pushState(null, "", "#catalogo"), showView("catalogo", false));
  }, 250);
  track($("#globalSearch")).off("input.atlas").on("input.atlas", searchCatalog).off("keydown.atlas").on("keydown.atlas", function(event) {
    event.key === "Enter" && (event.preventDefault(), searchCatalog.cancel(), state.q = this.value, renderCatalog(true), navigate("catalogo"));
  }), track($("#plat, #year, #sort")).off("change.atlas").on("change.atlas", function() {
    this.id === "sort" && !["az", "za", "new", "old"].includes(this.value) || (state[this.id] = this.value, renderCatalog(true), record("change", "Control de cat\xE1logo actualizado."));
  }), track($("#genres")).off("click.atlas", ".chip").on("click.atlas", ".chip", function() {
    state.genre = $(this).data("genre"), renderCatalog(true);
  }), track($("#activeFilters")).off("click.atlas", ".catalog-filters__tag").on("click.atlas", ".catalog-filters__tag", function() {
    let key = $(this).data("key");
    ["q", "genre", "plat", "year", "collection"].includes(key) && (state[key] = "", key === "q" ? $("#globalSearch").val("") : ["genre", "collection"].includes(key) || $("#" + key).val(""), renderCatalog(true), $("#count").attr("tabindex", "-1").trigger("focus"));
  }), track($("#clear, #clear2")).off("click.atlas").on("click.atlas", () => {
    clearFilters(), $("#filtBtn").trigger("focus");
  }), track($("#filtBtn")).off("click.atlas").on("click.atlas", function() {
    togglePanel($("#filters"), $(this));
  }), track($("#helpBtn")).off("click.atlas").on("click.atlas", function() {
    let $panel = $("#help").stop(true, true), open = $panel.prop("hidden");
    open && $panel.prop("hidden", false).hide(), $panel.fadeToggle(duration, () => {
      open || $panel.prop("hidden", true);
    }), $(this).attr("aria-expanded", String(open));
  }), track($("#pagination, #favPagination")).off("click.atlas", ".page-btn").on("click.atlas", ".page-btn", function() {
    if ($(this).prop("disabled")) return;
    let page = $(this).data("page");
    $(this).data("kind") === "catalog" ? (state.page = page, renderCatalog()) : (state.favPage = page, renderFavorites()), $("#" + activeView).find("h2").first().trigger("focus"), window.scrollTo({ top: 0, behavior: "instant" });
  }), track($("#main, #modal")).off("click.atlas", ".detail").on("click.atlas", ".detail", function(event) {
    event.preventDefault(), event.stopPropagation(), showDetail(this.dataset.gameId || $(this).closest("[data-id]").data("id"));
  }), track($("#main")).off("click.atlas", ".quick-view").on("click.atlas", ".quick-view", function(event) {
    event.preventDefault(), event.stopPropagation(), showQuickView(this.dataset.gameId || $(this).closest("[data-id]").data("id"));
  }), track($("#collections")).off("click.atlas", ".collection-tile").on("click.atlas", ".collection-tile", function() {
    let key = $(this).data("collection");
    collections[key] && (clearFilters(), state.collection = key, renderCatalog(true), navigate("catalogo"));
  }), track($("#mBody")).off("click.atlas", ".dialog__gallery-thumb").on("click.atlas", ".dialog__gallery-thumb", function() {
    changeGallery(Number($(this).data("index")));
  }).off("click.atlas", ".gallery-prev").on("click.atlas", ".gallery-prev", () => changeGallery($("#mBody").data("galleryIndex") - 1)).off("click.atlas", ".gallery-next").on("click.atlas", ".gallery-next", () => changeGallery($("#mBody").data("galleryIndex") + 1)).off("keydown.atlas", ".game-gallery button").on("keydown.atlas", ".game-gallery button", (event) => {
    (event.key === "ArrowRight" || event.key === "ArrowLeft") && (event.preventDefault(), changeGallery($("#mBody").data("galleryIndex") + (event.key === "ArrowRight" ? 1 : -1)));
  }), track($("#main, #modal")).off("click.atlas", ".fav").on("click.atlas", ".fav", function(event) {
    event.preventDefault(), event.stopPropagation();
    let id = this.dataset.gameId || $(this).closest("[data-id]").data("id");
    if (!byId(id)) return;
    let inFavorites = $(this).closest("#favGrid").length > 0, inCard = $(this).closest(".game-card").length > 0, added = !favorites.has(id);
    if (added ? favorites.add(id) : favorites.delete(id), persist(KEYS.favorites, JSON.stringify([...favorites])), syncFavorites(id), record("favorite", added ? "Juego agregado a favoritos." : "Juego quitado de favoritos."), added && !media.matches) {
      let $buttons = $(".game-card").filter(function() {
        return $(this).data("id") === id;
      }).find(".fav").addClass("favorite-celebrate");
      later(() => $buttons.removeClass("favorite-celebrate"), 650);
    }
    if (inFavorites) {
      let $next = $("#favGrid .fav").first();
      ($next.length ? $next : $("#favEmpty a")).trigger("focus");
    } else inCard && $("#" + activeView + " .game-card").filter(function() {
      return $(this).data("id") === id;
    }).find(".fav").trigger("focus");
    notify((added ? "Guardado en favoritos: " : "Quitado de favoritos: ") + byId(id).name);
  }), track($("#themeBtn")).off("click.atlas").on("click.atlas", () => setTheme($("html").attr("data-theme") === "light" ? "dark" : "light")), track($("#menuBtn")).off("click.atlas").on("click.atlas", function() {
    $("#nav").stop(true, true).slideToggle(duration);
    let open = $(this).attr("aria-expanded") !== "true";
    $(this).attr({ "aria-expanded": String(open), "aria-label": open ? "Cerrar men\xFA" : "Abrir men\xFA" });
  });
  let mobile = window.matchMedia("(max-width: 680px)").matches;
  track($(window)).off("resize.atlas").on("resize.atlas", () => {
    let next = window.matchMedia("(max-width: 680px)").matches;
    next !== mobile && (mobile = next, $("#nav").stop(true, true).removeAttr("style"), $("#menuBtn").attr({ "aria-expanded": "false", "aria-label": "Abrir men\xFA" }));
  }), track($("#mClose, #modal .dialog__backdrop")).off("click.atlas").on("click.atlas", closeModal), track($(document)).off("keydown.atlas").on("keydown.atlas", (event) => {
    if ($("#modal").prop("hidden")) event.key === "/" && !$(event.target).is("input, select, textarea") && (event.preventDefault(), focusSearch());
    else if (event.key === "Escape" && (event.preventDefault(), closeModal()), event.key === "Tab") {
      let $focus = $(".dialog").find("button, a[href], input, select, textarea").not(":disabled").filter(":visible"), first = $focus.first()[0], last = $focus.last()[0];
      if (!first) return;
      event.shiftKey && (document.activeElement === first || document.activeElement === $(".dialog")[0]) ? (event.preventDefault(), last.focus()) : !event.shiftKey && document.activeElement === last && (event.preventDefault(), first.focus());
    }
  }), track($("#prev")).off("click.atlas").on("click.atlas", () => {
    carrusel.mover(-1), refreshCarouselTimer();
  }), track($("#next")).off("click.atlas").on("click.atlas", () => {
    carrusel.mover(1), refreshCarouselTimer();
  }), track($("#pp")).off("click.atlas").on("click.atlas", () => setManualPause(!pause.manual)), track($("#dots")).off("click.atlas", "button").on("click.atlas", "button", function() {
    goTo($(this).data("index")), refreshCarouselTimer();
  }), track($("#carousel")).off("mouseenter.atlas").on("mouseenter.atlas", () => {
    pause.hover = true, refreshCarouselTimer();
  }).off("mouseleave.atlas").on("mouseleave.atlas", () => {
    pause.hover = false, refreshCarouselTimer();
  }).off("focusin.atlas").on("focusin.atlas", () => {
    pause.focus = true, refreshCarouselTimer();
  }).off("focusout.atlas").on("focusout.atlas", (event) => {
    pause.focus = !!event.relatedTarget && $("#carousel")[0].contains(event.relatedTarget), refreshCarouselTimer();
  }), track($(document)).off("visibilitychange.atlas").on("visibilitychange.atlas", refreshCarouselTimer), media.addEventListener("change", (event) => {
    duration = event.matches ? 0 : 180, event.matches && setManualPause(true);
  }, { signal: lifetime.signal });
  document.addEventListener("error", (event) => {
    event.target.matches?.(".game-card__cover img") ? $(event.target).hide().next(".image-fallback").prop("hidden", false).show() : event.target.matches?.(".dialog__gallery-image") ? ($(event.target).hide(), $(".gallery-error").prop("hidden", false)) : event.target.matches?.(".carousel__image, .detail-scene, .detail-extra, .detail-banner img") && $(event.target).hide().closest(".carousel__slide").addClass("carousel__slide--sin-imagen");
  }, { capture: true, signal: lifetime.signal }), track($("#main")).off("click.atlas", "button").on("click.atlas", "button", () => record("click", "Acci\xF3n de un bot\xF3n de contenido.")), track($("#genreSelect")).off("change.atlas").on("change.atlas", function() {
    state.genre = this.value, renderCatalog(true), record("filter", "Categor\xEDa actualizada.");
  }), track($("#filtersClose")).off("click.atlas").on("click.atlas", () => {
    togglePanel($("#filters"), $("#filtBtn")), $("#filtBtn").trigger("focus");
  }), track($("#mBody")).off("click.atlas", "[data-detail-tab]").on("click.atlas", "[data-detail-tab]", function() {
    let index = Number($(this).data("detail-tab"));
    $("#mBody [role=tab]").attr({ "aria-selected": "false", tabindex: "-1" }), $(this).attr({ "aria-selected": "true", tabindex: "0" }), $(".dialog__pane").prop("hidden", true), $("#detail-pane-" + index).prop("hidden", false).hide().fadeIn(duration), $("#detail-pane-" + index + " img[data-src]").each(function() {
      this.src = this.dataset.src, this.removeAttribute("data-src");
    });
  }), track($(document)).off("keydown.atlas", "[role=tab]").on("keydown.atlas", "[role=tab]", function(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let tabs = $(this).parent().find("[role=tab]"), current = tabs.index(this), next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs.eq(next).trigger("click").trigger("focus");
  }), track($("#logBtn")).off("click.atlas").on("click.atlas", async () => {
    openModal('<h2 id="mTitle">Bit\xE1cora de eventos</h2><p>Cargando\u2026</p>', "log");
    let signal = modales.signal();
    try {
      let view = await import("./interfaz/bitacora.js");
      signal.aborted || await view.mount(document.querySelector("#mBody"), signal);
    } catch {
      signal.aborted || $("#mBody").empty().append($('<h2 id="mTitle">').text("Bit\xE1cora no disponible"), $("<p>").text("Vuelve a intentarlo cuando el contenido est\xE9 preparado."));
    }
  });
  /* El contacto se abre desde cualquier ficha sin depender de servicios externos. */
  track($("#mBody")).on("click.atlas", ".contactar-vendedor", () => abrirContactoVendedor(openModal, byId($("#mBody").data("id"))?.name));
  let resizeTimer;
  const viewportBaselines=new Map();
  /* TECLADO: orientación física estable y navegación anclada al área visible. */
  function viewport() {
    const vv=window.visualViewport, width=document.documentElement.clientWidth||innerWidth;
    const height=Math.round(vv?.height||innerHeight);
    const editing=!!document.activeElement?.matches('input,textarea,select');
    const coarse=matchMedia('(pointer:coarse)').matches;

    let orientation=document.documentElement.dataset.deviceOrientation||'portrait';

    if(!editing||!document.documentElement.dataset.deviceOrientation) orientation=width>height?'landscape':'portrait';
    document.documentElement.dataset.deviceOrientation=orientation;
    const mobile=width<=680||(coarse&&Math.min(screen.width,screen.height)<=680)||(orientation==='landscape'&&width<=1000&&height<=500);
    document.body.dataset.mobileShell=String(mobile);
    const key=Math.round(width/20)*20;
    let baseline=viewportBaselines.get(key)||height;
    if(!editing) { baseline=Math.max(baseline,height); viewportBaselines.set(key,baseline); }
    const keyboard=mobile&&editing&&(baseline-height>90||innerHeight-height>90||height<260);
    document.body.classList.toggle('keyboard-open',keyboard);
    document.body.classList.toggle('viewport-tight',keyboard&&height<270);
    document.documentElement.style.setProperty('--app-height',height+'px');
    document.documentElement.style.setProperty('--keyboard-bottom',Math.max(0,innerHeight-height-(vv?.offsetTop||0))+'px');
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      const next = pageSize(width);
      if(next!==PAGE_SIZE){PAGE_SIZE=next;state.page=1;state.favPage=1;renderCatalog();renderFavorites();}
      renderHome();
    },80);
  }
  window.screen.orientation?.addEventListener("change",viewport,{signal:lifetime.signal});
  window.addEventListener("resize", viewport, { signal: lifetime.signal }), window.visualViewport?.addEventListener("resize", viewport, { signal: lifetime.signal }), document.addEventListener("focusin", viewport, { signal: lifetime.signal }), document.addEventListener("focusout", viewport, { signal: lifetime.signal }), window.addEventListener("pagehide", (event) => {
    searchCatalog.cancel(), cleanupView(), carrusel.detener(), clearTimeout(notificationTimer), clearTimeout(resizeTimer), event.persisted || (lifetime.abort(), modales.cancelar());
  }), window.addEventListener("pageshow", () => {
    refreshCarouselTimer(), viewport();
  }), document.addEventListener("visibilitychange", () => {
    document.hidden && (searchCatalog.cancel(), cleanupView()), refreshCarouselTimer();
  }, { signal: lifetime.signal }), loadPreferences(), $("#favCount, #favCount2, #sideFavCount").text(favorites.size), buildFilters(), renderHome(), $("#dots").empty().append(featured.map((game, index) => $("<button type='button'>").data("index", index).attr("aria-label", "Destacado " + (index + 1) + ": " + game.name))), $("#slides .carousel__slide").data("id") === featured[0]?.id ? $("#dots button").first().attr("aria-current", "true") : goTo(0), setManualPause(media.matches);
  let initial = location.hash.slice(1);
  views.includes(initial) || history.replaceState(null, "", "#inicio"), showView(views.includes(initial) ? initial : "inicio", false), $("#nav a").each(function() {
    let id = this.hash.slice(1), map = { inicio: ["house-door", "Inicio"], catalogo: ["grid", "Cat\xE1logo"], favoritos: ["heart", "Favoritos"], contactos: ["whatsapp", "Contacto"] }, item = map[id];
    item && $(this).empty().append($('<i aria-hidden="true">').addClass("bi bi-" + item[0]), $("<span>").text(item[1]));
  }), viewport(), startPWA(lifetime.signal, notify, () => openModal('<h2 id="mTitle">Instalar Atlas Pixel</h2><p>Android y computadoras: abre el men\xFA del navegador y selecciona Instalar aplicaci\xF3n o A\xF1adir a pantalla de inicio.</p><p>iPhone y iPad: abre esta p\xE1gina en Safari, toca Compartir y luego A\xF1adir a pantalla de inicio.</p><p>Utiliza la direcci\xF3n HTTPS de GitHub Pages. El aviso autom\xE1tico depende del navegador y de si la aplicaci\xF3n ya est\xE1 instalada.</p>', "install")), window.addEventListener("error", () => record("error", "Se detect\xF3 un error de ejecuci\xF3n; vuelve a la pantalla anterior."), { signal: lifetime.signal }), window.addEventListener("unhandledrejection", () => record("error", "Una operaci\xF3n no pudo completarse."), { signal: lifetime.signal });
  mostrarWhatsApp(document.querySelector("#contactoWhatsApp"));
  /* Inicio comparte el número del vendedor y el flujo de búsqueda del catálogo. */
  mostrarWhatsApp(document.querySelector("#homeWhatsApp"), null, {
    etiqueta: "WhatsApp", botonPendiente: true
  });
  track($("#homeWhatsApp")).on("click.atlas", ".contactar-vendedor", () => abrirContactoVendedor(openModal));
  /* La lupa abre el catálogo y enfoca el buscador existente. */
  track($("#catalogSearchBtn")).on("click.atlas", focusSearch);
  hidratarControles(document.body, lifetime.signal);
  document.documentElement.dataset.hydration = "ready";
});
