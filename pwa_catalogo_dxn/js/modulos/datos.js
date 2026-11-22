/**
 * Módulo de datos asíncronos, almacenamiento local (localStorage) y respaldo offline.
 * Responsabilidad: obtener las 45 fichas de productos desde archivos .json independientes.
 */

const FAMILIAS = ["cafes", "bebidas", "alimentos", "suplementos"];
let promesaCatalogo;

/**
 * Devuelve el diccionario de categorías disponibles en el catálogo.
 */
export function obtenerFamilias() {
  return {
    cafes: "Cafés",
    bebidas: "Bebidas",
    alimentos: "Alimentos",
    suplementos: "Suplementos",
  };
}

/**
 * [FETCH API] Realiza peticiones JSON asíncronas con tiempo límite y manejo de errores HTTP.
 */
export async function obtenerJson(ruta) {
  const respuesta = await fetch(ruta, { signal: AbortSignal.timeout(6500) });
  if (!respuesta.ok) throw new Error("Respuesta HTTP " + respuesta.status);
  return respuesta.json();
}

/**
 * [ALMACENAMIENTO LOCAL + RESPALDO OFFLINE]
 * 1) Intenta cargar el .json actualizado y lo guarda en localStorage.
 * 2) Si falla la red, lee desde localStorage.
 * 3) Como último recurso, importa dinámicamente respaldo.js.
 */
async function cargarFamilia(familia) {
  const ruta = `./datos/${familia}.json`;
  const claveLocal = `dxn:catalogo:v2:${familia}`;
  try {
    const { productos } = await obtenerJson(ruta);
    if (!Array.isArray(productos) || !productos.length) {
      throw new Error("Archivo de familia incompleto");
    }
    try {
      localStorage.setItem(claveLocal, JSON.stringify(productos));
    } catch {
      // Si el almacenamiento está lleno, continúa sin interrumpir la carga.
    }
    return { productos, respaldo: false };
  } catch {
    try {
      const guardado = JSON.parse(localStorage.getItem(claveLocal));
      if (Array.isArray(guardado) && guardado.length) {
        return { productos: guardado, respaldo: true };
      }
    } catch {
      // Continúa al respaldo estático.
    }
    const { respaldo } = await import("./respaldo.js");
    return { productos: respaldo[familia] || [], respaldo: true };
  }
}

/**
 * [CARGA ASÍNCRONA PARALELA] Carga las 4 familias de productos una sola vez y las memoriza.
 */
export function cargarCatalogo() {
  promesaCatalogo ??= Promise.all(
    FAMILIAS.map(async (familia) => {
      const resultado = await cargarFamilia(familia);
      return {
        ...resultado,
        productos: resultado.productos.map((item) => ({ ...item, familia })),
      };
    })
  )
    .then((resultados) => ({
      productos: resultados.flatMap((r) => r.productos),
      respaldo: resultados.some((r) => r.respaldo),
    }))
    .catch((err) => {
      promesaCatalogo = undefined;
      throw err;
    });

  return promesaCatalogo;
}
