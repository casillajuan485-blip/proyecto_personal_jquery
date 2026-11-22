/* Bitácora técnica en IndexedDB. Guarda como máximo 100 eventos y sus metadatos. */
let apertura;
function abrir() {
  apertura ??= new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open("atlaspixel-bitacora", 1);
    peticion.onupgradeneeded = () => peticion.result.createObjectStore("eventos", { keyPath: "id" });
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error);
    peticion.onblocked = () => rechazar(new Error("Bitácora ocupada"));
  });
  return apertura;
}
async function operar(modo, accion) {
  const db = await abrir();
  return new Promise((resolver, rechazar) => {
    const tx = db.transaction("eventos", modo);
    const resultado = accion(tx.objectStore("eventos"));
    tx.oncomplete = () => resolver(resultado?.result);
    tx.onabort = () => rechazar(tx.error);
    tx.onerror = () => rechazar(tx.error);
  });
}
export function guardar(evento) {
  return operar("readwrite", store => {
    store.put(evento);
    const claves = store.getAllKeys();
    claves.onsuccess = () => {
      for (const id of claves.result.slice(0, -100)) store.delete(id);
    };
  });
}
export const leer = () => operar("readonly", store => store.getAll());
export const vaciar = () => operar("readwrite", store => store.clear());
