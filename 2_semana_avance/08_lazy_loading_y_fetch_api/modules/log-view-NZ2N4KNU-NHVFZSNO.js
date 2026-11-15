import {
  clear,
  escapeHTML,
  initialize,
  list
} from "./chunk-BJUE7TP6.js";

async function mount(host, signal) {
  if (await initialize(), signal.aborted) return;
  let page = 1, category = "";
  host.innerHTML = '<h2 id="mTitle">Bit\xE1cora de eventos</h2><p class="edition-note">\xDAltimos 100 eventos t\xE9cnicos. No registra lo que escribes.</p><div class="log-tools"><label>Tipo<select id="logType"><option value="">Todos</option>' + ["navigation", "click", "change", "input", "submit", "filter", "favorite", "timer", "connection", "fetch", "storage", "error", "pwa"].map((t) => "<option>" + t + "</option>").join("") + '</select></label><button class="btn" id="logClear" type="button">Limpiar</button></div><ol id="logRows"></ol><div class="pagination"><button class="btn" id="logPrev">Anterior</button><span id="logPage"></span><button class="btn" id="logNext">Siguiente</button></div><p id="logStatus" role="status"></p>';
  function render() {
    if (signal.aborted) return;
    let items = list().filter((e) => !category || e.type === category).reverse(), size = window.innerHeight < 560 ? 2 : 5, total = Math.max(1, Math.ceil(items.length / size));
    page = Math.min(page, total), host.querySelector("#logRows").innerHTML = items.slice((page - 1) * size, page * size).map((e) => "<li><time>" + escapeHTML(new Date(e.time).toLocaleTimeString("es-BO")) + "</time><strong>" + escapeHTML(e.type) + "</strong><span>" + escapeHTML(e.message) + "</span></li>").join("") || "<li>Sin eventos.</li>", host.querySelector("#logPage").textContent = page + " / " + total, host.querySelector("#logPrev").disabled = page === 1, host.querySelector("#logNext").disabled = page === total;
  }
  let $host = $(host), $window = $(window);
  $host.off("click.atlasLog", "#logPrev, #logNext, #logClear").on("click.atlasLog", "#logPrev, #logNext, #logClear", async function() {
    if (this.id === "logPrev") page--;
    else if (this.id === "logNext") page++;
    else if (this.id === "logClear") {
      if (await clear(), signal.aborted) return;
      host.querySelector("#logStatus").textContent = "Bit\xE1cora vaciada.";
    } else return;
    render();
  }), $host.off("change.atlasLog", "#logType").on("change.atlasLog", "#logType", function() {
    category = this.value, page = 1, render();
  }), $window.off("atlas:journal.atlasLog resize.atlasLog").on("atlas:journal.atlasLog resize.atlasLog", render), signal.addEventListener("abort", () => {
    $host.off(".atlasLog"), $window.off(".atlasLog");
  }, { once: true }), render();
}
export {
  mount
};
