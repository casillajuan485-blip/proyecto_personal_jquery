import {
  debounce,
  escapeHTML,
  filterGames,
  pageSize,
  record,
  validateCatalog
} from "./modules/chunk-NEHAKT3F.js";

async function loadCatalog(signal, report) {
  let controller = new AbortController(), abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true }), signal?.aborted && abort();
  let timeout = setTimeout(abort, 6e3);
  try {
    let response = await fetch(new URL("catalogo.json", document.baseURI), { signal: controller.signal, cache: "no-cache" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return { games: validateCatalog(await response.json()), source: "json" };
  } catch (error) {
    if (signal?.aborted) throw error;
    report("fetch", "No se pudo leer el JSON; se utilizar\xE1 el respaldo incluido.");
    let backup = await import("./modules/data-KVRB3A4U-ZQAFQNQ3.js");
    return { games: validateCatalog(backup.GAMES), source: "respaldo" };
  } finally {
    clearTimeout(timeout), signal?.removeEventListener("abort", abort);
  }
}
async function mount() {
  let lifetime = new AbortController(), eventTargets = /* @__PURE__ */ new Set();
  function track($root) {
    return $root.each((_, node) => eventTargets.add(node)), $root;
  }
  function cleanupEvents() {
    for (let node of eventTargets) $(node).off(".atlas");
    eventTargets.clear();
  }
  lifetime.signal.addEventListener("abort", cleanupEvents, { once: true });
  let modalController = null, viewTimers = /* @__PURE__ */ new Set();
  function later(fn, ms) {
    let id = setTimeout(() => {
      viewTimers.delete(id), fn();
    }, ms);
    return viewTimers.add(id), id;
  }
  function cleanupView() {
    for (let id of viewTimers) clearTimeout(id);
    viewTimers.clear(), $(".click-wave").remove(), $(".card").removeClass("card-pressed favorite-celebrate");
  }
  let GAMES;
  try {
    let loaded = await loadCatalog(lifetime.signal, record);
    GAMES = loaded.games, loaded.source !== "json" && $("#note").text("Cat\xE1logo de respaldo disponible. Puedes seguir explorando.").prop("hidden", false), record("fetch", "Cat\xE1logo cargado desde " + loaded.source + ".");
  } catch {
    $("#bootStatus").text("No se pudo abrir el cat\xE1logo. Recarga cuando tengas conexi\xF3n."), $("#main").attr("aria-busy", "false");
    return;
  }
  $("#bootStatus").remove();
  $("#main").attr("aria-busy", "false");
  let KEYS = { favorites: "atlaspixel.07_event_bubbling.favs", theme: "atlaspixel.07_event_bubbling.theme" }, PAGE_SIZE = pageSize(innerWidth, innerHeight), state = { q: "", genre: "", plat: "", year: "", collection: "", sort: "az", page: 1, favPage: 1 }, collections = { quick: { title: "Partidas r\xE1pidas", icon: "lightning-charge", description: "Rondas, niveles o intentos para jugar a tu ritmo.", ids: ["celeste", "cuphead", "rocket", "among", "hades"] }, adventure: { title: "Grandes aventuras", icon: "compass", description: "Exploraci\xF3n, historias y mundos por descubrir.", ids: GAMES.filter((g) => g.genres.includes("Aventura") || g.genres.includes("RPG")).map((g) => g.id) }, indie: { title: "Joyas independientes", icon: "gem", description: "Una selecci\xF3n editorial de propuestas independientes.", ids: ["hollow", "celeste", "hades", "stardew", "terraria", "disco", "cuphead", "undertale", "outer", "among"] } }, views = ["catalogo", "favoritos"], media = window.matchMedia("(prefers-reduced-motion: reduce)"), duration = media.matches ? 0 : 180, favorites = /* @__PURE__ */ new Set(), activeView = "catalogo", opener = null, modalType = null, submitting = false, notificationTimer = null, byId = (id) => GAMES.find((game) => game.id === id), unique = (key) => [...new Set(GAMES.flatMap((game) => game[key]))], escape = escapeHTML;
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
        Array.isArray(ids) && (favorites = new Set(ids.filter((id) => typeof id == "string" && byId(id))));
      } catch {
        favorites = /* @__PURE__ */ new Set();
      }
      setTheme(localStorage.getItem(KEYS.theme), false);
    } catch {
      setTheme("dark", false), storageWarning();
    }
  }
  function notify(message) {
    clearTimeout(notificationTimer), $("#toast").stop(true, true).text(message).slideDown(duration), notificationTimer = setTimeout(() => $("#toast").stop(true, true).fadeOut(duration), 2600);
  }
  function showView(id, focus = true) {
    cleanupView(), searchCatalog.cancel(), activeView = views.includes(id) ? id : "catalogo", document.body.dataset.view = activeView, $("#filters").stop(true, true).prop("hidden", true).hide(), $("#filtBtn").attr("aria-expanded", "false"), $("#nav a").each(function() {
      $(this).attr("aria-label", this.textContent.trim());
    }), record("navigation", "Vista: " + activeView), activeView !== "solicitar" && cancelAutoAdvance(), $("main > .view").stop(true, true).prop("hidden", true).hide(), $("#" + activeView).prop("hidden", false).fadeIn(duration), $("#sideNav a, #nav a").removeAttr("aria-current").filter('[href="#' + activeView + '"]').attr("aria-current", "page"), $("#menuBtn").attr({ "aria-expanded": "false", "aria-label": "Abrir men\xFA" }), document.title = "Atlas Pixel \xB7 " + { inicio: "Inicio", catalogo: "Cat\xE1logo", favoritos: "Favoritos", solicitar: "Solicitar juego", info: "Empresa", horarios: "Horarios", contactos: "Contactos" }[activeView], refreshCarouselTimer(), focus && (window.scrollTo({ top: 0, behavior: "instant" }), $("#" + activeView).find("h1, h2").first().trigger("focus"), activeView === "solicitar" && steps[step].id && $("#" + steps[step].id).trigger("focus"));
  }
  function navigate(id, focus = true) {
    location.hash === "#" + id ? showView(id, focus) : location.hash = id;
  }
  function cover(game, quick = false) {
    return `<div class="cover"><img src="${escape(game.cover)}" alt="${escape(game.alt)}" loading="lazy" width="460" height="215"><span class="image-fallback" hidden>${escape(game.name)}</span>${quick ? `<button data-game-id="${escape(game.id)}" type="button" class="quick-view" aria-label="Vista r\xE1pida de ${escape(game.name)}"><i class="bi bi-eye" aria-hidden="true"></i><span>Vista r\xE1pida</span></button>` : ""}</div>`;
  }
  function favoriteButton(game) {
    let selected = favorites.has(game.id);
    return `<button data-game-id="${escape(game.id)}" class="btn icon fav" type="button" aria-pressed="${selected}" aria-label="${selected ? "Quitar" : "Agregar"} ${escape(game.name)} ${selected ? "de" : "a"} favoritos"><i class="bi ${selected ? "bi-heart-fill" : "bi-heart"}" aria-hidden="true"></i></button>`;
  }
  function card(game) {
    return `<article class="card" data-id="${escape(game.id)}" data-genre="${escape(game.genres[0])}">${cover(game, true)}<div class="body"><h3 title="${escape(game.name)}">${escape(game.name)}</h3><div class="card-meta"><span class="tag g" data-genre="${escape(game.genres[0])}">${escape(game.genres[0])}</span><span>${game.year}</span></div><div class="acts"><button data-game-id="${escape(game.id)}" class="btn detail" type="button">Ver detalle <i class="bi bi-arrow-up-right" aria-hidden="true"></i></button>${favoriteButton(game)}</div></div></article>`;
  }
  function pageControls(container, current, total, kind) {
    let $container = $(container).empty().prop("hidden", total <= 1);
    total <= 1 || ($('<button type="button" class="page-btn">').text("\u2190 Anterior").data({ page: current - 1, kind }).prop("disabled", current === 1).appendTo($container), $('<span class="page-position" role="status">').text(current + " / " + total).appendTo($container), $('<button type="button" class="page-btn">').text("Siguiente \u2192").data({ page: current + 1, kind }).prop("disabled", current === total).appendTo($container));
  }
  function filteredGames() {
    return filterGames(GAMES, state, collections);
  }
  function fitCards() {
    const mobile2 = document.body.dataset.mobileShell === "true";
    const landscape = document.documentElement.dataset.deviceOrientation === "landscape";
    const visible = document.querySelector("#" + (activeView === "favoritos" ? "favGrid" : "grid"));
    const free = visible?.getBoundingClientRect().height || 350;
    const horizontal = mobile2 && (landscape || free < 380);
    document.body.classList.toggle("horizontal-cards", horizontal);
    const cols = horizontal ? landscape && innerWidth > 600 ? 2 : 1 : innerWidth <= 680 ? 2 : innerWidth <= 1100 ? 3 : 4;
    document.documentElement.style.setProperty("--card-columns", cols);
    document.documentElement.style.setProperty("--card-rows", Math.ceil(PAGE_SIZE / cols));
    for (const grid of document.querySelectorAll("#grid,#favGrid")) {
      const count = Math.min(PAGE_SIZE, grid.children.length);
      grid.style.setProperty("--card-columns", Math.max(1, Math.min(cols, count)));
      grid.style.setProperty("--card-rows", Math.max(1, Math.ceil(count / cols)));
    }
  }
  function renderCatalog(resetPage = false) {
    fitCards(), resetPage && (state.page = 1);
    let list = filteredGames(), total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, total);
    let start = (state.page - 1) * PAGE_SIZE;
    $("#grid").empty().append(list.slice(start, start + PAGE_SIZE).map(card).join("")).stop(true, true).fadeTo(0, 0.65).fadeTo(duration, 1), $("#empty").prop("hidden", list.length > 0), $("#count").text(list.length ? `${start + 1}\u2013${Math.min(start + PAGE_SIZE, list.length)} de ${list.length} ${list.length === 1 ? "juego" : "juegos"} \xB7 P\xE1gina ${state.page} de ${total}` : "0 juegos encontrados"), $("#genres .chip").each(function() {
      $(this).attr("aria-pressed", String(($(this).data("genre") || "") === state.genre));
    }), $("#genreSelect").val(state.genre), renderFilterTags(), pageControls("#pagination", state.page, total, "catalog"), fitCards();
  }
  function renderFavorites() {
    fitCards();
    let list = GAMES.filter((game) => favorites.has(game.id)), total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.favPage = Math.min(state.favPage, total), $("#favGrid").empty().append(list.slice((state.favPage - 1) * PAGE_SIZE, state.favPage * PAGE_SIZE).map(card).join("")), $("#favEmpty").prop("hidden", list.length > 0), $("#favCount, #favCount2, #sideFavCount").text(list.length), pageControls("#favPagination", state.favPage, total, "favorites"), fitCards();
  }
  function syncFavorites(id) {
    $("#grid .card, #homeGrid .card").filter(function() {
      return $(this).data("id") === id;
    }).find(".fav").replaceWith(favoriteButton(byId(id))), modalType === "detail" && $("#mBody").data("id") === id && ($("#mBody .fav i").toggleClass("bi-heart-fill", favorites.has(id)).toggleClass("bi-heart", !favorites.has(id)), $("#mBody .fav").attr("aria-pressed", String(favorites.has(id))).find("span").text(favorites.has(id) ? "Quitar de favoritos" : "Agregar a favoritos")), renderFavorites();
  }
  function renderHome() {
    let count = innerHeight < 500 || innerWidth <= 680 ? 2 : innerWidth <= 1100 ? 3 : 4;
    $("#homeGrid").empty().append(GAMES.slice(0, count).map(card).join(""));
  }
  function buildFilters() {
    [["#plat", unique("platforms").sort(), "Todas"], ["#year", unique("year").sort((a, b) => b - a), "Todos"], ["#fp", [...unique("platforms").sort(), "PlayStation", "Xbox", "Nintendo Switch", "M\xF3vil", "Otra"], "Elige una plataforma"]].forEach(([selector, values, initial2]) => {
      $(selector).empty().append([...new Set(values)].map((value) => $("<option>").val(value).text(value))).prepend($("<option>").val("").text(initial2)).val("");
    });
    let genres = ["", ...unique("genres").sort()];
    $("#genreSelect").empty().append(genres.map((g) => $("<option>").val(g).text(g || "Todos"))), $("#genres").empty().append(genres.map((genre) => $("<button type='button' class='chip'>").text(genre || "Todos").data("genre", genre).attr("aria-pressed", String(!genre))));
  }
  function renderFilterTags() {
    let $tags = $("#activeFilters").empty(), names = { q: "B\xFAsqueda", genre: "G\xE9nero", plat: "Plataforma", year: "A\xF1o", collection: "Selecci\xF3n" };
    Object.keys(names).forEach((key) => {
      if (!state[key]) return;
      let value = key === "collection" ? collections[state.collection].title : state[key];
      $("<button type='button' class='filter-tag'>").data("key", key).text(names[key] + ": " + value + " \xD7").attr("aria-label", "Quitar filtro " + names[key] + ": " + value).appendTo($tags);
    });
    let advanced = [state.plat, state.year].filter(Boolean).length;
    $("#filterButtonLabel").text(advanced ? "Filtros \xB7 " + advanced : "Filtros"), $("#clear").prop("hidden", !Object.keys(names).some((key) => state[key]) && state.sort === "az");
  }
  function openModal(content, type, id = null) {
    $("#modal").prop("hidden") && (opener = document.activeElement), modalController?.abort(), modalController = new AbortController(), cancelAutoAdvance(), modalType = type, $(".dlg").removeClass("log-dialog text-dialog").toggleClass("detail-dialog", type === "detail").toggleClass("log-dialog", type === "log").toggleClass("text-dialog", type === "text"), $("#mBody").empty().data("id", id).append(content), $(".dlg").scrollTop(0), $("body").addClass("dialog-open"), $("header, main, footer, aside").prop("inert", true), $("#modal").stop(true, true).prop("hidden", false).hide().fadeIn(duration), $(".dlg").trigger("focus"), pause.modal = true, refreshCarouselTimer();
  }
  function closeModal() {
    modalController?.abort(), modalController = null, submitting = false, $("#send").prop("disabled", false), $("#modal").stop(true, true).fadeOut(duration, function() {
      $(this).prop("hidden", true), $("header, main, footer, aside").prop("inert", false), $("body").removeClass("dialog-open"), modalType = null, pause.modal = false, refreshCarouselTimer(), opener && document.contains(opener) ? $(opener).trigger("focus") : $("#" + activeView).find("h1, h2").first().trigger("focus");
    });
  }
  function showDetail(id) {
    let game = byId(id);
    if (!game) return;
    let images = galleryImages(game), tabs = ["Resumen", "Galer\xEDa", "Datos"];
    openModal(`<div class="detail-heading"><span class="eyebrow">DESCUBRE EL JUEGO</span><h2 id="mTitle">${escape(game.name)}</h2></div>
      <div class="detail-tabs" role="tablist" aria-label="Ficha del juego">${tabs.map((t, i) => `<button class="btn" id="detail-tab-${i}" role="tab" aria-selected="${i === 0}" aria-controls="detail-pane-${i}" tabindex="${i === 0 ? 0 : -1}" data-detail-tab="${i}">${t}</button>`).join("")}</div>
      <div class="detail-pane" id="detail-pane-0" role="tabpanel" aria-labelledby="detail-tab-0"><img class="detail-scene" src="${escape(game.hero)}" alt="Captura de ${escape(game.name)}"><div class="detail-summary"><p class="detail-synopsis">${escape(game.synopsis)}</p><p>${escape(game.description)}</p><div class="tags"><span class="tag">${escape(game.genres.join(" \xB7 "))}</span><span class="tag">${escape(game.platforms.join(" \xB7 "))}</span></div></div></div>
      <div class="detail-pane" id="detail-pane-1" role="tabpanel" aria-labelledby="detail-tab-1" hidden><div class="game-gallery" role="region" aria-label="Galer\xEDa"><div class="gallery-heading"><h3>Dentro de este mundo</h3><span id="galleryCount" role="status">1 de ${images.length}</span></div><div class="gallery-stage"><img class="gallery-main" data-src="${escape(images[0].src)}" alt="${escape(images[0].label + " de " + game.name)}"><button class="gallery-arrow gallery-prev" aria-label="Imagen anterior">\u2039</button><button class="gallery-arrow gallery-next" aria-label="Imagen siguiente">\u203A</button><p class="gallery-error" hidden>Imagen no disponible.</p></div><div class="gallery-thumbs">${images.map((img, i) => `<button class="gallery-thumb" data-index="${i}" aria-pressed="${i === 0}" aria-label="Imagen ${i + 1}"><img data-src="${escape(img.src)}" alt="${escape(img.label)}"></button>`).join("")}</div></div></div>
      <div class="detail-pane" id="detail-pane-2" role="tabpanel" aria-labelledby="detail-tab-2" hidden><dl class="game-data"><dt>Juego</dt><dd>${escape(game.name)}</dd><dt>Plataformas</dt><dd>${escape(game.platforms.join(" \xB7 "))}</dd><dt>G\xE9neros</dt><dd>${escape(game.genres.join(" \xB7 "))}</dd><dt>Edici\xF3n de Steam</dt><dd>${game.year}</dd></dl><p class="edition-note">Im\xE1genes \xA9 sus respectivos titulares.</p></div>
      <div class="detail-actions"><button class="btn fav" type="button" aria-pressed="${favorites.has(id)}" data-id="${escape(id)}"><i class="bi ${favorites.has(id) ? "bi-heart-fill" : "bi-heart"}" aria-hidden="true"></i><span>${favorites.has(id) ? "Quitar de favoritos" : "Agregar a favoritos"}</span></button><a class="btn primary external-link" href="${escape(game.source)}" target="_blank" rel="noopener noreferrer">Ver en Steam \u2197</a></div>`, "detail", id), $("#mBody").data("galleryIndex", 0), record("click", "Ficha de videojuego abierta.");
  }
  function galleryImages(game) {
    return game.gallery?.length ? game.gallery : [{ src: game.hero, label: "Captura del juego" }, { src: game.cover, label: "Arte promocional" }];
  }
  function changeGallery(index) {
    if (modalType !== "detail") return;
    let game = byId($("#mBody").data("id")), images = galleryImages(game);
    index = (index + images.length) % images.length, $("#mBody").data("galleryIndex", index), $(".gallery-error").prop("hidden", true), $(".gallery-main").stop(true, true).fadeOut(duration, function() {
      $(this).attr({ src: images[index].src, alt: images[index].label + " de " + game.name }).fadeIn(duration);
    }), $("#galleryCount").text(index + 1 + " de " + images.length), $(".gallery-thumb").attr("aria-pressed", "false").eq(index).attr("aria-pressed", "true");
  }
  function showQuickView(id) {
    let game = byId(id);
    game && openModal(`${cover(game)}<span class="eyebrow">VISTA R\xC1PIDA</span><h2 id="mTitle">${escape(game.name)}</h2><p>${escape(game.synopsis)}</p><div class="tags"><span class="tag">${escape(game.genres.join(" / "))}</span><span class="tag">${game.year}</span></div><p class="edition-note">${escape(game.platforms.join(" \xB7 "))}</p><button class="btn primary detail" type="button" data-id="${escape(id)}">Ver ficha completa \u2192</button>`, "quick", id);
  }
  let featured = GAMES.filter((game) => game.featured), pause = { manual: media.matches, hover: false, focus: false, modal: false }, slideIndex = 0, carouselTimer = null, slideRemaining = 6;
  function goTo(index) {
    if (!featured.length) return;
    slideIndex = (index + featured.length) % featured.length, slideRemaining = 6;
    let game = featured[slideIndex];
    $("#slides").stop(true, true).css("min-height", $("#slides").height()).fadeOut(duration, function() {
      $(this).html(`<div class="slide scene-transition" data-id="${escape(game.id)}"><img class="hero-art" loading="eager" fetchpriority="high" decoding="async" src="${escape(game.hero)}" alt="" width="1280" height="720"><div class="slide-content"><span class="featured-label">\u2726 DESTACADO DE ATLAS</span><h3 title="${escape(game.name)}">${escape(game.name)}</h3><p>${escape(game.synopsis)}</p><button class="btn primary detail" type="button">Explorar juego \u2192</button></div></div>`).fadeIn(duration, () => $(this).css("min-height", ""));
    }), $("#dots button").removeAttr("aria-current").eq(slideIndex).attr("aria-current", "true");
  }
  function refreshCarouselTimer() {
    clearInterval(carouselTimer), carouselTimer = null;
    let playing = activeView === "inicio" && featured.length > 1 && !Object.values(pause).some(Boolean) && !document.hidden;
    $("#carouselClock").text(playing ? "Siguiente en " + slideRemaining + " s" : "En pausa"), playing && (carouselTimer = setInterval(() => {
      slideRemaining--, slideRemaining <= 0 && (goTo(slideIndex + 1), record("timer", "Cambio autom\xE1tico del destacado.")), $("#carouselClock").text("Siguiente en " + slideRemaining + " s");
    }, 1e3));
  }
  function setManualPause(value) {
    pause.manual = value, record("timer", value ? "Carrusel pausado." : "Carrusel reanudado."), $("#pp").attr("aria-label", value ? "Reanudar avance autom\xE1tico" : "Pausar avance autom\xE1tico").find("i").empty().attr("class", value ? "bi bi-play" : "bi bi-pause"), refreshCarouselTimer();
  }
  let steps = [{ id: "fn", short: "Nombre", title: "\xBFC\xF3mo te llamas?", guide: "Primero, escribe tu nombre. Despu\xE9s pasaremos a tu correo." }, { id: "fe", short: "Correo", title: "Ahora, tu correo", guide: "Escribe un correo con formato v\xE1lido, como nombre@ejemplo.com." }, { id: "fg", short: "Juego", title: "\xBFQu\xE9 videojuego nos recomiendas?", guide: "Indica el t\xEDtulo del juego que te gustar\xEDa ver en Atlas Pixel." }, { id: "fp", short: "Plataforma", title: "Elige tu plataforma", guide: "Selecciona d\xF3nde te gustar\xEDa jugarlo. Si no aparece, elige Otra." }, { id: "fc", short: "Comentario", title: "\xBFQuieres contarnos algo m\xE1s?", guide: "Este bloque es opcional: escribe hasta 500 caracteres o contin\xFAa sin comentario." }, { id: null, short: "Revisi\xF3n", title: "Revisa tu sugerencia", guide: "Comprueba tus datos. Puedes volver para corregirlos antes de confirmar la demostraci\xF3n." }], step = 0, reviewPage = 0, autoAdvanceTimer = null;
  function cancelAutoAdvance() {
    clearTimeout(autoAdvanceTimer), autoAdvanceTimer = null;
  }
  function fieldValue(id) {
    let value = String($("#" + id).val() ?? "");
    return id === "fc" ? value : value.trim();
  }
  function renderReview() {
    let $review = $("#review").empty(), compact = innerHeight < 650, size = compact ? 2 : 5;
    reviewPage = Math.min(reviewPage, Math.ceil(5 / size) - 1);
    let start = reviewPage * size;
    if (steps.slice(start, Math.min(start + size, 5)).forEach((item, offset) => {
      let index = start + offset, $row = $("<div class='review-row'>");
      $("<span class='review-label'>").text(item.short).appendTo($row), $('<button type="button" class="review-value review-full">').data("field", item.id).text(fieldValue(item.id) || "Sin comentario").attr("aria-label", "Ver completo: " + item.short).appendTo($row), $("<button type='button' class='link edit-step'>").data("step", index).text("Editar").attr("aria-label", "Editar " + item.short.toLowerCase()).appendTo($row), $row.appendTo($review);
    }), compact) {
      let $controls = $('<div class="review-pages pagination">');
      $('<button type="button" class="btn review-page">').data("direction", -1).prop("disabled", reviewPage === 0).text("\u2190 Datos").appendTo($controls), $("<span>").text(reviewPage + 1 + " / " + Math.ceil(5 / size)).appendTo($controls), $('<button type="button" class="btn review-page">').data("direction", 1).prop("disabled", start + size >= 5).text("Datos \u2192").appendTo($controls), $controls.appendTo($review);
    }
  }
  track($("#main")).off("pointermove.atlas", ".card").on("pointermove.atlas", ".card", function(event) {
    if (media.matches || event.originalEvent?.pointerType === "touch") return;
    let box = this.getBoundingClientRect();
    if (!box.width || !box.height) return;
    let x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
    $(this).css({ "--pointer-x": x * 100 + "%", "--pointer-y": y * 100 + "%", "--tilt-x": (0.5 - y) * 5 + "deg", "--tilt-y": (x - 0.5) * 7 + "deg" });
  }).off("pointerleave.atlas", ".card").on("pointerleave.atlas", ".card", function() {
    $(this).css({ "--tilt-x": "0deg", "--tilt-y": "0deg" });
  }).off("pointerdown.atlas", ".card").on("pointerdown.atlas", ".card", function(event) {
    if (media.matches || event.button !== void 0 && event.button !== 0) return;
    let box = this.getBoundingClientRect(), size = Math.max(box.width, box.height) * 2, $wave = $("<span class='click-wave' aria-hidden='true'>").css({ width: size, height: size, left: event.clientX - box.left - size / 2, top: event.clientY - box.top - size / 2 });
    $(this).append($wave).addClass("card-pressed"), later(() => $(this).removeClass("card-pressed"), 180), later(() => $wave.remove(), 700);
  }).off("click.atlas", ".card").on("click.atlas", ".card", function(event) {
    $(event.target).closest("button, a").length || showDetail($(this).data("id"));
  });
  track($(document)).off("click.atlas", "a[href^='#']").on("click.atlas", "a[href^='#']", function(event) {
    let id = this.getAttribute("href").slice(1);
    views.includes(id) && (event.preventDefault(), navigate(id));
  });
  track($(window)).off("hashchange.atlas").on("hashchange.atlas", () => showView(location.hash.slice(1)));
  function focusSearch() {
    activeView !== "catalogo" && (history.pushState(null, "", "#catalogo"), showView("catalogo", false)), $("#filters").stop(true, true).prop("hidden", false).show(), $("#filtBtn").attr("aria-expanded", "true"), document.querySelector("#globalSearch").focus();
  }
  let searchCatalog = debounce(function() {
    state.q = $("#globalSearch").val(), renderCatalog(true), record("input", "B\xFAsqueda actualizada despu\xE9s de una pausa."), activeView !== "catalogo" && (history.pushState(null, "", "#catalogo"), showView("catalogo", false));
  }, 250);
  track($("#pagination, #favPagination")).off("click.atlas", ".page-btn").on("click.atlas", ".page-btn", function() {
    if ($(this).prop("disabled")) return;
    let page = $(this).data("page");
    $(this).data("kind") === "catalog" ? (state.page = page, renderCatalog()) : (state.favPage = page, renderFavorites()), $("#" + activeView).find("h2").first().trigger("focus"), window.scrollTo({ top: 0, behavior: "instant" });
  });
  track($("#main, #modal")).off("click.atlas", ".detail").on("click.atlas", ".detail", function(event) {
    event.preventDefault(), event.stopPropagation(), showDetail(this.dataset.gameId || $(this).closest("[data-id]").data("id"));
  });
  track($("#main")).off("click.atlas", ".quick-view").on("click.atlas", ".quick-view", function(event) {
    event.preventDefault(), event.stopPropagation(), showQuickView(this.dataset.gameId || $(this).closest("[data-id]").data("id"));
  });
  track($("#mBody")).off("click.atlas", ".gallery-thumb").on("click.atlas", ".gallery-thumb", function() {
    changeGallery(Number($(this).data("index")));
  }).off("click.atlas", ".gallery-prev").on("click.atlas", ".gallery-prev", () => changeGallery($("#mBody").data("galleryIndex") - 1)).off("click.atlas", ".gallery-next").on("click.atlas", ".gallery-next", () => changeGallery($("#mBody").data("galleryIndex") + 1)).off("keydown.atlas", ".game-gallery button").on("keydown.atlas", ".game-gallery button", (event) => {
    (event.key === "ArrowRight" || event.key === "ArrowLeft") && (event.preventDefault(), changeGallery($("#mBody").data("galleryIndex") + (event.key === "ArrowRight" ? 1 : -1)));
  });
  track($("#main, #modal")).off("click.atlas", ".fav").on("click.atlas", ".fav", function(event) {
    event.preventDefault(), event.stopPropagation();
    let id = this.dataset.gameId || $(this).closest("[data-id]").data("id");
    if (!byId(id)) return;
    let inFavorites = $(this).closest("#favGrid").length > 0, inCard = $(this).closest(".card").length > 0, added = !favorites.has(id);
    if (added ? favorites.add(id) : favorites.delete(id), persist(KEYS.favorites, JSON.stringify([...favorites])), syncFavorites(id), record("favorite", added ? "Juego agregado a favoritos." : "Juego quitado de favoritos."), added && !media.matches) {
      let $buttons = $(".card").filter(function() {
        return $(this).data("id") === id;
      }).find(".fav").addClass("favorite-celebrate");
      later(() => $buttons.removeClass("favorite-celebrate"), 650);
    }
    if (inFavorites) {
      let $next = $("#favGrid .fav").first();
      ($next.length ? $next : $("#favEmpty a")).trigger("focus");
    } else inCard && $("#" + activeView + " .card").filter(function() {
      return $(this).data("id") === id;
    }).find(".fav").trigger("focus");
    notify((added ? "Guardado en favoritos: " : "Quitado de favoritos: ") + byId(id).name);
  });
  track($("#themeBtn")).off("click.atlas").on("click.atlas", () => setTheme($("html").attr("data-theme") === "light" ? "dark" : "light"));
  let mobile = window.matchMedia("(max-width: 680px)").matches;
  track($(window)).off("resize.atlas").on("resize.atlas", () => {
    let next = window.matchMedia("(max-width: 680px)").matches;
    next !== mobile && (mobile = next, $("#nav").stop(true, true).removeAttr("style"), $("#menuBtn").attr({ "aria-expanded": "false", "aria-label": "Abrir men\xFA" }));
  });
  track($("#mClose, #modal .backdrop")).off("click.atlas").on("click.atlas", closeModal);
  track($(document)).off("keydown.atlas").on("keydown.atlas", (event) => {
    if ($("#modal").prop("hidden")) event.key === "/" && !$(event.target).is("input, select, textarea") && (event.preventDefault(), focusSearch());
    else if (event.key === "Escape" && (event.preventDefault(), closeModal()), event.key === "Tab") {
      let $focus = $(".dlg").find("button, a[href], input, select, textarea").not(":disabled").filter(":visible"), first = $focus.first()[0], last = $focus.last()[0];
      if (!first) return;
      event.shiftKey && (document.activeElement === first || document.activeElement === $(".dlg")[0]) ? (event.preventDefault(), last.focus()) : !event.shiftKey && document.activeElement === last && (event.preventDefault(), first.focus());
    }
  });
  media.addEventListener("change", (event) => {
    duration = event.matches ? 0 : 180, event.matches && setManualPause(true);
  }, { signal: lifetime.signal });
  document.addEventListener("error", (event) => {
    event.target.matches?.(".cover img") ? $(event.target).hide().next(".image-fallback").prop("hidden", false).show() : event.target.matches?.(".gallery-main") ? ($(event.target).hide(), $(".gallery-error").prop("hidden", false)) : event.target.matches?.(".hero-art, .detail-extra, .detail-banner img") && $(event.target).hide();
  }, { capture: true, signal: lifetime.signal });
  track($("#main")).off("click.atlas", "button").on("click.atlas", "button", () => record("click", "Acci\xF3n de un bot\xF3n de contenido."));
  track($("#mBody")).off("click.atlas", "[data-detail-tab]").on("click.atlas", "[data-detail-tab]", function() {
    let index = Number($(this).data("detail-tab"));
    $("#mBody [role=tab]").attr({ "aria-selected": "false", tabindex: "-1" }), $(this).attr({ "aria-selected": "true", tabindex: "0" }), $(".detail-pane").prop("hidden", true), $("#detail-pane-" + index).prop("hidden", false).hide().fadeIn(duration), $("#detail-pane-" + index + " img[data-src]").each(function() {
      this.src = this.dataset.src, this.removeAttribute("data-src");
    });
  });
  track($(document)).off("keydown.atlas", "[role=tab]").on("keydown.atlas", "[role=tab]", function(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let tabs = $(this).parent().find("[role=tab]"), current = tabs.index(this), next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs.eq(next).trigger("click").trigger("focus");
  });
  track($("#logBtn")).off("click.atlas").on("click.atlas", async () => {
    openModal('<h2 id="mTitle">Bit\xE1cora de eventos</h2><p>Cargando\u2026</p>', "log");
    let signal = modalController.signal;
    try {
      let view = await import("./modules/log-view-NZ2N4KNU-XVODBR24.js");
      signal.aborted || await view.mount(document.querySelector("#mBody"), signal);
    } catch {
      signal.aborted || $("#mBody").empty().append($('<h2 id="mTitle">').text("Bit\xE1cora no disponible"), $("<p>").text("Vuelve a intentarlo cuando el contenido est\xE9 preparado."));
    }
  });
  track($(document)).off("click.atlas", ".external-link, #socialPreview a").on("click.atlas", ".external-link, #socialPreview a", function(event) {
    navigator.onLine || (event.preventDefault(), notify("Este enlace externo necesita conexi\xF3n a Internet."), record("connection", "Enlace externo detenido por desconexi\xF3n."));
  });
  let resizeTimer;
  const viewportBaselines = /* @__PURE__ */ new Map();
  function viewport() {
    const vv = window.visualViewport, width = document.documentElement.clientWidth || innerWidth;
    const height = Math.round(vv?.height || innerHeight);
    const editing = !!document.activeElement?.matches("input,textarea,select");
    const coarse = matchMedia("(pointer:coarse)").matches;
    const physical = window.screen.orientation?.type;
    let orientation = document.documentElement.dataset.deviceOrientation || "portrait";
    if (coarse && physical) orientation = physical.startsWith("landscape") ? "landscape" : "portrait";
    else if (!editing || !document.documentElement.dataset.deviceOrientation) orientation = width > height ? "landscape" : "portrait";
    document.documentElement.dataset.deviceOrientation = orientation;
    const mobile2 = width <= 680 || coarse && Math.min(screen.width, screen.height) <= 680 || orientation === "landscape" && width <= 1e3 && height <= 500;
    document.body.dataset.mobileShell = String(mobile2);
    const key = Math.round(width / 20) * 20;
    let baseline = viewportBaselines.get(key) || height;
    if (!editing) {
      baseline = Math.max(baseline, height);
      viewportBaselines.set(key, baseline);
    }
    const keyboard = mobile2 && editing && (baseline - height > 90 || innerHeight - height > 90 || height < 260);
    document.body.classList.toggle("keyboard-open", keyboard);
    document.body.classList.toggle("viewport-tight", keyboard && height < 270);
    document.documentElement.style.setProperty("--app-height", height + "px");
    document.documentElement.style.setProperty("--keyboard-bottom", Math.max(0, innerHeight - height - (vv?.offsetTop || 0)) + "px");
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      fitCards();
      let next = pageSize(width, height);
      if (activeView === "catalogo" || activeView === "favoritos") {
        const grid = document.querySelector(activeView === "catalogo" ? "#grid" : "#favGrid");
        const free = grid.getBoundingClientRect().height;
        const horizontal = document.body.classList.contains("horizontal-cards");
        const cols = Number(document.documentElement.style.getPropertyValue("--card-columns")) || 2;
        const minimum = horizontal ? orientation === "landscape" ? 100 : 136 : 190;
        next = cols * Math.max(1, Math.min(2, Math.floor((free + 10) / (minimum + 10))));
      }
      if (next !== PAGE_SIZE) {
        PAGE_SIZE = next;
        state.page = 1;
        state.favPage = 1;
        renderCatalog();
        renderFavorites();
      }
      fitCards();
      renderHome();
      if (step === 5) renderReview();
    }, 80);
  }
  window.screen.orientation?.addEventListener("change", viewport, { signal: lifetime.signal });
  window.addEventListener("resize", viewport, { signal: lifetime.signal });
  window.visualViewport?.addEventListener("resize", viewport, { signal: lifetime.signal });
  document.addEventListener("focusin", viewport, { signal: lifetime.signal });
  document.addEventListener("focusout", viewport, { signal: lifetime.signal });
  window.addEventListener("pagehide", (event) => {
    searchCatalog.cancel(), cleanupView(), cancelAutoAdvance(), clearInterval(carouselTimer), clearTimeout(notificationTimer), clearTimeout(resizeTimer), event.persisted || (lifetime.abort(), modalController?.abort());
  }, { signal: lifetime.signal });
  window.addEventListener("pageshow", () => {
    refreshCarouselTimer(), viewport();
  }, { signal: lifetime.signal });
  document.addEventListener("visibilitychange", () => {
    document.hidden && (cancelAutoAdvance(), searchCatalog.cancel(), cleanupView()), refreshCarouselTimer();
  }, { signal: lifetime.signal });
  loadPreferences();
  buildFilters();
  renderCatalog();
  renderFavorites();
  let initial = location.hash.slice(1);
  views.includes(initial) || history.replaceState(null, "", "#catalogo");
  showView(views.includes(initial) ? initial : "catalogo", false);
  $("#nav a").each(function() {
    let id = this.hash.slice(1), map = { inicio: ["house-door", "Inicio"], catalogo: ["grid", "Cat\xE1logo"], favoritos: ["heart", "Favoritos"], solicitar: ["plus-circle", "Solicitar"], info: ["info-circle", "Empresa"], horarios: ["clock", "Horarios"], contactos: ["chat-dots", "Contactos"] }, item = map[id];
    item && $(this).empty().append($('<i aria-hidden="true">').addClass("bi bi-" + item[0]), $("<span>").text(item[1]));
  });
  viewport();
  window.addEventListener("error", () => record("error", "Se detect\xF3 un error de ejecuci\xF3n; vuelve a la pantalla anterior."), { signal: lifetime.signal });
  window.addEventListener("unhandledrejection", () => record("error", "Una operaci\xF3n no pudo completarse."), { signal: lifetime.signal });
  const disposeOriginal = (event) => {
    searchCatalog.cancel(), cleanupView(), cancelAutoAdvance(), clearInterval(carouselTimer), clearTimeout(notificationTimer), clearTimeout(resizeTimer), event.persisted || (lifetime.abort(), modalController?.abort());
  };
  return () => {
    if (!$("#modal").prop("hidden")) closeModal();
    disposeOriginal({ persisted: false });
  };
}

$(async () => {
  await mount();
});
