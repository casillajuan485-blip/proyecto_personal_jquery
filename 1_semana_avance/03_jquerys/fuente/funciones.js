import { debounce, escapeHTML, filterGames, pageSize, record, validateCatalog } from "./modules/chunk-2DIKP4N2.js";

/* Solicita catalogo.json, valida su contenido y carga el respaldo local si falla. */
async /* DATOS: JSON validado y respaldo local ante errores. */ function loadCatalog(signal, report) {
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
    let backup = await import("./modules/data-KVRB3A4U.js");
    return { games: validateCatalog(backup.GAMES), source: "respaldo" };
  } finally {
    clearTimeout(timeout), signal?.removeEventListener("abort", abort);
  }
}

/* MONTAJE: mismas funciones y manejadores; solo se seleccionan vistas y dependencias. */
export async function mount(){

let lifetime = new AbortController(),
eventTargets = /* @__PURE__ */ new Set();

/* Conserva los contenedores cuyos eventos jQuery deben retirarse. */
function track($root) {
    return $root.each((_, node) => eventTargets.add(node)), $root;
  }

/* Retira únicamente los eventos del namespace .atlas de los contenedores registrados. */
function cleanupEvents() {
    for (let node of eventTargets) $(node).off(".atlas");
    eventTargets.clear();
  }

/* Evento / montaje original: app.js línea 109. */
lifetime.signal.addEventListener("abort", cleanupEvents, { once: true });

let modalController = null,
viewTimers = /* @__PURE__ */ new Set();

/* Programa una tarea y conserva su identificador para cancelarla al navegar. */
function later(fn, ms) {
    let id = setTimeout(() => {
      viewTimers.delete(id), fn();
    }, ms);
    return viewTimers.add(id), id;
  }

/* Cancela tareas de la vista y retira efectos temporales de las tarjetas. */
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

/* Evento / montaje original: app.js línea 129. */
$("#bootStatus").remove();

/* Evento / montaje original: app.js línea 129. */
$("#main").attr("aria-busy", "false");

let KEYS={favorites:"atlaspixel.03_jquerys.favs",theme:"atlaspixel.03_jquerys.theme"},
PAGE_SIZE = pageSize(innerWidth, innerHeight),
state = { q: "", genre: "", plat: "", year: "", collection: "", sort: "az", page: 1, favPage: 1 },
collections = { quick: { title: "Partidas r\xE1pidas", icon: "lightning-charge", description: "Rondas, niveles o intentos para jugar a tu ritmo.", ids: ["celeste", "cuphead", "rocket", "among", "hades"] }, adventure: { title: "Grandes aventuras", icon: "compass", description: "Exploraci\xF3n, historias y mundos por descubrir.", ids: GAMES.filter((g) => g.genres.includes("Aventura") || g.genres.includes("RPG")).map((g) => g.id) }, indie: { title: "Joyas independientes", icon: "gem", description: "Una selecci\xF3n editorial de propuestas independientes.", ids: ["hollow", "celeste", "hades", "stardew", "terraria", "disco", "cuphead", "undertale", "outer", "among"] } },
views=["inicio","catalogo","favoritos","solicitar","contactos"],
media = window.matchMedia("(prefers-reduced-motion: reduce)"),
duration = media.matches ? 0 : 180,
favorites = /* @__PURE__ */ new Set(),
activeView="inicio",
opener = null,
modalType = null,
submitting = false,
notificationTimer = null,
byId = (id) => GAMES.find((game) => game.id === id),
unique = (key) => [...new Set(GAMES.flatMap((game) => game[key]))],
escape = escapeHTML;

/* Muestra un aviso si el navegador no permite guardar una preferencia. */
function storageWarning() {
    $("#note").text("No pudimos guardar tus preferencias. Puedes seguir usando la p\xE1gina durante esta sesi\xF3n.").prop("hidden", false).hide().slideDown(duration);
  }

/* Guarda una preferencia en localStorage y controla sus errores. */
function persist(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      storageWarning();
    }
  }

/* Alterna la paleta clara/oscura y actualiza el estado accesible del botón. */
function setTheme(theme, save = true) {
    let light = theme === "light";
    $("html").attr("data-theme", light ? "light" : "dark"), $("#themeBtn").attr({ "aria-pressed": String(light), "aria-label": light ? "Activar tema oscuro" : "Activar tema claro" }).find("i").empty().attr("class", light ? "bi bi-moon" : "bi bi-sun"), save && persist(KEYS.theme, light ? "light" : "dark");
  }

/* Recupera tema y favoritos validando el formato de los datos guardados. */
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

/* Muestra un mensaje temporal como texto seguro y cancela el aviso anterior. */
function notify(message) {
    clearTimeout(notificationTimer), $("#toast").stop(true, true).text(message).slideDown(duration), notificationTimer = setTimeout(() => $("#toast").stop(true, true).fadeOut(duration), 2600);
  }

/* Oculta las otras secciones, activa la elegida y actualiza navegación, título y foco. */
function showView(id, focus = true) {
    cleanupView(), searchCatalog.cancel(), activeView = views.includes(id) ? id : "inicio", document.body.dataset.view = activeView, $("#filters").stop(true, true).prop("hidden", true).hide(), $("#filtBtn").attr("aria-expanded", "false"), $("#nav a").each(function() {
      $(this).attr("aria-label", this.textContent.trim());
    }), record("navigation", "Vista: " + activeView), activeView !== "solicitar" && cancelAutoAdvance(), $("main > .view").stop(true, true).prop("hidden", true).hide(), $("#" + activeView).prop("hidden", false).fadeIn(duration), $("#sideNav a, #nav a").removeAttr("aria-current").filter('[href="#' + activeView + '"]').attr("aria-current", "page"), $("#menuBtn").attr({ "aria-expanded": "false", "aria-label": "Abrir men\xFA" }), document.title = "Atlas Pixel \xB7 " + { inicio: "Inicio", catalogo: "Cat\xE1logo", favoritos: "Favoritos", solicitar: "Solicitar juego", info: "Empresa", horarios: "Horarios", contactos: "Contactos" }[activeView], refreshCarouselTimer(), focus && (window.scrollTo({ top: 0, behavior: "instant" }), $("#" + activeView).find("h1, h2").first().trigger("focus"), activeView === "solicitar" && steps[step].id && $("#" + steps[step].id).trigger("focus"));
  }

/* Cambia el hash para navegar y conservar historial. */
function navigate(id, focus = true) {
    location.hash === "#" + id ? showView(id, focus) : location.hash = id;
  }

