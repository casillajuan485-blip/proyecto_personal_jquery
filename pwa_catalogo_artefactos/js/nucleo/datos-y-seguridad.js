/**
 * MÓDULO: js/nucleo/datos-y-seguridad.js
 * RESPONSABILIDAD:
 *  - Sanitización obligatoria contra ataques XSS usando DOMPurify.
 *  - Carga asíncrona de datos JSON con Fetch API y tiempo límite (timeout).
 *  - Persistencia local en localStorage y carga de respaldo offline.
 *  - Validación segura de URLs (Google Maps e imágenes locales/HTTPS).
 */

import DOMPurify from "../librerias/dompurify.js";

/* ==========================================================================
   1. PERSISTENCIA EN LOCALSTORAGE
   ========================================================================== */

/** Lee una colección guardada previamente en localStorage. */
function leerLocal(clave) {
  try {
    return JSON.parse(localStorage.getItem("luminatech:" + clave));
  } catch {
    return null;
  }
}

/** Guarda una colección en localStorage para uso offline futuro. */
function guardarLocal(clave, datos) {
  try {
    localStorage.setItem("luminatech:" + clave, JSON.stringify(datos));
  } catch {
    /* Se ignora si el almacenamiento está lleno o bloqueado */
  }
}

/* ==========================================================================
   2. CARGA ASÍNCRONA CON FETCH API Y RESPALDO OFFLINE
   ========================================================================== */

/**
 * Obtiene un archivo JSON de datos/<nombre>.json.
 * Si falla la red o el Service Worker devuelve copia en respaldo (X-Luz-Respaldo),
 * intenta leer primero de localStorage y luego de datos/respaldo/<nombre>.json.
 */
async function cargarDatos(nombre, validarEstructura) {
  const solicitar = async ruta => {
    const respuesta = await fetch("./datos/" + ruta, {
      signal: AbortSignal.timeout(5500)
    });
    if (!respuesta.ok) throw new Error("Respuesta no disponible");
    const json = await respuesta.json();
    if (!validarEstructura(json)) throw new Error("Formato de datos inválido");
    return {
      datos: json,
      respaldo: respuesta.headers.has("X-Luz-Respaldo")
    };
  };

  try {
    const resultado = await solicitar(nombre + ".json");
    if (resultado.respaldo) {
      const copiaLocal = leerLocal(nombre);
      if (validarEstructura(copiaLocal)) {
        return { datos: copiaLocal, respaldo: true };
      }
    } else {
      guardarLocal(nombre, resultado.datos);
    }
    return resultado;
  } catch {
    const copiaLocal = leerLocal(nombre);
    if (validarEstructura(copiaLocal)) {
      return { datos: copiaLocal, respaldo: true };
    }
    const respaldo = await solicitar("respaldo/" + nombre + ".json");
    return { ...respaldo, respaldo: true };
  }
}

/* ==========================================================================
   3. PROTECCIÓN XSS OBLIGATORIA CON DOMPURIFY
   ========================================================================== */

/**
 * Limpia cualquier cadena de texto antes de insertarla en el DOM,
 * eliminando etiquetas HTML y atributos peligrosos.
 */
function sanitizar(texto) {
  const fragmento = DOMPurify.sanitize(String(texto ?? ""), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    RETURN_DOM_FRAGMENT: true
  });
  return String(fragmento.textContent ?? "").trim();
}

/* ==========================================================================
   4. VALIDACIÓN DE URLS Y CARGA SEGURA DE IMÁGENES
   ========================================================================== */

/** Valida que la imagen de respaldo sea una ruta local WebP permitida. */
function validarRespaldo(ruta) {
  return /^imagenes\/[a-z0-9-]+\.webp$/.test(ruta) ? ruta : "imagenes/lamparas.webp";
}

/** Permite únicamente enlaces HTTPS legítimos hacia Google Maps. */
function validarMapa(url) {
  try {
    const u = new URL(url);
    const dominiosPermitidos = ["maps.google.com", "www.google.com", "maps.app.goo.gl"];
    const rutaValida = u.hostname !== "www.google.com" || /^\/maps(?:\/|$)/.test(u.pathname);
    return u.protocol === "https:" && dominiosPermitidos.includes(u.hostname) && rutaValida && !u.username && !u.password
      ? u.href
      : "";
  } catch {
    return "";
  }
}

/** Valida rutas locales de imágenes de productos o URLs HTTPS seguras. */
function validarUrlImagen(url) {
  if (/^imagenes\/(?:productos\/)?[a-z0-9-]+\.(?:jpg|jpeg|png|webp)$/.test(url)) {
    return url;
  }
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
  } catch {
    return "";
  }
}

/**
 * Asigna la imagen del producto al elemento <img> y configura un fallback
 * automático a la imagen ilustrativa local si ocurre un error de carga.
 */
function cargarImagen(imgEl, producto) {
  const respaldo = validarRespaldo(producto.respaldo);
  const srcValida = validarUrlImagen(producto.imagen);
  const marco = imgEl.parentElement;

  marco.classList.remove("foto--respaldo");
  imgEl.referrerPolicy = "no-referrer";
  imgEl.onerror = () => {
    imgEl.onerror = null;
    marco.classList.add("foto--respaldo");
    imgEl.src = respaldo;
  };

  if (srcValida) {
    imgEl.src = srcValida;
  } else {
    imgEl.onerror();
  }
}

export { cargarDatos, sanitizar, validarMapa, validarUrlImagen, cargarImagen };
