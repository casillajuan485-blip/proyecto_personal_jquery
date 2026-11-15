# Atlas Pixel · Responsabilidad UI · Responsividad

Responsividad original: 360/390/768 px, horizontal, teclado, áreas táctiles y textos largos.

## Alcance real y puntos ausentes

Se interpreta Responsabilidad UI como responsividad y puntos críticos móviles de la rúbrica compartida. No se adjuntó una nueva imagen en este último mensaje. Las pruebas de escritorio no sustituyen el teclado físico del teléfono.

Esta carpeta funciona sin archivos de las otras nueve. Conserva el CSS, recursos, datos y manejadores originales seleccionados. Se retiraron secciones que no forman parte de este grupo. Las funciones auxiliares que siguen apareciendo son dependencias del código original, no ejemplos nuevos.

## Ejecutar y publicar

Abre **esta carpeta** con Live Server o publica su contenido en GitHub Pages. Mantén index.html en la raíz, junto con estilo.css, app.js, modules/, assets/, catalogo.json y fuente/. No abras mediante file://: los módulos y Fetch necesitan HTTP/HTTPS. No necesitas backend ni mantener tu computadora encendida al publicar.

Si las diez carpetas están en el mismo repositorio, la ruta es `https://TU-USUARIO.github.io/TU-REPOSITORIO/10_responsabilidad_UI/`. También puedes publicar esta carpeta sola en otro repositorio. No se publicaron repositorios durante esta entrega.

Esta extracción no registra un Service Worker; la PWA completa y su modo offline se estudian en la carpeta 05.

## Qué probar

1. Abre Catálogo, pulsa el icono dentro del corazón, el ojito y Ver detalle. Repite después de cambiar de página; un clic debe producir una sola acción.

2. Abre Filtros, busca Celeste y cambia género/plataforma/año. Limpiar filtros debe cerrar el panel sin abrir el teclado.

3. Intenta continuar vacío y luego con números en el nombre. Completa los pasos con datos ficticios; la revisión y el submit deben validar sin navegar ni enviar datos.

4. Abre la bitácora: comprueba navigation, click, favorite y change. Con formulario también submit. Filtra y limpia, cierra y vuelve a abrir sin duplicados.

5. Revisa 360×720, 390×844, 768×1024 y horizontal 800×270. Abre el teclado del teléfono: navegación abajo, campo visible y acciones sobre ella. Los casos extremos permiten desplazamiento interno del campo/panel, nunca obligan a desplazar toda la página.

## Funciones extraídas y dónde se utilizan

Las líneas de origen corresponden a la versión 5 de app.js de Atlas Pixel. El código legible está en **fuente/funciones.js**; la página ejecuta app.js y sus módulos compilados. Los manejadores anónimos se conservan con comentarios de su línea de origen.

