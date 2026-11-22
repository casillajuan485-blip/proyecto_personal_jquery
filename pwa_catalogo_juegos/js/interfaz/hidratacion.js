/* Hidratación por control. Se activa después de conectar los eventos delegados y los directos. */
const selector = "button, input, select, textarea, a[href], .game-card[ tabindex ]";

export function hidratarControles(raiz, signal) {
  const hidratados = new WeakSet();
  function hidratar(control) {
    if (hidratados.has(control)) return;
    hidratados.add(control);
    control.dataset.hydration = "ready";
    if (control instanceof HTMLButtonElement && !control.hasAttribute("type")) control.type = "button";
  }
  function recorrer(nodo) {
    if (!(nodo instanceof Element)) return;
    if (nodo.matches(selector)) hidratar(nodo);
    nodo.querySelectorAll(selector).forEach(hidratar);
  }
  recorrer(raiz);
  /* También hidrata fichas, botones de favoritos y controles que se renderizan después. */
  const observador = new MutationObserver(cambios => {
    for (const cambio of cambios) cambio.addedNodes.forEach(recorrer);
  });
  observador.observe(raiz, { childList: true, subtree: true });
  signal.addEventListener("abort", () => observador.disconnect(), { once: true });
}
