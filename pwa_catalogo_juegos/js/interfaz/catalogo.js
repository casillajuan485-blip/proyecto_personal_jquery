import { filterGames } from "../utilidades.js";
import { card, favoriteButton } from "../componentes/tarjeta-juego.js";
import { fragmentoSeguro } from "../seguridad/html-seguro.js";

/* Catálogo: filtrado, paginación, tarjetas reutilizables y favoritos. */
export function crearCatalogo({ juegos: GAMES, estado: state, favorites, byId, unique, medidas, tipoModal, cancelarBusqueda, ajustarViewport }) {
  function pageControls(container, current, total, kind) {
    let $container = $(container).empty().prop("hidden", total <= 1);
    total <= 1 || ($('<button type="button" class="page-btn">').text("\u2190 Anterior").data({ page: current - 1, kind }).prop("disabled", current === 1).appendTo($container), $('<span class="page-position" role="status">').text(current + " / " + total).appendTo($container), $('<button type="button" class="page-btn">').text("Siguiente \u2192").data({ page: current + 1, kind }).prop("disabled", current === total).appendTo($container));
  }
  function filteredGames() {
    return filterGames(GAMES, state, medidas().collections);
  }
  /* CSS decide las columnas. La rejilla nunca mide la altura para paginar. */
  /* CATÁLOGO: filtros, búsqueda y paginación con actualizaciones del DOM. */ function renderCatalog(resetPage = false) {
    resetPage && (state.page = 1);
    let list = filteredGames(), total = Math.max(1, Math.ceil(list.length / medidas().page));
    state.page = Math.min(state.page, total);
    let start = (state.page - 1) * medidas().page;
    $("#grid").empty().append(fragmentoSeguro(list.slice(start, start + medidas().page).map(game => card(game, favorites)).join(""))).stop(true, true).fadeTo(0, 0.65).fadeTo(medidas().duration, 1), $("#empty").prop("hidden", list.length > 0), $("#count").text(list.length ? `${start + 1}\u2013${Math.min(start + medidas().page, list.length)} de ${list.length} ${list.length === 1 ? "juego" : "juegos"} \xB7 P\xE1gina ${state.page} de ${total}` : "0 juegos encontrados"), $("#genres .chip").each(function() {
      $(this).attr("aria-pressed", String(($(this).data("genre") || "") === state.genre));
    }), $("#genreSelect").val(state.genre), renderFilterTags(), pageControls("#pagination", state.page, total, "catalog");
  }
  function renderFavorites() {
    let list = GAMES.filter((game) => favorites.has(game.id)), total = Math.max(1, Math.ceil(list.length / medidas().page));
    state.favPage = Math.min(state.favPage, total), $("#favGrid").empty().append(fragmentoSeguro(list.slice((state.favPage - 1) * medidas().page, state.favPage * medidas().page).map(game => card(game, favorites)).join(""))), $("#favEmpty").prop("hidden", list.length > 0), $("#favCount, #favCount2, #sideFavCount").text(list.length), pageControls("#favPagination", state.favPage, total, "favorites");
  }
  function syncFavorites(id) {
    $("#grid .game-card, #homeGrid .game-card").filter(function() {
      return $(this).data("id") === id;
    }).find(".fav").replaceWith(fragmentoSeguro(favoriteButton(byId(id), favorites))), tipoModal() === "detail" && $("#mBody").data("id") === id && ($("#mBody .fav i").toggleClass("bi-heart-fill", favorites.has(id)).toggleClass("bi-heart", !favorites.has(id)), $("#mBody .fav").attr("aria-pressed", String(favorites.has(id))).find("span").text(favorites.has(id) ? "Quitar de favoritos" : "Agregar a favoritos")), renderFavorites();
  }
  function renderHome() {
    const count = innerWidth >= 1100 ? 4 : innerWidth >= 681 && innerHeight >= 500 ? 3 : 2;
    $("#homeGrid").empty().append(fragmentoSeguro(GAMES.slice(0, count).map(game => card(game, favorites)).join("")));
  }
  function buildFilters() {
    [["#plat", unique("platforms").sort(), "Todas"], ["#year", unique("year").sort((a, b) => b - a), "Todos"]].forEach(([selector, values, initial2]) => {
      $(selector).empty().append([...new Set(values)].map((value) => $("<option>").val(value).text(value))).prepend($("<option>").val("").text(initial2)).val("");
    });
    let genres = ["", ...unique("genres").sort()];
    $("#genreSelect").empty().append(genres.map((g) => $("<option>").val(g).text(g || "Todos"))), $("#genres").empty().append(genres.map((genre) => $("<button type='button' class='chip'>").text(genre || "Todos").data("genre", genre).attr("aria-pressed", String(!genre))));
  }
  function renderFilterTags() {
    let $tags = $("#activeFilters").empty(), names = { q: "B\xFAsqueda", genre: "G\xE9nero", plat: "Plataforma", year: "A\xF1o", collection: "Selecci\xF3n" };
    Object.keys(names).forEach((key) => {
      if (!state[key]) return;
      let value = key === "collection" ? medidas().collections[state.collection].title : state[key];
      $("<button type='button' class='catalog-filters__tag'>").data("key", key).text(names[key] + ": " + value + " \xD7").attr("aria-label", "Quitar filtro " + names[key] + ": " + value).appendTo($tags);
    });
    let advanced = [state.plat, state.year].filter(Boolean).length;
    $("#filterButtonLabel").text(advanced ? "Filtros \xB7 " + advanced : "Filtros"), $("#clear").prop("hidden", !Object.keys(names).some((key) => state[key]) && state.sort === "az");
  }
  /* FILTROS: limpiar no enfoca campos ni abre el teclado. */
  function clearFilters() {
    cancelarBusqueda();
    if(document.activeElement?.matches('input,textarea,select')) document.activeElement.blur();
    Object.assign(state,{q:"",genre:"",plat:"",year:"",collection:"",sort:"az",page:1});
    $("#globalSearch, #plat, #year").val(""); $("#sort").val("az");
    $("#filters").stop(true,true).prop("hidden",true).hide();
    $("#filtBtn").attr("aria-expanded","false");
    renderCatalog(true); ajustarViewport();
  }
  return { renderCatalog, renderFavorites, syncFavorites, renderHome, buildFilters, clearFilters };
}
