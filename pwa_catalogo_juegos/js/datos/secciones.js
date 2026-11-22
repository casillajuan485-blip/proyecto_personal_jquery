/* Valida las tres colecciones del catálogo y ofrece un respaldo local. */
const esTexto = valor => typeof valor === "string" && valor.length <= 300;
function validar(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) throw new Error("Formato inválido");
    for (const clave of ["quick", "adventure", "indie"]) {
      const item = datos[clave];
      if (!item || ![item.title, item.description, item.icon].every(esTexto) ||
          !/^[a-z-]+$/.test(item.icon) || !Array.isArray(item.ids) ||
          !item.ids.every(id => typeof id === "string" && /^[a-z0-9-]+$/.test(id))) {
        throw new Error("Colección inválida");
      }
    }
    return { quick: datos.quick, adventure: datos.adventure, indie: datos.indie };
}

/* Datos por sección con tiempo límite, cancelación y respaldo local. */
export async function cargarSeccion(nombre, signal) {
  const controller = new AbortController();
  const cancelar = () => controller.abort();
  if (signal.aborted) return null;
  signal.addEventListener("abort", cancelar, { once: true });
  const timer = setTimeout(cancelar, 6000);
  try {
    const respuesta = await fetch(new URL("datos/" + nombre + ".json", document.baseURI), { signal: controller.signal });
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    const datos = await respuesta.json();
    return validar(datos);
  } catch {
    if (signal.aborted) return null;
    return (await import("./respaldo-secciones.js")).respaldo[nombre];
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancelar);
  }
}
