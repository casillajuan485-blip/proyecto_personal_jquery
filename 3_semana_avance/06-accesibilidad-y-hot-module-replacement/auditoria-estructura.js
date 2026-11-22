export const nombre = "Versión A · Estructura";
export function auditar(pagina) {
  const principal = pagina.querySelectorAll("main").length;
  const salto = pagina.querySelector('a[href="#contenido"]');
  const valido = Boolean(salto && pagina.querySelector(salto.getAttribute("href")));
  return principal + " región principal. Enlace de salto " + (valido ? "operativo." : "sin destino.");
}
