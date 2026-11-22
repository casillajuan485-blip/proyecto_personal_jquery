const catalogo = document.querySelector(".catalogo");
document.querySelector("#accion").addEventListener("click", () => {
  const tarjetas = [...catalogo.querySelectorAll("article.tarjeta")];
  const fichas = [...catalogo.querySelectorAll("details")];
  const ficha = fichas[0];
  const resumen = ficha?.querySelector("summary");
  const abierto = ficha?.open;
  resumen?.click();
  const responde = Boolean(resumen && ficha.open !== abierto);
  if (ficha) ficha.open = abierto;

  const comprobaciones = [
    [tarjetas.length === 3, tarjetas.length + " tarjetas de 3 esperadas"],
    [fichas.length === tarjetas.length && fichas.length > 0, fichas.length + " controles de ficha"],
    [tarjetas.length > 0 && tarjetas.every(tarjeta => tarjeta.querySelector("h3")?.textContent.trim()), "Títulos visibles en las tarjetas"],
    [responde, "La primera ficha responde al control"]
  ];
  const lista = document.createElement("ul");
  for (const [pasa, nombre] of comprobaciones) {
    const item = document.createElement("li");
    item.textContent = (pasa ? "PASA · " : "FALLA · ") + nombre;
    lista.append(item);
  }
  const total = comprobaciones.filter(([pasa]) => pasa).length;
  const resumenFinal = document.createElement("strong");
  resumenFinal.textContent = total + " de " + comprobaciones.length + " comprobaciones aprobadas";
  document.querySelector("#diagnostico").replaceChildren(resumenFinal, lista);
});

// Si una portada remota falla, queda visible el nombre del juego.
document.querySelectorAll(".portada img").forEach(imagen => {
  const mostrarRespaldo = () => { imagen.hidden = true; };
  imagen.addEventListener("error", mostrarRespaldo, { once: true });
  if (imagen.complete && !imagen.naturalWidth) mostrarRespaldo();
});
