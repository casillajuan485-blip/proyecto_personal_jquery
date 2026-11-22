document.querySelector("#accion").addEventListener("click", evento => {
  const alto = document.documentElement.toggleAttribute("data-contraste");
  evento.currentTarget.setAttribute("aria-pressed", alto);
  document.querySelector("#diagnostico").textContent = alto
    ? "Alto contraste activado." : "Alto contraste desactivado.";
});

// Si una portada remota falla, queda visible el nombre del juego.
document.querySelectorAll(".portada img").forEach(imagen => {
  const mostrarRespaldo = () => { imagen.hidden = true; };
  imagen.addEventListener("error", mostrarRespaldo, { once: true });
  if (imagen.complete && !imagen.naturalWidth) mostrarRespaldo();
});
