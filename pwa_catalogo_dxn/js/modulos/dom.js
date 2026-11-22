/**
 * Módulo de utilidades del DOM, seguridad XSS, animaciones jQuery y optimización.
 * Responsabilidad: manipular el DOM de forma segura y eficiente sin duplicar eventos.
 */

// [ACCESIBILIDAD] Detecta si el usuario prefiere reducir animaciones en su sistema.
const prefiereReducirMovimiento = matchMedia("(prefers-reduced-motion: reduce)");

/**
 * [ATENCIÓN DOM] Obtiene un elemento por su ID de forma concisa.
 */
export const obtenerPorId = (id) => document.getElementById(id);

/**
 * [SEGURIDAD XSS] Sanitización obligatoria con DOMPurify.
 * Elimina cualquier etiqueta o atributo HTML peligroso antes de insertar texto en el DOM o URLs.
 */
export function sanitizarTexto(valor) {
  const textoSeguro = String(valor ?? "").slice(0, 600);
  if (globalThis.DOMPurify?.isSupported) {
    return DOMPurify.sanitize(textoSeguro, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      RETURN_DOM_FRAGMENT: true,
    }).textContent;
  }
  return textoSeguro;
}

/**
 * [SEGURIDAD XSS + OPTIMIZACIÓN DOM] Inserta texto sanitizado usando textContent.
 */
export function asignarTexto(elemento, valor) {
  if (elemento) elemento.textContent = sanitizarTexto(valor);
}

/**
 * [ANIMACIONES jQuery: .fadeIn(), .fadeOut(), .show(), .hide()]
 * Muestra u oculta elementos respetando prefers-reduced-motion.
 */
export function mostrarConEfecto(elemento, visible, modo = "fade") {
  const $ = globalThis.jQuery;
  if (!$) {
    elemento.hidden = !visible;
    return;
  }
  const $el = $(elemento).stop(true, true);
  if (visible) {
    elemento.hidden = false;
    if (modo === "fade" && !prefiereReducirMovimiento.matches) {
      $el.hide().fadeIn(160);
    } else {
      $el.show();
    }
  } else if (modo === "fade" && !prefiereReducirMovimiento.matches) {
    $el.fadeOut(160, () => {
      elemento.hidden = true;
    });
  } else {
    $el.hide();
    elemento.hidden = true;
  }
}

/**
 * [ANIMACIONES jQuery: .slideToggle()]
 * Alterna bloques desplegables con efecto deslizante suave.
 */
export function alternarDesplegable(elemento) {
  const $ = globalThis.jQuery;
  const estabaOculto = elemento.hidden;
  if (!$ || prefiereReducirMovimiento.matches) {
    mostrarConEfecto(elemento, estabaOculto, "directo");
    return estabaOculto;
  }
  const $el = $(elemento).stop(true, true);
  if (estabaOculto) {
    elemento.hidden = false;
    $el.hide();
  }
  $el.slideToggle(160, () => {
    if (!estabaOculto) elemento.hidden = true;
  });
  return estabaOculto;
}

/**
 * [DELEGACIÓN DE EVENTOS DINÁMICOS Y PREVENCIÓN DE MEMORY LEAKS]
 * Utiliza .off() y .on() de jQuery (con espacio de nombres) para evitar eventos duplicados
 * en tarjetas y botones generados dinámicamente, devolviendo una función de limpieza.
 */
export function delegarEventos(contenedor, espacioNombres, reglas) {
  const $ = globalThis.jQuery;
  if ($) {
    const $cont = $(contenedor).off("." + espacioNombres);
    for (const [evento, selector, manejador] of reglas) {
      $cont.on(`${evento}.${espacioNombres}`, selector, function (e) {
        manejador(e, this);
      });
    }
    return () => $cont.off("." + espacioNombres);
  }

  const controlador = new AbortController();
  for (const [evento, selector, manejador] of reglas) {
    contenedor.addEventListener(
      evento,
      (e) => {
        const objetivo = e.target.closest(selector);
        if (objetivo && contenedor.contains(objetivo)) manejador(e, objetivo);
      },
      { signal: controlador.signal }
    );
  }
  return () => controlador.abort();
}

/**
 * [DEBOUNCE] Evita ejecuciones excesivas en búsquedas y filtros mientras el usuario escribe.
 */
export function crearDebounce(fn, esperaMs = 180) {
  let temporizador;
  function ejecutada(...args) {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), esperaMs);
  }
  ejecutada.cancelar = () => clearTimeout(temporizador);
  return ejecutada;
}

/**
 * [LAZY LOADING Y SEGURIDAD DE IMÁGENES]
 * Valida la URL de la imagen y maneja errores de carga sin romper la tarjeta.
 */
export function cargarFotoProducto(contenedorFoto, urlImagen, nombreProducto) {
  const img = contenedorFoto.querySelector("img");
  const aviso = contenedorFoto.querySelector("span");
  const mostrarRespaldo = () => {
    img.hidden = true;
    aviso.hidden = false;
  };
  const esUrlValida =
    typeof urlImagen === "string" &&
    (/^https:\/\/www\.dxn2u\.com\/product\/images\//.test(urlImagen) ||
      /^\.\/img\/productos\/[a-zA-Z0-9._-]+$/.test(urlImagen));

  if (!esUrlValida) {
    mostrarRespaldo();
    return;
  }
  img.alt = "Empaque de " + sanitizarTexto(nombreProducto);
  img.loading = "lazy";
  img.decoding = "async";
  img.addEventListener("error", mostrarRespaldo, { once: true });
  img.src = urlImagen;
}
