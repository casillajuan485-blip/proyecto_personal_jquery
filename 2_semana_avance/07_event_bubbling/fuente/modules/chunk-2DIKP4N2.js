/* ATLAS PIXEL: lógica frontend. Comentarios solo por bloques. */
var escapeHTML = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), normalize = (text) => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
var allowed = /* @__PURE__ */ new Set(["navigation", "click", "change", "input", "submit", "filter", "favorite", "timer", "connection", "fetch", "storage", "error", "pwa"]), entries = [], sequence = 0;
/* BITÁCORA: eventos técnicos en memoria de la sesión. */ function record(type, message) {
  allowed.has(type) && (entries.push({ id: Date.now().toString(36) + "-" + ++sequence, time: Date.now(), type, message: String(message).slice(0, 180) }), entries = entries.slice(-100), window.dispatchEvent(new CustomEvent("atlas:journal")));
}
async function initialize() {
}
var list = () => entries.slice();
async function clear() {
  entries = [];
}
export { escapeHTML, debounce, pageSize, validateCatalog, filterGames, record, initialize, list, clear };
