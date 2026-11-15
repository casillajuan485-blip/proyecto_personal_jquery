var escapeHTML = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var normalize = (text) => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function debounce(fn, delay = 250) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer), timer = setTimeout(() => {
      timer = null, fn.apply(this, args);
    }, delay);
  }
  return debounced.cancel = () => {
    clearTimeout(timer), timer = null;
  }, debounced;
}
function pageSize(width, height) {
  return height < 500 ? 2 : width <= 680 ? height < 700 ? 2 : 4 : width <= 1100 ? height < 650 ? 3 : 6 : height < 650 ? 4 : 8;
}
function validateCatalog(data) {
  if (!Array.isArray(data) || !data.length || data.length > 500) throw new Error("Cat\xE1logo inv\xE1lido");
  let ids = /* @__PURE__ */ new Set(), localImage = (value) => typeof value == "string" && /^assets\/images\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(value);
  for (let g of data) {
    if (!g || typeof g.id != "string" || !/^[a-z0-9-]+$/.test(g.id) || ids.has(g.id)) throw new Error("Identificador inv\xE1lido");
    ids.add(g.id);
    for (let key of ["name", "synopsis", "description", "alt"]) if (typeof g[key] != "string" || g[key].length > 3e3) throw new Error("Texto inv\xE1lido");
    if (!Number.isInteger(g.year) || g.year < 1970 || g.year > 2100) throw new Error("A\xF1o inv\xE1lido");
    for (let key of ["genres", "platforms"]) if (!Array.isArray(g[key]) || !g[key].length || !g[key].every((x) => typeof x == "string" && x.length < 80)) throw new Error("Categor\xEDa inv\xE1lida");
    if (!localImage(g.cover) || !localImage(g.hero) || !Array.isArray(g.gallery) || !g.gallery.length || !g.gallery.every((x) => localImage(x.src) && typeof x.label == "string")) throw new Error("Recurso inv\xE1lido");
    let url = new URL(g.source);
    if (url.protocol !== "https:" || url.hostname !== "store.steampowered.com") throw new Error("Enlace no permitido");
  }
  return data;
}
function filterGames(games, state, collections) {
  let query = normalize(state.q.trim()), order = { az: (a, b) => a.name.localeCompare(b.name, "es"), za: (a, b) => b.name.localeCompare(a.name, "es"), new: (a, b) => b.year - a.year || a.name.localeCompare(b.name, "es"), old: (a, b) => a.year - b.year || a.name.localeCompare(b.name, "es") };
  return games.filter((g) => (!query || normalize(g.name).includes(query)) && (!state.genre || g.genres.includes(state.genre)) && (!state.plat || g.platforms.includes(state.plat)) && (!state.year || String(g.year) === state.year) && (!state.collection || collections[state.collection]?.ids.includes(g.id))).sort(order[state.sort] || order.az);
}
var allowed = /* @__PURE__ */ new Set(["navigation", "click", "change", "input", "submit", "filter", "favorite", "timer", "connection", "fetch", "storage", "error", "pwa"]);
var entries = [];
var sequence = 0;
function record(type, message) {
  allowed.has(type) && (entries.push({ id: Date.now().toString(36) + "-" + ++sequence, time: Date.now(), type, message: String(message).slice(0, 180) }), entries = entries.slice(-100), window.dispatchEvent(new CustomEvent("atlas:journal")));
}

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
    let backup = await import("./modules/data-KVRB3A4U-L6T5CI3H.js");
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
  let KEYS = { favorites: "atlaspixel.01_manipulacion_del_dom.favs", theme: "atlaspixel.01_manipulacion_del_dom.theme" }, PAGE_SIZE = pageSize(innerWidth, innerHeight), state = { q: "", genre: "", plat: "", year: "", collection: "", sort: "az", page: 1, favPage: 1 }, collections = { quick: { title: "Partidas r\xE1pidas", icon: "lightning-charge", description: "Rondas, niveles o intentos para jugar a tu ritmo.", ids: ["celeste", "cuphead", "rocket", "among", "hades"] }, adventure: { title: "Grandes aventuras", icon: "compass", description: "Exploraci\xF3n, historias y mundos por descubrir.", ids: GAMES.filter((g) => g.genres.includes("Aventura") || g.genres.includes("RPG")).map((g) => g.id) }, indie: { title: "Joyas independientes", icon: "gem", description: "Una selecci\xF3n editorial de propuestas independientes.", ids: ["hollow", "celeste", "hades", "stardew", "terraria", "disco", "cuphead", "undertale", "outer", "among"] } }, views = ["solicitar", "info", "horarios", "contactos"], media = window.matchMedia("(prefers-reduced-motion: reduce)"), duration = media.matches ? 0 : 180, favorites = /* @__PURE__ */ new Set(), activeView = "solicitar", opener = null, modalType = null, submitting = false, notificationTimer = null, byId = (id) => GAMES.find((game) => game.id === id), unique = (key) => [...new Set(GAMES.flatMap((game) => game[key]))], escape = escapeHTML;
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
    cleanupView(), searchCatalog.cancel(), activeView = views.includes(id) ? id : "solicitar", document.body.dataset.view = activeView, $("#filters").stop(true, true).prop("hidden", true).hide(), $("#filtBtn").attr("aria-expanded", "false"), $("#nav a").each(function() {
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
  let socialProfiles = { instagram: { name: "Instagram", icon: "instagram", handle: "@atlaspixel_demo", text: "Portadas, descubrimientos y momentos de juego.", url: "https://www.instagram.com/" }, facebook: { name: "Facebook", icon: "facebook", handle: "Atlas Pixel \xB7 Perfil de muestra", text: "Novedades del cat\xE1logo y comunidad gaming.", url: "https://www.facebook.com/" }, youtube: { name: "YouTube", icon: "youtube", handle: "Atlas Pixel \xB7 Canal de muestra", text: "Recorridos por videojuegos y recomendaciones editoriales.", url: "https://www.youtube.com/" } };
  function showSocial(key) {
    let profile = socialProfiles[key];
    profile && ($("#socialChoices button").attr("aria-pressed", "false").filter(function() {
      return $(this).data("social") === key;
    }).attr("aria-pressed", "true"), $("#socialPreview").stop(true, true).hide().empty().attr("data-social", key).append($("<i aria-hidden='true' class='social-preview-icon'>").addClass("bi bi-" + profile.icon), $("<span class='social-demo-badge'>").text("PERFIL FICTICIO"), $("<h4>").text(profile.name), $("<strong>").text(profile.handle), $("<p>").text(profile.text), $("<a class='btn primary' target='_blank' rel='noopener noreferrer'>").attr({ href: profile.url, "aria-label": "Abrir " + profile.name + ", plataforma general, no es un perfil de Atlas Pixel" }).text("Abrir " + profile.name + " \u2197")).fadeIn(duration));
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
  let steps = [{ id: "fn", short: "Nombre", title: "\xBFC\xF3mo te llamas?", guide: "Primero, escribe tu nombre. Despu\xE9s pasaremos a tu correo." }, { id: "fe", short: "Correo", title: "Ahora, tu correo", guide: "Escribe un correo con formato v\xE1lido, como nombre@ejemplo.com." }, { id: "fg", short: "Juego", title: "\xBFQu\xE9 videojuego nos recomiendas?", guide: "Indica el t\xEDtulo del juego que te gustar\xEDa ver en Atlas Pixel." }, { id: "fp", short: "Plataforma", title: "Elige tu plataforma", guide: "Selecciona d\xF3nde te gustar\xEDa jugarlo. Si no aparece, elige Otra." }, { id: "fc", short: "Comentario", title: "\xBFQuieres contarnos algo m\xE1s?", guide: "Este bloque es opcional: escribe hasta 500 caracteres o contin\xFAa sin comentario." }, { id: null, short: "Revisi\xF3n", title: "Revisa tu sugerencia", guide: "Comprueba tus datos. Puedes volver para corregirlos antes de confirmar la demostraci\xF3n." }], step = 0, reviewPage = 0, completed = 0, autoAdvanceTimer = null, fieldPrompts = { fn: "Llene su nombre para comenzar.", fe: "Ahora llene su correo electr\xF3nico.", fg: "Ahora escriba el nombre del videojuego.", fp: "Ahora seleccione una plataforma.", fc: "Puede escribir un comentario o continuar sin \xE9l." };
  function cancelAutoAdvance() {
    clearTimeout(autoAdvanceTimer), autoAdvanceTimer = null;
  }
  function fieldFeedback(id, valid) {
    let $feedback = $("#fieldFeedback"), hasValue = !!fieldValue(id), success = valid && hasValue;
    $feedback.toggleClass("feedback-valid", success).toggleClass("feedback-error", !valid).find("i").attr("class", success ? "bi bi-check-circle-fill" : valid ? "bi bi-pencil-square" : "bi bi-exclamation-circle");
    let text = success ? steps[step].short + " correcto. " + (step < 4 && $("#autoAdvance").prop("checked") ? "Puede seguir escribiendo; avanzaremos despu\xE9s de una pausa." : "Puede continuar cuando quiera.") : valid ? fieldPrompts[id] : "Revise este campo: " + $("#e-" + id).text();
    $feedback.find("span").text(text);
  }
  function scheduleAutoAdvance(id, delay = 2e3) {
    if (cancelAutoAdvance(), step >= 4 || !$("#autoAdvance").prop("checked") || activeView !== "solicitar") return;
    let expectedStep = step, expectedValue = fieldValue(id);
    !expectedValue || rules[id](expectedValue) || (autoAdvanceTimer = setTimeout(() => {
      autoAdvanceTimer = null, activeView === "solicitar" && step === expectedStep && fieldValue(id) === expectedValue && !document.hidden && $("#autoAdvance").prop("checked") && $("#modal").prop("hidden") && advanceStep();
    }, delay));
  }
  let controlCharacters = /[\u0000-\u001F\u007F]/, rules = { fn: (value) => value.length < 2 || value.length > 80 || !/[\p{L}]/u.test(value) || !/^[\p{L}\p{M}\p{Zs}.'’\-]+$/u.test(value) ? "Escribe un nombre de 2 a 80 caracteres; usa letras, espacios, ap\xF3strofes, puntos o guiones." : "", fe: (value) => value.length > 120 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]{2,}$/.test(value) || !$("#fe")[0].validity.valid ? "Escribe un correo v\xE1lido, por ejemplo nombre@ejemplo.com." : "", fg: (value) => value.length < 2 || value.length > 120 || controlCharacters.test(value) ? "Escribe el nombre del juego, entre 2 y 120 caracteres y sin caracteres de control." : "", fp: (value) => !value || !$("#fp option").filter(function() {
    return this.value === value;
  }).length ? "Elige una plataforma de la lista." : "", fc: (value) => value.length > 500 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value) ? "Escribe hasta 500 caracteres y evita caracteres de control." : "" };
  function fieldValue(id) {
    let value = String($("#" + id).val() ?? "");
    return id === "fc" ? value : value.trim();
  }
  function validateField(id) {
    let $field = $("#" + id), value = fieldValue(id), error = rules[id](value);
    return $field.toggleClass("is-invalid", !!error).toggleClass("is-valid", !error && !!value).attr("aria-invalid", String(!!error)), (id === "fc" ? $field.nextAll(".err").first() : $field.next(".err")).text(error), error && record("error", "Validaci\xF3n pendiente en un campo del formulario."), !error;
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
  function advanceStep() {
    if (!(step >= 5)) {
      if (!validateField(steps[step].id)) {
        fieldFeedback(steps[step].id, false), $("#" + steps[step].id).trigger("focus");
        return;
      }
      completed = Math.max(completed, step + 1), showStep(step + 1);
    }
  }
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
  function resetWizard() {
    $("#form")[0].reset(), completed = 0, step = 0, $("#form input, #form select, #form textarea").removeClass("is-invalid is-valid").removeAttr("aria-invalid"), $(".err").empty(), $("#c-fc").text("0/500"), $("#review").empty(), showStep(0, false);
  }
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
  track($("#themeBtn")).off("click.atlas").on("click.atlas", () => setTheme($("html").attr("data-theme") === "light" ? "dark" : "light"));
  track($("#menuBtn")).off("click.atlas").on("click.atlas", function() {
    $("#nav").stop(true, true).slideToggle(duration);
    let open = $(this).attr("aria-expanded") !== "true";
    $(this).attr({ "aria-expanded": String(open), "aria-label": open ? "Cerrar men\xFA" : "Abrir men\xFA" });
  });
  let mobile = window.matchMedia("(max-width: 680px)").matches;
  track($(window)).off("resize.atlas").on("resize.atlas", () => {
    let next = window.matchMedia("(max-width: 680px)").matches;
    next !== mobile && (mobile = next, $("#nav").stop(true, true).removeAttr("style"), $("#menuBtn").attr({ "aria-expanded": "false", "aria-label": "Abrir men\xFA" }));
  });
  track($("#mClose, #modal .backdrop")).off("click.atlas").on("click.atlas", closeModal);
  track($("#mBody")).off("click.atlas", "#okBtn").on("click.atlas", "#okBtn", () => {
    resetWizard(), closeModal();
  });
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
  track($("#stepNext")).off("click.atlas").on("click.atlas", advanceStep);
  track($("#stepBack")).off("click.atlas").on("click.atlas", () => showStep(step - 1));
  track($("#socialChoices")).off("click.atlas", "button").on("click.atlas", "button", function() {
    showSocial($(this).data("social"));
  });
  track($("#autoAdvance")).off("change.atlas").on("change.atlas", function() {
    cancelAutoAdvance(), step < 5 && (fieldFeedback(steps[step].id, !fieldValue(steps[step].id) || !rules[steps[step].id](fieldValue(steps[step].id))), this.checked && scheduleAutoAdvance(steps[step].id));
  });
  track($("#stepList, #review")).off("click.atlas", ".step-dot, .edit-step").on("click.atlas", ".step-dot, .edit-step", function() {
    requestStep(Number($(this).data("step")));
  });
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
  function eventIsComposing(event) {
    return !!event?.originalEvent?.isComposing;
  }
  document.addEventListener("error", (event) => {
    event.target.matches?.(".cover img") ? $(event.target).hide().next(".image-fallback").prop("hidden", false).show() : event.target.matches?.(".gallery-main") ? ($(event.target).hide(), $(".gallery-error").prop("hidden", false)) : event.target.matches?.(".hero-art, .detail-extra, .detail-banner img") && $(event.target).hide();
  }, { capture: true, signal: lifetime.signal });
  track($("#main")).off("click.atlas", "button").on("click.atlas", "button", () => record("click", "Acci\xF3n de un bot\xF3n de contenido."));
  track($(document)).off("keydown.atlas", "[role=tab]").on("keydown.atlas", "[role=tab]", function(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let tabs = $(this).parent().find("[role=tab]"), current = tabs.index(this), next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs.eq(next).trigger("click").trigger("focus");
  });
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
  track($("#review")).off("click.atlas", ".review-page").on("click.atlas", ".review-page", function() {
    reviewPage += Number($(this).data("direction")), renderReview();
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
  showSocial("instagram");
  showStep(0, false);
  let initial = location.hash.slice(1);
  views.includes(initial) || history.replaceState(null, "", "#solicitar");
  showView(views.includes(initial) ? initial : "solicitar", false);
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
