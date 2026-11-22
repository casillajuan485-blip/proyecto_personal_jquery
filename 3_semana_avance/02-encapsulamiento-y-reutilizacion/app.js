// Cada llamada conserva el estado y las referencias de una sola tarjeta.
function activarFavorito(tarjeta) {
  const boton = tarjeta.querySelector(".favorito");
  const juego = tarjeta.querySelector("h3").textContent;
  let favorito = false;
  boton.addEventListener("click", () => {
    favorito = !favorito;
    tarjeta.dataset.favorito = favorito;
    boton.setAttribute("aria-pressed", favorito);
    boton.textContent = favorito ? "Quitar de favoritos" : "Agregar a favoritos";
    boton.setAttribute("aria-label", boton.textContent + " · " + juego);
  });
}
document.querySelectorAll(".tarjeta").forEach(activarFavorito);

// Si una portada remota falla, queda visible el nombre del juego.
document.querySelectorAll(".portada img").forEach(imagen => {
  const mostrarRespaldo = () => { imagen.hidden = true; };
  imagen.addEventListener("error", mostrarRespaldo, { once: true });
  if (imagen.complete && !imagen.naturalWidth) mostrarRespaldo();
});