/* Genera portada lazy y botón de vista rápida para un juego real. */
function cover(game, quick = false) {
    return `<div class="cover"><img src="${escape(game.cover)}" alt="${escape(game.alt)}" loading="lazy" width="460" height="215"><span class="image-fallback" hidden>${escape(game.name)}</span>${quick ? `<button data-game-id="${escape(game.id)}" type="button" class="quick-view" aria-label="Vista r\xE1pida de ${escape(game.name)}"><i class="bi bi-eye" aria-hidden="true"></i><span>Vista r\xE1pida</span></button>` : ""}</div>`;
  }

/* Genera el corazón con identificador, etiqueta y estado aria-pressed. */
function favoriteButton(game) {
    let selected = favorites.has(game.id);
    return `<button data-game-id="${escape(game.id)}" class="btn icon fav" type="button" aria-pressed="${selected}" aria-label="${selected ? "Quitar" : "Agregar"} ${escape(game.name)} ${selected ? "de" : "a"} favoritos"><i class="bi ${selected ? "bi-heart-fill" : "bi-heart"}" aria-hidden="true"></i></button>`;
  }

/* Construye la tarjeta original con datos escapados, categoría, detalle y favorito. */
function card(game) {
    return `<article class="card" data-id="${escape(game.id)}" data-genre="${escape(game.genres[0])}">${cover(game, true)}<div class="body"><h3 title="${escape(game.name)}">${escape(game.name)}</h3><div class="card-meta"><span class="tag g" data-genre="${escape(game.genres[0])}">${escape(game.genres[0])}</span><span>${game.year}</span></div><div class="acts"><button data-game-id="${escape(game.id)}" class="btn detail" type="button">Ver detalle <i class="bi bi-arrow-up-right" aria-hidden="true"></i></button>${favoriteButton(game)}</div></div></article>`;
  }

/* Genera Anterior/Siguiente y el indicador de página. */
function pageControls(container, current, total, kind) {
    let $container = $(container).empty().prop("hidden", total <= 1);
    total <= 1 || ($('<button type="button" class="page-btn">').text("\u2190 Anterior").data({ page: current - 1, kind }).prop("disabled", current === 1).appendTo($container), $('<span class="page-position" role="status">').text(current + " / " + total).appendTo($container), $('<button type="button" class="page-btn">').text("Siguiente \u2192").data({ page: current + 1, kind }).prop("disabled", current === total).appendTo($container));
  }

/* Aplica los filtros originales sobre el catálogo cargado. */
function filteredGames() {
    return filterGames(GAMES, state, collections);
  }

/* Ajusta columnas y filas al espacio real y al número de tarjetas. */
function fitCards() {
    const mobile=document.body.dataset.mobileShell === 'true';
    const landscape=document.documentElement.dataset.deviceOrientation === 'landscape';
    const visible=document.querySelector('#'+(activeView==='favoritos'?'favGrid':'grid'));
    const free=visible?.getBoundingClientRect().height || 350;
    const horizontal=mobile&&(landscape||free<380);
    document.body.classList.toggle('horizontal-cards',horizontal);
    const cols=horizontal?(landscape&&innerWidth>600?2:1):innerWidth<=680?2:innerWidth<=1100?3:4;
    document.documentElement.style.setProperty('--card-columns',cols);
    document.documentElement.style.setProperty('--card-rows',Math.ceil(PAGE_SIZE/cols));
    for(const grid of document.querySelectorAll('#grid,#favGrid')){
      const count=Math.min(PAGE_SIZE,grid.children.length);
      grid.style.setProperty('--card-columns',Math.max(1,Math.min(cols,count)));
      grid.style.setProperty('--card-rows',Math.max(1,Math.ceil(count/cols)));
    }
  }

/* Filtra, pagina y actualiza tarjetas, contador y controles del catálogo. */
function renderCatalog(resetPage = false) {
    fitCards(), resetPage && (state.page = 1);
    let list = filteredGames(), total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, total);
    let start = (state.page - 1) * PAGE_SIZE;
    $("#grid").empty().append(list.slice(start, start + PAGE_SIZE).map(card).join("")).stop(true, true).fadeTo(0, 0.65).fadeTo(duration, 1), $("#empty").prop("hidden", list.length > 0), $("#count").text(list.length ? `${start + 1}\u2013${Math.min(start + PAGE_SIZE, list.length)} de ${list.length} ${list.length === 1 ? "juego" : "juegos"} \xB7 P\xE1gina ${state.page} de ${total}` : "0 juegos encontrados"), $("#genres .chip").each(function() {
      $(this).attr("aria-pressed", String(($(this).data("genre") || "") === state.genre));
    }), $("#genreSelect").val(state.genre), renderFilterTags(), pageControls("#pagination", state.page, total, "catalog"), fitCards();
  }

/* Muestra los juegos guardados y sincroniza sus contadores. */
function renderFavorites() {
    fitCards();
    let list = GAMES.filter((game) => favorites.has(game.id)), total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.favPage = Math.min(state.favPage, total), $("#favGrid").empty().append(list.slice((state.favPage - 1) * PAGE_SIZE, state.favPage * PAGE_SIZE).map(card).join("")), $("#favEmpty").prop("hidden", list.length > 0), $("#favCount, #favCount2, #sideFavCount").text(list.length), pageControls("#favPagination", state.favPage, total, "favorites"), fitCards();
  }

/* Sincroniza corazones, ficha y lista después de un cambio. */
function syncFavorites(id) {
    $("#grid .card, #homeGrid .card").filter(function() {
      return $(this).data("id") === id;
    }).find(".fav").replaceWith(favoriteButton(byId(id))), modalType === "detail" && $("#mBody").data("id") === id && ($("#mBody .fav i").toggleClass("bi-heart-fill", favorites.has(id)).toggleClass("bi-heart", !favorites.has(id)), $("#mBody .fav").attr("aria-pressed", String(favorites.has(id))).find("span").text(favorites.has(id) ? "Quitar de favoritos" : "Agregar a favoritos")), renderFavorites();
  }

/* Muestra el número adecuado de recomendaciones en Inicio. */
function renderHome() {
    let count = innerHeight < 500 || innerWidth <= 680 ? 2 : innerWidth <= 1100 ? 3 : 4;
    $("#homeGrid").empty().append(GAMES.slice(0, count).map(card).join(""));
  }

/* Construye opciones y categorías a partir del catálogo real. */
function buildFilters() {
    [["#plat", unique("platforms").sort(), "Todas"], ["#year", unique("year").sort((a, b) => b - a), "Todos"], ["#fp", [...unique("platforms").sort(), "PlayStation", "Xbox", "Nintendo Switch", "M\xF3vil", "Otra"], "Elige una plataforma"]].forEach(([selector, values, initial2]) => {
      $(selector).empty().append([...new Set(values)].map((value) => $("<option>").val(value).text(value))).prepend($("<option>").val("").text(initial2)).val("");
    });
    let genres = ["", ...unique("genres").sort()];
    $("#genreSelect").empty().append(genres.map((g) => $("<option>").val(g).text(g || "Todos"))), $("#genres").empty().append(genres.map((genre) => $("<button type='button' class='chip'>").text(genre || "Todos").data("genre", genre).attr("aria-pressed", String(!genre))));
  }

