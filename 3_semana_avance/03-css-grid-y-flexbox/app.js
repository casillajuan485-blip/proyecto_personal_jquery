const catalogo = document.querySelector(".catalogo");
document.querySelector("#accion").addEventListener("click", evento => {
  const compacta = catalogo.classList.toggle("compacta");
  evento.currentTarget.setAttribute("aria-pressed", compacta);
  document.querySelector("#diagnostico").textContent = compacta
    ? "Una columna activa. Cada tarjeta conserva sus elementos alineados."
    : "Cuadrícula adaptable activa.";
});

// Si una portada remota falla, queda visible el nombre del juego.
document.querySelectorAll(".portada img").forEach(imagen => {
  const mostrarRespaldo = () => { imagen.hidden = true; };
  imagen.addEventListener("error", mostrarRespaldo, { once: true });
  if (imagen.complete && !imagen.naturalWidth) mostrarRespaldo();
});
