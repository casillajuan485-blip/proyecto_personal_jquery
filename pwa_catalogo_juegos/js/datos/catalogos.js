import { validateCatalog } from "../utilidades.js";
export { loadCatalog };
async /* DATOS: JSON validado y respaldo local ante errores. */ function loadCatalog(signal, report) {
  let controller = new AbortController(), abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true }), signal?.aborted && abort();
  let timeout = setTimeout(abort, 6e3);
  try {
    let response = await fetch(new URL("datos/videojuegos.json", document.baseURI), { signal: controller.signal, cache: "default" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return { games: validateCatalog(await response.json()), source: "json" };
  } catch (error) {
    if (signal?.aborted) throw error;
    report("fetch", "No se pudo leer el JSON; se utilizar\xE1 el respaldo incluido.");
    let backup = await import("./respaldo-juegos.js");
    return { games: validateCatalog(backup.GAMES), source: "respaldo" };
  } finally {
    clearTimeout(timeout), signal?.removeEventListener("abort", abort);
  }
}