/* Genera etiquetas removibles e indica si hay filtros activos. */
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

/* Limpia estado y controles sin enfocar la búsqueda ni abrir el teclado. */
function clearFilters() {
    searchCatalog.cancel();
    if(document.activeElement?.matches('input,textarea,select')) document.activeElement.blur();
    Object.assign(state,{q:"",genre:"",plat:"",year:"",collection:"",sort:"az",page:1});
    $("#globalSearch, #plat, #year").val(""); $("#sort").val("az");
    $("#filters").stop(true,true).prop("hidden",true).hide();
    $("#filtBtn").attr("aria-expanded","false");
    renderCatalog(true); viewport();
  }

/* Abre o cierra un panel con slideToggle y actualiza aria-expanded. */
function togglePanel($panel, $button) {
    $panel.stop(true, true);
    let opening = $panel.prop("hidden");
    opening ? $panel.prop("hidden", false).hide().slideToggle(duration) : $panel.slideToggle(duration, () => $panel.prop("hidden", true)), $button.attr("aria-expanded", String(opening));
  }

/* Abre una ventana original, bloquea el fondo y prepara su ciclo de vida. */
function openModal(content, type, id = null) {
    $("#modal").prop("hidden") && (opener = document.activeElement), modalController?.abort(), modalController = new AbortController(), cancelAutoAdvance(), modalType = type, $(".dlg").removeClass("log-dialog text-dialog").toggleClass("detail-dialog", type === "detail").toggleClass("log-dialog", type === "log").toggleClass("text-dialog", type === "text"), $("#mBody").empty().data("id", id).append(content), $(".dlg").scrollTop(0), $("body").addClass("dialog-open"), $("header, main, footer, aside").prop("inert", true), $("#modal").stop(true, true).prop("hidden", false).hide().fadeIn(duration), $(".dlg").trigger("focus"), pause.modal = true, refreshCarouselTimer();
  }

/* Cancela tareas del diálogo y recupera la interacción y el foco. */
function closeModal() {
    modalController?.abort(), modalController = null, submitting = false, $("#send").prop("disabled", false), $("#modal").stop(true, true).fadeOut(duration, function() {
      $(this).prop("hidden", true), $("header, main, footer, aside").prop("inert", false), $("body").removeClass("dialog-open"), modalType = null, pause.modal = false, refreshCarouselTimer(), opener && document.contains(opener) ? $(opener).trigger("focus") : $("#" + activeView).find("h1, h2").first().trigger("focus");
    });
  }

/* Muestra Resumen, Galería y Datos de la ficha del juego. */
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

/* Obtiene las imágenes reales del catálogo o el respaldo de la ficha. */
function galleryImages(game) {
    return game.gallery?.length ? game.gallery : [{ src: game.hero, label: "Captura del juego" }, { src: game.cover, label: "Arte promocional" }];
  }

/* Cambia la imagen y los indicadores de la galería. */
function changeGallery(index) {
    if (modalType !== "detail") return;
    let game = byId($("#mBody").data("id")), images = galleryImages(game);
    index = (index + images.length) % images.length, $("#mBody").data("galleryIndex", index), $(".gallery-error").prop("hidden", true), $(".gallery-main").stop(true, true).fadeOut(duration, function() {
      $(this).attr({ src: images[index].src, alt: images[index].label + " de " + game.name }).fadeIn(duration);
    }), $("#galleryCount").text(index + 1 + " de " + images.length), $(".gallery-thumb").attr("aria-pressed", "false").eq(index).attr("aria-pressed", "true");
  }

/* Abre el resumen breve con enlace a la ficha completa. */
function showQuickView(id) {
    let game = byId(id);
    game && openModal(`${cover(game)}<span class="eyebrow">VISTA R\xC1PIDA</span><h2 id="mTitle">${escape(game.name)}</h2><p>${escape(game.synopsis)}</p><div class="tags"><span class="tag">${escape(game.genres.join(" / "))}</span><span class="tag">${game.year}</span></div><p class="edition-note">${escape(game.platforms.join(" \xB7 "))}</p><button class="btn primary detail" type="button" data-id="${escape(id)}">Ver ficha completa \u2192</button>`, "quick", id);
  }

/* Construye las selecciones temáticas originales de Inicio. */
function buildCollections() {
    $("#collections").empty().append(Object.entries(collections).map(([key, item]) => `<button type="button" class="collection-tile" data-collection="${key}"><i class="bi bi-${item.icon}" aria-hidden="true"></i><span><strong>${item.title}</strong><small>${item.description}</small></span><span class="collection-count">${item.ids.filter(byId).length} \u2192</span></button>`));
  }

let socialProfiles = { instagram: { name: "Instagram", icon: "instagram", handle: "@atlaspixel_demo", text: "Portadas, descubrimientos y momentos de juego.", url: "https://www.instagram.com/" }, facebook: { name: "Facebook", icon: "facebook", handle: "Atlas Pixel \xB7 Perfil de muestra", text: "Novedades del cat\xE1logo y comunidad gaming.", url: "https://www.facebook.com/" }, youtube: { name: "YouTube", icon: "youtube", handle: "Atlas Pixel \xB7 Canal de muestra", text: "Recorridos por videojuegos y recomendaciones editoriales.", url: "https://www.youtube.com/" } };

/* Muestra uno de los perfiles sociales ficticios originales. */
function showSocial(key) {
    let profile = socialProfiles[key];
    profile && ($("#socialChoices button").attr("aria-pressed", "false").filter(function() {
      return $(this).data("social") === key;
    }).attr("aria-pressed", "true"), $("#socialPreview").stop(true, true).hide().empty().attr("data-social", key).append($("<i aria-hidden='true' class='social-preview-icon'>").addClass("bi bi-" + profile.icon), $("<span class='social-demo-badge'>").text("PERFIL FICTICIO"), $("<h4>").text(profile.name), $("<strong>").text(profile.handle), $("<p>").text(profile.text), $("<a class='btn primary' target='_blank' rel='noopener noreferrer'>").attr({ href: profile.url, "aria-label": "Abrir " + profile.name + ", plataforma general, no es un perfil de Atlas Pixel" }).text("Abrir " + profile.name + " \u2197")).fadeIn(duration));
  }

let featured = GAMES.filter((game) => game.featured),
pause = { manual: media.matches, hover: false, focus: false, modal: false },
slideIndex = 0,
carouselTimer = null,
slideRemaining = 6;

