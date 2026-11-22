import { imagenRemotaValida } from "./imagen-remota.js";
/* Punto único para las plantillas HTML. Los datos libres se muestran mediante textContent/.text(). */
const etiquetas = new Set("article div span h2 h3 h4 button img i p a dl dt dd strong ol li time small select option label".split(" "));
const atributos = new Set("id class title type hidden src alt width height loading decoding fetchpriority href target rel role tabindex".split(" "));

function rutaValida(valor, imagen) {
  if (imagen) return imagenRemotaValida(valor);
  return valor.startsWith("#");
}

/* Segunda barrera: reconstruye únicamente los nodos y atributos permitidos. */
function reconstruirSeguro(fragmento) {
  function copiar(nodo, destino) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      destino.append(document.createTextNode(nodo.data));
      return;
    }
    if (nodo.namespaceURI !== "http://www.w3.org/1999/xhtml" || !etiquetas.has(nodo.localName)) return;
    const elemento = document.createElement(nodo.localName);
    for (const {name, value} of nodo.attributes) {
      if (!atributos.has(name) && !/^aria-[a-z-]+$/.test(name) && !/^data-[a-z-]+$/.test(name)) continue;
      if (["src", "data-src", "href"].includes(name) && !rutaValida(value, name !== "href")) continue;
      elemento.setAttribute(name, value);
    }
    for (const hijo of nodo.childNodes) copiar(hijo, elemento);
    destino.append(elemento);
  }
  const salida = document.createDocumentFragment();
  for (const nodo of fragmento.childNodes) copiar(nodo, salida);
  return salida;
}

/* DOMPurify procesa texto HTML en un fragmento separado, con una lista local de refuerzo. */
export function fragmentoSeguro(html) {
  const purificador = globalThis.DOMPurify;
  if (!purificador?.isSupported) throw new Error("DOMPurify no está disponible.");
  const fragmento = purificador.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["form", "input", "script", "style", "iframe", "object", "embed"],
    FORBID_ATTR: ["style", "srcset"],
    RETURN_DOM_FRAGMENT: true
  });
  return reconstruirSeguro(fragmento);
}
