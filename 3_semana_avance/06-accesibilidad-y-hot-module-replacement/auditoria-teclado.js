export const nombre = "Versión B · Teclado";
export function auditar(pagina) {
  const fichas = [...pagina.querySelectorAll(".tarjeta details > summary:first-child")];
  const nombradas = fichas.filter(control => control.textContent.trim()).length;
  return nombradas + " de " + fichas.length + " fichas con un control nativo y texto visible.";
}