/* Cambia el destacado con fadeOut/fadeIn y actualiza los indicadores. */
function goTo(index) {
    if (!featured.length) return;
    slideIndex = (index + featured.length) % featured.length, slideRemaining = 6;
    let game = featured[slideIndex];
    $("#slides").stop(true, true).css("min-height", $("#slides").height()).fadeOut(duration, function() {
      $(this).html(`<div class="slide scene-transition" data-id="${escape(game.id)}"><img class="hero-art" loading="eager" fetchpriority="high" decoding="async" src="${escape(game.hero)}" alt="" width="1280" height="720"><div class="slide-content"><span class="featured-label">\u2726 DESTACADO DE ATLAS</span><h3 title="${escape(game.name)}">${escape(game.name)}</h3><p>${escape(game.synopsis)}</p><button class="btn primary detail" type="button">Explorar juego \u2192</button></div></div>`).fadeIn(duration, () => $(this).css("min-height", ""));
    }), $("#dots button").removeAttr("aria-current").eq(slideIndex).attr("aria-current", "true");
  }

/* Gestiona el intervalo del carrusel y sus pausas según visibilidad e interacción. */
function refreshCarouselTimer() {
    clearInterval(carouselTimer), carouselTimer = null;
    let playing = activeView === "inicio" && featured.length > 1 && !Object.values(pause).some(Boolean) && !document.hidden;
    $("#carouselClock").text(playing ? "Siguiente en " + slideRemaining + " s" : "En pausa"), playing && (carouselTimer = setInterval(() => {
      slideRemaining--, slideRemaining <= 0 && (goTo(slideIndex + 1), record("timer", "Cambio autom\xE1tico del destacado.")), $("#carouselClock").text("Siguiente en " + slideRemaining + " s");
    }, 1e3));
  }

/* Alterna la pausa manual y el texto del control. */
function setManualPause(value) {
    pause.manual = value, record("timer", value ? "Carrusel pausado." : "Carrusel reanudado."), $("#pp").attr("aria-label", value ? "Reanudar avance autom\xE1tico" : "Pausar avance autom\xE1tico").find("i").empty().attr("class", value ? "bi bi-play" : "bi bi-pause"), refreshCarouselTimer();
  }

let steps = [{ id: "fn", short: "Nombre", title: "\xBFC\xF3mo te llamas?", guide: "Primero, escribe tu nombre. Despu\xE9s pasaremos a tu correo." }, { id: "fe", short: "Correo", title: "Ahora, tu correo", guide: "Escribe un correo con formato v\xE1lido, como nombre@ejemplo.com." }, { id: "fg", short: "Juego", title: "\xBFQu\xE9 videojuego nos recomiendas?", guide: "Indica el t\xEDtulo del juego que te gustar\xEDa ver en Atlas Pixel." }, { id: "fp", short: "Plataforma", title: "Elige tu plataforma", guide: "Selecciona d\xF3nde te gustar\xEDa jugarlo. Si no aparece, elige Otra." }, { id: "fc", short: "Comentario", title: "\xBFQuieres contarnos algo m\xE1s?", guide: "Este bloque es opcional: escribe hasta 500 caracteres o contin\xFAa sin comentario." }, { id: null, short: "Revisi\xF3n", title: "Revisa tu sugerencia", guide: "Comprueba tus datos. Puedes volver para corregirlos antes de confirmar la demostraci\xF3n." }],
step = 0,
reviewPage = 0,
completed = 0,
autoAdvanceTimer = null,
fieldPrompts = { fn: "Llene su nombre para comenzar.", fe: "Ahora llene su correo electr\xF3nico.", fg: "Ahora escriba el nombre del videojuego.", fp: "Ahora seleccione una plataforma.", fc: "Puede escribir un comentario o continuar sin \xE9l." };

/* Cancela el temporizador opcional del formulario. */
function cancelAutoAdvance() {
    clearTimeout(autoAdvanceTimer), autoAdvanceTimer = null;
  }

/* Muestra orientación progresiva o error del campo actual. */
function fieldFeedback(id, valid) {
    let $feedback = $("#fieldFeedback"), hasValue = !!fieldValue(id), success = valid && hasValue;
    $feedback.toggleClass("feedback-valid", success).toggleClass("feedback-error", !valid).find("i").attr("class", success ? "bi bi-check-circle-fill" : valid ? "bi bi-pencil-square" : "bi bi-exclamation-circle");
    let text = success ? steps[step].short + " correcto. " + (step < 4 && $("#autoAdvance").prop("checked") ? "Puede seguir escribiendo; avanzaremos despu\xE9s de una pausa." : "Puede continuar cuando quiera.") : valid ? fieldPrompts[id] : "Revise este campo: " + $("#e-" + id).text();
    $feedback.find("span").text(text);
  }

/* Avanza opcionalmente tras una pausa de escritura válida. */
function scheduleAutoAdvance(id, delay = 2e3) {
    if (cancelAutoAdvance(), step >= 4 || !$("#autoAdvance").prop("checked") || activeView !== "solicitar") return;
    let expectedStep = step, expectedValue = fieldValue(id);
    !expectedValue || rules[id](expectedValue) || (autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null, activeView === "solicitar" && step === expectedStep && fieldValue(id) === expectedValue && !document.hidden && $("#autoAdvance").prop("checked") && $("#modal").prop("hidden") && advanceStep();
    }, delay));
  }

let controlCharacters = /[\u0000-\u001F\u007F]/,
rules = { fn: (value) => value.length < 2 || value.length > 80 || !/[\p{L}]/u.test(value) || !/^[\p{L}\p{M}\p{Zs}.'’\-]+$/u.test(value) ? "Escribe un nombre de 2 a 80 caracteres; usa letras, espacios, ap\xF3strofes, puntos o guiones." : "", fe: (value) => value.length > 120 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]{2,}$/.test(value) || !$("#fe")[0].validity.valid ? "Escribe un correo v\xE1lido, por ejemplo nombre@ejemplo.com." : "", fg: (value) => value.length < 2 || value.length > 120 || controlCharacters.test(value) ? "Escribe el nombre del juego, entre 2 y 120 caracteres y sin caracteres de control." : "", fp: (value) => !value || !$("#fp option").filter(function() {
    return this.value === value;
  }).length ? "Elige una plataforma de la lista." : "", fc: (value) => value.length > 500 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value) ? "Escribe hasta 500 caracteres y evita caracteres de control." : "" };

/* Obtiene el texto del campo, normalizándolo cuando corresponde. */
function fieldValue(id) {
    let value = String($("#" + id).val() ?? "");
    return id === "fc" ? value : value.trim();
  }

/* Aplica la regla original del campo y actualiza mensajes y accesibilidad. */
function validateField(id) {
    let $field = $("#" + id), value = fieldValue(id), error = rules[id](value);
    return $field.toggleClass("is-invalid", !!error).toggleClass("is-valid", !error && !!value).attr("aria-invalid", String(!!error)), (id === "fc" ? $field.nextAll(".err").first() : $field.next(".err")).text(error), error && record("error", "Validaci\xF3n pendiente en un campo del formulario."), !error;
  }

