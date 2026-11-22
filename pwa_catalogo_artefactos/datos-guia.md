# Datos de Luz & Cable

- `datos/lamparas.json`, `datos/focos.json` y `datos/cables.json` contienen listas independientes.
- Cada producto usa un `id` único dentro de su categoría. `nombre` y `resumen` aparecen en la tarjeta. `descripcion` y `especificaciones` aparecen en la ficha. `imagen` referencia un WebP en `imagenes/`.
- `precio` puede ser un número en bolivianos o `null` para cotización. `unidad` es opcional.
- `datos/negocio.json` contiene WhatsApp, el enlace de Google Maps y los datos visibles del local.
- El Manifest describe el nombre, la ruta inicial, el alcance, los colores, iconos y el modo de instalación.

