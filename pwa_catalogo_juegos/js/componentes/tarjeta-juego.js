import { escapeHTML } from "../utilidades.js";
/* Los nombres largos se abrevian en la tarjeta y se mantienen completos en la ficha. */
export function etiquetasConsola(plataformas) {
  const chips = plataformas.map(plataforma => {
    const play = /^PlayStation ([345])$/.exec(plataforma);
    const xbox = plataforma.startsWith("Xbox");
    const familia = play ? "playstation" : xbox ? "xbox" : "switch";
    const etiqueta = play ? "PS" + play[1] : plataforma === "Nintendo Switch" ? "Switch" : plataforma;
    return `<span class="console-chip console-chip--${familia}" title="${escapeHTML(plataforma)}">${escapeHTML(etiqueta)}</span>`;
  });
  return `<div class="console-chips" aria-label="Consolas">${chips.join("")}</div>`;
}

/* Las portadas conservan sus URL y el respaldo de texto si falla la conexión. */
export function cover(game, quick = false) {
  const poster = game.id === "gta6" ? " game-card__cover--poster" : "";
  const stock = quick && game.disponible === true ? '<span class="cover-stock">Disponible</span>' : "";
  const ojo = quick ? `<button data-game-id="${escapeHTML(game.id)}" type="button" class="quick-view" aria-label="Vista rápida de ${escapeHTML(game.name)}"><i class="bi bi-eye" aria-hidden="true"></i></button>` : "";
  return `<div class="game-card__cover${poster}"><img src="${escapeHTML(game.cover)}" alt="${escapeHTML(game.alt)}" loading="${quick ? "lazy" : "eager"}" decoding="async" width="460" height="215"><span class="image-fallback" hidden>${escapeHTML(game.name)}</span>${stock}${ojo}</div>`;
}
  export function favoriteButton(game, favorites) {
    let selected = favorites.has(game.id);
    return `<button data-game-id="${escapeHTML(game.id)}" class="btn icon fav" type="button" aria-pressed="${selected}" aria-label="${selected ? "Quitar" : "Agregar"} ${escapeHTML(game.name)} ${selected ? "de" : "a"} favoritos"><i class="bi ${selected ? "bi-heart-fill" : "bi-heart"}" aria-hidden="true"></i></button>`;
  }
  export function card(game, favorites) {
    return `<article class="game-card" data-id="${escapeHTML(game.id)}" data-genre="${escapeHTML(game.genres[0])}">${cover(game, true)}<div class="game-card__body"><h3 class="game-card__title" title="${escapeHTML(game.name)}">${escapeHTML(game.name)}</h3><div class="card-meta"><span class="tag g" data-genre="${escapeHTML(game.genres[0])}">${escapeHTML(game.genres[0])}</span><span>${game.year}</span></div>${etiquetasConsola(game.platforms)}<div class="game-card__actions"><button data-game-id="${escapeHTML(game.id)}" class="btn detail" type="button">Ver detalle <i class="bi bi-arrow-up-right" aria-hidden="true"></i></button>${favoriteButton(game, favorites)}</div></div></article>`;
  }