/* Presenta la revisión usando texto, sin interpretar las entradas como HTML. */
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

/* Activa un paso y actualiza progreso y botones del asistente. */
function showStep(index, focus = true) {
    cancelAutoAdvance(), step = Math.max(0, Math.min(index, 5)), $(".wizard-step").prop({ hidden: true, disabled: true });
    let $current = $(".wizard-step").eq(step).prop({ hidden: false, disabled: false });
    $("#stepNumber").text("PASO " + (step + 1) + " DE 6"), $("#stepTitle").text(steps[step].title), $("#stepGuide").text(steps[step].guide), $("#stepProgress").val(step + 1).attr("aria-valuetext", "Paso " + (step + 1) + " de 6: " + steps[step].short), $("#stepList").empty().append(steps.map((item, i) => {
      let $button = $("<button type='button' class='step-dot'>").data("step", i).prop("disabled", i > completed).text(i + 1 + ". " + item.short);
      return i === step && $button.attr("aria-current", "step"), i < step && $button.addClass("completed"), $("<li>").append($button);
    })), $("#stepBack").prop("disabled", step === 0), $("#stepNext").prop("hidden", step === 5).text(step === 4 ? "Revisar sugerencia \u2192" : "Continuar \u2192"), $("#send").prop("hidden", step !== 5), step === 5 && (reviewPage = 0, renderReview()), $("#fieldFeedback").prop("hidden", step === 5), step < 5 && fieldFeedback(steps[step].id, !fieldValue(steps[step].id) || !rules[steps[step].id](fieldValue(steps[step].id))), focus && (steps[step].id ? $("#" + steps[step].id).trigger("focus") : $("#stepTitle").trigger("focus"), $current.addClass("guided-highlight").delay(media.matches ? 0 : 700).queue(function(next) {
      $(this).removeClass("guided-highlight"), next();
    }));
  }

/* Valida el paso actual antes de avanzar. */
function advanceStep() {
    if (!(step >= 5)) {
      if (!validateField(steps[step].id)) {
        fieldFeedback(steps[step].id, false), $("#" + steps[step].id).trigger("focus");
        return;
      }
      completed = Math.max(completed, step + 1), showStep(step + 1);
    }
  }

/* Permite volver o comprueba los pasos antes de saltar hacia delante. */
function requestStep(target) {
    if (target <= step) {
      showStep(target);
      return;
    }
    for (let i = 0; i < target; i++) if (!validateField(steps[i].id)) {
      showStep(i), $("#" + steps[i].id).trigger("focus");
      return;
    }
    completed = Math.max(completed, target), showStep(target);
  }

/* Limpia el formulario y restablece el primer paso. */
function resetWizard() {
    $("#form")[0].reset(), completed = 0, step = 0, $("#form input, #form select, #form textarea").removeClass("is-invalid is-valid").removeAttr("aria-invalid"), $(".err").empty(), $("#c-fc").text("0/500"), $("#review").empty(), showStep(0, false);
  }

/* Impide el envío tradicional, valida y confirma la demostración local. */
function confirmForm(event) {
    if (event.preventDefault(), record("submit", "Validaci\xF3n de la demostraci\xF3n solicitada."), submitting) return;
    if (step < 5) {
      advanceStep();
      return;
    }
    let invalid = steps.slice(0, 5).findIndex((item) => !validateField(item.id));
    if (invalid !== -1) {
      showStep(invalid), $("#" + steps[invalid].id).trigger("focus");
      return;
    }
    submitting = true, $("#send").prop("disabled", true), openModal('<div class="success-mark" aria-hidden="true"><i class="bi bi-check2-circle"></i></div><span class="eyebrow">RECORRIDO COMPLETADO</span><h2 id="mTitle">\xA1Demostraci\xF3n completada!</h2><p>Tu sugerencia pas\xF3 todas las validaciones. Esta es una demostraci\xF3n: <strong>no se enviaron ni guardaron tus datos</strong>.</p><p class="edition-note">Puedes cerrar esta confirmaci\xF3n cuando quieras. Para recibir solicitudes reales habr\xEDa que conectar un servicio de env\xEDo.</p><button id="okBtn" type="button" class="btn primary">Entendido</button>', "confirmation");
  }

/* Evento / montaje original: app.js línea 407. */
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

/* Evento / montaje original: app.js línea 421. */
track($(document)).off("click.atlas", "a[href^='#']").on("click.atlas", "a[href^='#']", function(event) {
    let id = this.getAttribute("href").slice(1);
    views.includes(id) && (event.preventDefault(), navigate(id));
  });

/* Evento / montaje original: app.js línea 424. */
track($(window)).off("hashchange.atlas").on("hashchange.atlas", () => showView(location.hash.slice(1)));

/* Abre el panel del catálogo antes de enfocar su buscador. */
function focusSearch() {
    activeView !== "catalogo" && (history.pushState(null, "", "#catalogo"), showView("catalogo", false)), $("#filters").stop(true, true).prop("hidden", false).show(), $("#filtBtn").attr("aria-expanded", "true"), document.querySelector("#globalSearch").focus();
  }

let searchCatalog = debounce(function() {
    state.q = $("#globalSearch").val(), renderCatalog(true), record("input", "B\xFAsqueda actualizada despu\xE9s de una pausa."), activeView !== "catalogo" && (history.pushState(null, "", "#catalogo"), showView("catalogo", false));
  }, 250);

/* Evento / montaje original: app.js línea 431. */
track($("#globalSearch")).off("input.atlas").on("input.atlas", searchCatalog).off("keydown.atlas").on("keydown.atlas", function(event) {
    event.key === "Enter" && (event.preventDefault(), searchCatalog.cancel(), state.q = this.value, renderCatalog(true), navigate("catalogo"));
  });

/* Evento / montaje original: app.js línea 433. */
track($("#plat, #year, #sort")).off("change.atlas").on("change.atlas", function() {
    this.id === "sort" && !["az", "za", "new", "old"].includes(this.value) || (state[this.id] = this.value, renderCatalog(true), record("change", "Control de cat\xE1logo actualizado."));
  });

/* Evento / montaje original: app.js línea 435. */
track($("#genres")).off("click.atlas", ".chip").on("click.atlas", ".chip", function() {
    state.genre = $(this).data("genre"), renderCatalog(true);
  });

/* Evento / montaje original: app.js línea 437. */
track($("#activeFilters")).off("click.atlas", ".filter-tag").on("click.atlas", ".filter-tag", function() {
    let key = $(this).data("key");
    ["q", "genre", "plat", "year", "collection"].includes(key) && (state[key] = "", key === "q" ? $("#globalSearch").val("") : ["genre", "collection"].includes(key) || $("#" + key).val(""), renderCatalog(true), $("#count").attr("tabindex", "-1").trigger("focus"));
  });