| Función | Qué hace / dónde se utiliza | Origen |
|---|---|---|
| loadCatalog | Solicita catalogo.json, valida su contenido y carga el respaldo local si falla. | app.js:22–38 |
| track | Conserva los contenedores cuyos eventos jQuery deben retirarse. | app.js:102–104 |
| cleanupEvents | Retira únicamente los eventos del namespace .atlas de los contenedores registrados. | app.js:105–108 |
| later | Programa una tarea y conserva su identificador para cancelarla al navegar. | app.js:111–116 |
| cleanupView | Cancela tareas de la vista y retira efectos temporales de las tarjetas. | app.js:117–120 |
| storageWarning | Muestra un aviso si el navegador no permite guardar una preferencia. | app.js:131–133 |
| persist | Guarda una preferencia en localStorage y controla sus errores. | app.js:134–140 |
| setTheme | Alterna la paleta clara/oscura y actualiza el estado accesible del botón. | app.js:141–144 |
| loadPreferences | Recupera tema y favoritos validando el formato de los datos guardados. | app.js:145–158 |
| notify | Muestra un mensaje temporal como texto seguro y cancela el aviso anterior. | app.js:159–161 |
| showView | Oculta las otras secciones, activa la elegida y actualiza navegación, título y foco. | app.js:162–166 |
| navigate | Cambia el hash para navegar y conservar historial. | app.js:167–169 |
| cover | Genera portada lazy y botón de vista rápida para un juego real. | app.js:170–172 |
| favoriteButton | Genera el corazón con identificador, etiqueta y estado aria-pressed. | app.js:173–176 |
| card | Construye la tarjeta original con datos escapados, categoría, detalle y favorito. | app.js:177–179 |
| pageControls | Genera Anterior/Siguiente y el indicador de página. | app.js:180–183 |
| filteredGames | Aplica los filtros originales sobre el catálogo cargado. | app.js:184–186 |
| fitCards | Ajusta columnas y filas al espacio real y al número de tarjetas. | app.js:188–203 |
| renderCatalog | Filtra, pagina y actualiza tarjetas, contador y controles del catálogo. | app.js:204–212 |
| renderFavorites | Muestra los juegos guardados y sincroniza sus contadores. | app.js:213–217 |
| syncFavorites | Sincroniza corazones, ficha y lista después de un cambio. | app.js:218–222 |
| renderHome | Muestra el número adecuado de recomendaciones en Inicio. | app.js:223–226 |
| buildFilters | Construye opciones y categorías a partir del catálogo real. | app.js:227–233 |
| renderFilterTags | Genera etiquetas removibles e indica si hay filtros activos. | app.js:234–243 |
| clearFilters | Limpia estado y controles sin enfocar la búsqueda ni abrir el teclado. | app.js:245–253 |
| togglePanel | Abre o cierra un panel con slideToggle y actualiza aria-expanded. | app.js:254–258 |
| openModal | Abre una ventana original, bloquea el fondo y prepara su ciclo de vida. | app.js:259–261 |
| closeModal | Cancela tareas del diálogo y recupera la interacción y el foco. | app.js:262–266 |
| showDetail | Muestra Resumen, Galería y Datos de la ficha del juego. | app.js:267–277 |
| galleryImages | Obtiene las imágenes reales del catálogo o el respaldo de la ficha. | app.js:278–280 |
| changeGallery | Cambia la imagen y los indicadores de la galería. | app.js:281–287 |
| showQuickView | Abre el resumen breve con enlace a la ficha completa. | app.js:288–291 |
| buildCollections | Construye las selecciones temáticas originales de Inicio. | app.js:292–294 |
| showSocial | Muestra uno de los perfiles sociales ficticios originales. | app.js:296–301 |
| goTo | Cambia el destacado con fadeOut/fadeIn y actualiza los indicadores. | app.js:303–310 |
| refreshCarouselTimer | Gestiona el intervalo del carrusel y sus pausas según visibilidad e interacción. | app.js:311–317 |
| setManualPause | Alterna la pausa manual y el texto del control. | app.js:318–320 |
| cancelAutoAdvance | Cancela el temporizador opcional del formulario. | app.js:322–324 |
| fieldFeedback | Muestra orientación progresiva o error del campo actual. | app.js:325–330 |
| scheduleAutoAdvance | Avanza opcionalmente tras una pausa de escritura válida. | app.js:331–337 |
| fieldValue | Obtiene el texto del campo, normalizándolo cuando corresponde. | app.js:341–344 |
| validateField | Aplica la regla original del campo y actualiza mensajes y accesibilidad. | app.js:345–348 |
| renderReview | Presenta la revisión usando texto, sin interpretar las entradas como HTML. | app.js:349–360 |
| showStep | Activa un paso y actualiza progreso y botones del asistente. | app.js:361–370 |
| advanceStep | Valida el paso actual antes de avanzar. | app.js:371–379 |
| requestStep | Permite volver o comprueba los pasos antes de saltar hacia delante. | app.js:380–390 |
| resetWizard | Limpia el formulario y restablece el primer paso. | app.js:391–393 |
| confirmForm | Impide el envío tradicional, valida y confirma la demostración local. | app.js:394–406 |
| focusSearch | Abre el panel del catálogo antes de enfocar su buscador. | app.js:425–427 |
| eventIsComposing | Detecta composición de texto para no interferir con teclados IME. | app.js:536–538 |
| viewport | Adapta la altura visible, orientación física, teclado y capacidad del catálogo. | app.js:582–617 |

Las dependencias compartidas de fuente/modules/ contienen escapeHTML, debounce, pageSize, validateCatalog, filterGames y record, además del respaldo y la vista de bitácora cuando se usan. Escape de datos, validación, paginación y limpieza mantienen su implementación original.

## Cambios necesarios para independizarla

- Vistas disponibles y ruta inicial de esta carpeta.
- Claves locales de tema/favoritos separadas para no mezclar datos con otras carpetas.
- Exportación mount/dispose para montar y ejecutar el desmontaje original.
- Señal de cancelación añadida a pagehide/pageshow para no dejar escuchadores al reactivar.

ORIGEN.json conserva líneas y hashes de procedencia. No se modificó el ZIP ni la carpeta originales.
