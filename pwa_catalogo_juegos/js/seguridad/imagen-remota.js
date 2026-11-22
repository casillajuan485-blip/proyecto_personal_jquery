/* Se aceptan solo las rutas HTTPS de las dos fuentes de arte del catálogo. */
export function imagenRemotaValida(valor) {
  return typeof valor === "string" && (
    /^https:\/\/cdn\.cloudflare\.steamstatic\.com\/steam\/apps\/\d+\/header\.jpg$/.test(valor) ||
    valor === "https://polymarket-upload.s3.us-east-2.amazonaws.com/gta-vi-released-before-june-2026-igCgZsDMejF1.jpg"
  );
}