/* Evento / montaje original: app.js línea 440. */
track($("#clear, #clear2")).off("click.atlas").on("click.atlas", () => {
    clearFilters(), $("#filtBtn").trigger("focus");
  });

/* Evento / montaje original: app.js línea 442. */
track($("#filtBtn")).off("click.atlas").on("click.atlas", function() {
    togglePanel($("#filters"), $(this));
  });

/* Evento / montaje original: app.js línea 444. */
track($("#helpBtn")).off("click.atlas").on("click.atlas", function() {
    let $panel = $("#help").stop(true, true), open = $panel.prop("hidden");
    open && $panel.prop("hidden", false).hide(), $panel.fadeToggle(duration, () => {
      open || $panel.prop("hidden", true);
    }), $(this).attr("aria-expanded", String(open));
  });

/* Evento / montaje original: app.js línea 449. */
track($("#pagination, #favPagination")).off("click.atlas", ".page-btn").on("click.atlas", ".page-btn", function() {
    if ($(this).prop("disabled")) return;
    let page = $(this).data("page");
    $(this).data("kind") === "catalog" ? (state.page = page, renderCatalog()) : (state.favPage = page, renderFavorites()), $("#" + activeView).find("h2").first().trigger("focus"), window.scrollTo({ top: 0, behavior: "instant" });
  });

/* Evento / montaje original: app.js línea 453. */
track($("#main, #modal")).off("click.atlas", ".detail").on("click.atlas", ".detail", function(event) {
    event.preventDefault(), event.stopPropagation(), showDetail(this.dataset.gameId || $(this).closest("[data-id]").data("id"));
  });

/* Evento / montaje original: app.js línea 455. */
track($("#main")).off("click.atlas", ".quick-view").on("click.atlas", ".quick-view", function(event) {
    event.preventDefault(), event.stopPropagation(), showQuickView(this.dataset.gameId || $(this).closest("[data-id]").data("id"));
  });

/* Evento / montaje original: app.js línea 457. */
track($("#collections")).off("click.atlas", ".collection-tile").on("click.atlas", ".collection-tile", function() {
    let key = $(this).data("collection");
    collections[key] && (clearFilters(), state.collection = key, renderCatalog(true), navigate("catalogo"));
  });

/* Evento / montaje original: app.js línea 460. */
track($("#mBody")).off("click.atlas", ".gallery-thumb").on("click.atlas", ".gallery-thumb", function() {
    changeGallery(Number($(this).data("index")));
  }).off("click.atlas", ".gallery-prev").on("click.atlas", ".gallery-prev", () => changeGallery($("#mBody").data("galleryIndex") - 1)).off("click.atlas", ".gallery-next").on("click.atlas", ".gallery-next", () => changeGallery($("#mBody").data("galleryIndex") + 1)).off("keydown.atlas", ".game-gallery button").on("keydown.atlas", ".game-gallery button", (event) => {
    (event.key === "ArrowRight" || event.key === "ArrowLeft") && (event.preventDefault(), changeGallery($("#mBody").data("galleryIndex") + (event.key === "ArrowRight" ? 1 : -1)));
  });

/* Evento / montaje original: app.js línea 464. */
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

/* Evento / montaje original: app.js línea 482. */
track($("#themeBtn")).off("click.atlas").on("click.atlas", () => setTheme($("html").attr("data-theme") === "light" ? "dark" : "light"));

let mobile = window.matchMedia("(max-width: 680px)").matches;

/* Evento / montaje original: app.js línea 488. */
track($(window)).off("resize.atlas").on("resize.atlas", () => {
    let next = window.matchMedia("(max-width: 680px)").matches;
    next !== mobile && (mobile = next, $("#nav").stop(true, true).removeAttr("style"), $("#menuBtn").attr({ "aria-expanded": "false", "aria-label": "Abrir men\xFA" }));
  });

/* Evento / montaje original: app.js línea 491. */
track($("#mClose, #modal .backdrop")).off("click.atlas").on("click.atlas", closeModal);

/* Evento / montaje original: app.js línea 491. */
track($("#mBody")).off("click.atlas", "#okBtn").on("click.atlas", "#okBtn", () => {
    resetWizard(), closeModal();
  });

/* Evento / montaje original: app.js línea 493. */
track($(document)).off("keydown.atlas").on("keydown.atlas", (event) => {
    if ($("#modal").prop("hidden")) event.key === "/" && !$(event.target).is("input, select, textarea") && (event.preventDefault(), focusSearch());
    else if (event.key === "Escape" && (event.preventDefault(), closeModal()), event.key === "Tab") {
      let $focus = $(".dlg").find("button, a[href], input, select, textarea").not(":disabled").filter(":visible"), first = $focus.first()[0], last = $focus.last()[0];
      if (!first) return;
      event.shiftKey && (document.activeElement === first || document.activeElement === $(".dlg")[0]) ? (event.preventDefault(), last.focus()) : !event.shiftKey && document.activeElement === last && (event.preventDefault(), first.focus());
    }
  });

/* Evento / montaje original: app.js línea 500. */
track($("#prev")).off("click.atlas").on("click.atlas", () => {
    goTo(slideIndex - 1), refreshCarouselTimer();
  });

/* Evento / montaje original: app.js línea 502. */
track($("#next")).off("click.atlas").on("click.atlas", () => {
    goTo(slideIndex + 1), refreshCarouselTimer();
  });

/* Evento / montaje original: app.js línea 504. */
track($("#pp")).off("click.atlas").on("click.atlas", () => setManualPause(!pause.manual));

/* Evento / montaje original: app.js línea 504. */
track($("#dots")).off("click.atlas", "button").on("click.atlas", "button", function() {
    goTo($(this).data("index")), refreshCarouselTimer();
  });

/* Evento / montaje original: app.js línea 506. */
track($("#carousel")).off("mouseenter.atlas").on("mouseenter.atlas", () => {
    pause.hover = true, refreshCarouselTimer();
  }).off("mouseleave.atlas").on("mouseleave.atlas", () => {
    pause.hover = false, refreshCarouselTimer();
  }).off("focusin.atlas").on("focusin.atlas", () => {
    pause.focus = true, refreshCarouselTimer();
  }).off("focusout.atlas").on("focusout.atlas", (event) => {
    pause.focus = !!event.relatedTarget && $("#carousel")[0].contains(event.relatedTarget), refreshCarouselTimer();
  });

/* Evento / montaje original: app.js línea 514. */
track($(document)).off("visibilitychange.atlas").on("visibilitychange.atlas", refreshCarouselTimer);

/* Evento / montaje original: app.js línea 514. */
media.addEventListener("change", (event) => {
    duration = event.matches ? 0 : 180, event.matches && setManualPause(true);
  }, { signal: lifetime.signal });

/* Evento / montaje original: app.js línea 516. */
track($("#stepNext")).off("click.atlas").on("click.atlas", advanceStep);

/* Evento / montaje original: app.js línea 516. */
track($("#stepBack")).off("click.atlas").on("click.atlas", () => showStep(step - 1));

/* Evento / montaje original: app.js línea 516. */
track($("#socialChoices")).off("click.atlas", "button").on("click.atlas", "button", function() {
    showSocial($(this).data("social"));
  });

/* Evento / montaje original: app.js línea 518. */
track($("#autoAdvance")).off("change.atlas").on("change.atlas", function() {
    cancelAutoAdvance(), step < 5 && (fieldFeedback(steps[step].id, !fieldValue(steps[step].id) || !rules[steps[step].id](fieldValue(steps[step].id))), this.checked && scheduleAutoAdvance(steps[step].id));
  });

/* Evento / montaje original: app.js línea 520. */
track($("#stepList, #review")).off("click.atlas", ".step-dot, .edit-step").on("click.atlas", ".step-dot, .edit-step", function() {
    requestStep(Number($(this).data("step")));
  });

/* Evento / montaje original: app.js línea 522. */
track($("#form")).off("input.atlas change.atlas", "input, select, textarea").on("input.atlas change.atlas", "input, select, textarea", function(event) {
    if (!rules[this.id]) return;
    cancelAutoAdvance(), record("input", "Edici\xF3n de un campo del formulario."), this.id === "fc" && $("#c-fc").text(this.value.length + "/500");
    let valid = validateField(this.id);
    fieldFeedback(this.id, valid), completed = Math.min(completed, step), $("#stepList button").each(function() {
      $(this).prop("disabled", Number($(this).data("step")) > completed);
    }), valid && !eventIsComposing(event) && scheduleAutoAdvance(this.id, this.tagName === "SELECT" ? 700 : 2e3);
  }).off("focusout.atlas", "input, select, textarea").on("focusout.atlas", "input, select, textarea", function() {
    rules[this.id] && step < 5 && steps[step].id === this.id && fieldFeedback(this.id, validateField(this.id));
  }).off("compositionstart.atlas", "input, textarea").on("compositionstart.atlas", "input, textarea", cancelAutoAdvance).off("compositionend.atlas", "input, textarea").on("compositionend.atlas", "input, textarea", function() {
    rules[this.id] && (fieldFeedback(this.id, validateField(this.id)), scheduleAutoAdvance(this.id));
  }).off("keydown.atlas", "input, select").on("keydown.atlas", "input, select", (event) => {
    event.key === "Enter" && event.target.id !== "autoAdvance" && (event.preventDefault(), advanceStep());
  }).off("submit.atlas").on("submit.atlas", confirmForm);

/* Detecta composición de texto para no interferir con teclados IME. */
function eventIsComposing(event) {
    return !!event?.originalEvent?.isComposing;
  }

/* Evento / montaje original: app.js línea 539. */
document.addEventListener("error", (event) => {
    event.target.matches?.(".cover img") ? $(event.target).hide().next(".image-fallback").prop("hidden", false).show() : event.target.matches?.(".gallery-main") ? ($(event.target).hide(), $(".gallery-error").prop("hidden", false)) : event.target.matches?.(".hero-art, .detail-extra, .detail-banner img") && $(event.target).hide();
  }, { capture: true, signal: lifetime.signal });

/* Evento / montaje original: app.js línea 541. */
track($("#main")).off("click.atlas", "button").on("click.atlas", "button", () => record("click", "Acci\xF3n de un bot\xF3n de contenido."));

/* Evento / montaje original: app.js línea 541. */
track($("#genreSelect")).off("change.atlas").on("change.atlas", function() {
    state.genre = this.value, renderCatalog(true), record("filter", "Categor\xEDa actualizada.");
  });

/* Evento / montaje original: app.js línea 543. */
track($("#filtersClose")).off("click.atlas").on("click.atlas", () => {
    togglePanel($("#filters"), $("#filtBtn")), $("#filtBtn").trigger("focus");
  });

/* Evento / montaje original: app.js línea 545. */
track($("#mBody")).off("click.atlas", "[data-detail-tab]").on("click.atlas", "[data-detail-tab]", function() {
    let index = Number($(this).data("detail-tab"));
    $("#mBody [role=tab]").attr({ "aria-selected": "false", tabindex: "-1" }), $(this).attr({ "aria-selected": "true", tabindex: "0" }), $(".detail-pane").prop("hidden", true), $("#detail-pane-" + index).prop("hidden", false).hide().fadeIn(duration), $("#detail-pane-" + index + " img[data-src]").each(function() {
      this.src = this.dataset.src, this.removeAttribute("data-src");
    });
  });

/* Evento / montaje original: app.js línea 550. */
track($(document)).off("keydown.atlas", "[role=tab]").on("keydown.atlas", "[role=tab]", function(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let tabs = $(this).parent().find("[role=tab]"), current = tabs.index(this), next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs.eq(next).trigger("click").trigger("focus");
  });

/* Evento / montaje original: app.js línea 555. */
track($("#logBtn")).off("click.atlas").on("click.atlas", async () => {
    openModal('<h2 id="mTitle">Bit\xE1cora de eventos</h2><p>Cargando\u2026</p>', "log");
    let signal = modalController.signal;
    try {
      let view = await import("./modules/log-view-NZ2N4KNU.js");
      signal.aborted || await view.mount(document.querySelector("#mBody"), signal);
    } catch {
      signal.aborted || $("#mBody").empty().append($('<h2 id="mTitle">').text("Bit\xE1cora no disponible"), $("<p>").text("Vuelve a intentarlo cuando el contenido est\xE9 preparado."));
    }
  });

/* Evento / montaje original: app.js línea 564. */
track($("#review")).off("click.atlas", ".review-full").on("click.atlas", ".review-full", function() {
    let text = fieldValue($(this).data("field")) || "Sin comentario", parts = text.match(/[\s\S]{1,160}/g) || ["Sin comentario"], index = 0;
    openModal('<h2 id="mTitle">Texto completo</h2><p id="fullText"></p><div class="pagination"><button class="btn" id="textPrev">Anterior</button><span id="textPage"></span><button class="btn" id="textNext">Siguiente</button></div>', "text");
    let host = document.querySelector("#mBody"), signal = modalController.signal;
    function draw() {
      $("#fullText").text(parts[index]), $("#textPage").text(index + 1 + " / " + parts.length), $("#textPrev").prop("disabled", index === 0), $("#textNext").prop("disabled", index === parts.length - 1);
    }
    draw(), $(host).off("click.atlasText", "#textPrev, #textNext").on("click.atlasText", "#textPrev, #textNext", function() {
      this.id === "textPrev" ? index-- : index++, draw();
    }), signal.addEventListener("abort", () => $(host).off(".atlasText"), { once: true });
  });

/* Evento / montaje original: app.js línea 574. */
track($("#review")).off("click.atlas", ".review-page").on("click.atlas", ".review-page", function() {
    reviewPage += Number($(this).data("direction")), renderReview();
  });

/* Evento / montaje original: app.js línea 576. */
track($(document)).off("click.atlas", ".external-link, #socialPreview a").on("click.atlas", ".external-link, #socialPreview a", function(event) {
    navigator.onLine || (event.preventDefault(), notify("Este enlace externo necesita conexi\xF3n a Internet."), record("connection", "Enlace externo detenido por desconexi\xF3n."));
  });

let resizeTimer;

const viewportBaselines=new Map();

/* Adapta la altura visible, orientación física, teclado y capacidad del catálogo. */
function viewport() {
    const vv=window.visualViewport, width=document.documentElement.clientWidth||innerWidth;
    const height=Math.round(vv?.height||innerHeight);
    const editing=!!document.activeElement?.matches('input,textarea,select');
    const coarse=matchMedia('(pointer:coarse)').matches;
    const physical=window.screen.orientation?.type;
    let orientation=document.documentElement.dataset.deviceOrientation||'portrait';
    if(coarse&&physical) orientation=physical.startsWith('landscape')?'landscape':'portrait';
    else if(!editing||!document.documentElement.dataset.deviceOrientation) orientation=width>height?'landscape':'portrait';
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
      fitCards();
      let next=pageSize(width,height);
      if(activeView==='catalogo'||activeView==='favoritos'){
        const grid=document.querySelector(activeView==='catalogo'?'#grid':'#favGrid');
        const free=grid.getBoundingClientRect().height;
        const horizontal=document.body.classList.contains('horizontal-cards');
        const cols=Number(document.documentElement.style.getPropertyValue('--card-columns'))||2;
        const minimum=horizontal?(orientation==='landscape'?100:136):190;
        next=cols*Math.max(1,Math.min(2,Math.floor((free+10)/(minimum+10))));
      }
      if(next!==PAGE_SIZE){PAGE_SIZE=next;state.page=1;state.favPage=1;renderCatalog();renderFavorites();}
      fitCards();renderHome();if(step===5)renderReview();
    },80);
  }

/* Evento / montaje original: app.js línea 618. */
window.screen.orientation?.addEventListener("change",viewport,{signal:lifetime.signal});

/* Evento / montaje original: app.js línea 619. */
window.addEventListener("resize", viewport, { signal: lifetime.signal });

/* Evento / montaje original: app.js línea 619. */
window.visualViewport?.addEventListener("resize", viewport, { signal: lifetime.signal });

/* Evento / montaje original: app.js línea 619. */
document.addEventListener("focusin", viewport, { signal: lifetime.signal });

/* Evento / montaje original: app.js línea 619. */
document.addEventListener("focusout", viewport, { signal: lifetime.signal });

/* Evento / montaje original: app.js línea 619. */
window.addEventListener("pagehide", (event) => {
    searchCatalog.cancel(), cleanupView(), cancelAutoAdvance(), clearInterval(carouselTimer), clearTimeout(notificationTimer), clearTimeout(resizeTimer), event.persisted || (lifetime.abort(), modalController?.abort());
  }, {signal:lifetime.signal});

/* Evento / montaje original: app.js línea 621. */
window.addEventListener("pageshow", () => {
    refreshCarouselTimer(), viewport();
  }, {signal:lifetime.signal});

/* Evento / montaje original: app.js línea 623. */
document.addEventListener("visibilitychange", () => {
    document.hidden && (cancelAutoAdvance(), searchCatalog.cancel(), cleanupView()), refreshCarouselTimer();
  }, { signal: lifetime.signal });

/* Evento / montaje original: app.js línea 625. */
loadPreferences();

/* Evento / montaje original: app.js línea 625. */
buildFilters();

/* Evento / montaje original: app.js línea 625. */
buildCollections();

/* Evento / montaje original: app.js línea 625. */
showSocial("instagram");

/* Evento / montaje original: app.js línea 625. */
renderCatalog();

/* Evento / montaje original: app.js línea 625. */
renderFavorites();

/* Evento / montaje original: app.js línea 625. */
renderHome();

/* Evento / montaje original: app.js línea 625. */
$("#dots").empty().append(featured.map((game, index) => $("<button type='button'>").data("index", index).attr("aria-label", "Destacado " + (index + 1) + ": " + game.name)));

/* Evento / montaje original: app.js línea 625. */
goTo(0);

/* Evento / montaje original: app.js línea 625. */
setManualPause(media.matches);

/* Evento / montaje original: app.js línea 625. */
showStep(0, false);

let initial = location.hash.slice(1);

/* Evento / montaje original: app.js línea 627. */
views.includes(initial) || history.replaceState(null, "", "#inicio");

/* Evento / montaje original: app.js línea 627. */
showView(views.includes(initial) ? initial : "inicio", false);

/* Evento / montaje original: app.js línea 627. */
$("#nav a").each(function() {
    let id = this.hash.slice(1), map = { inicio: ["house-door", "Inicio"], catalogo: ["grid", "Cat\xE1logo"], favoritos: ["heart", "Favoritos"], solicitar: ["plus-circle", "Solicitar"], info: ["info-circle", "Empresa"], horarios: ["clock", "Horarios"], contactos: ["chat-dots", "Contactos"] }, item = map[id];
    item && $(this).empty().append($('<i aria-hidden="true">').addClass("bi bi-" + item[0]), $("<span>").text(item[1]));
  });

/* Evento / montaje original: app.js línea 630. */
viewport();

/* Evento / montaje original: app.js línea 630. */
window.addEventListener("error", () => record("error", "Se detect\xF3 un error de ejecuci\xF3n; vuelve a la pantalla anterior."), { signal: lifetime.signal });

/* Evento / montaje original: app.js línea 630. */
window.addEventListener("unhandledrejection", () => record("error", "Una operaci\xF3n no pudo completarse."), { signal: lifetime.signal });

/* Interfaz de desmontaje: ejecuta la limpieza original del evento pagehide. */
const disposeOriginal=(event) => {
    searchCatalog.cancel(), cleanupView(), cancelAutoAdvance(), clearInterval(carouselTimer), clearTimeout(notificationTimer), clearTimeout(resizeTimer), event.persisted || (lifetime.abort(), modalController?.abort());
  };
return ()=>{ if(!$("#modal").prop("hidden"))closeModal(); disposeOriginal({persisted:false}); };
}