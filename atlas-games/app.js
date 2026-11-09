/* ATLAS PIXEL · JavaScript + jQuery.
 * Bloques: estado, almacenamiento, vistas, tarjetas, filtros, diálogos,
 * carrusel, formulario guiado y eventos. No requiere compilación ni backend.
 */
$(function () {
  "use strict";

  /* 1. ESTADO: los objetos de data.js son la fuente única del catálogo. */
  const KEYS = { favorites: "atlaspixel.favs", theme: "atlaspixel.theme" };
  const PAGE_SIZE = 8;
  const state = { q: "", genre: "", plat: "", year: "", collection: "", sort: "az", page: 1, favPage: 1 };
  /* Selecciones editoriales con criterios explícitos; no son notas ni rankings. */
  const collections = {
    quick:{title:"Partidas rápidas",icon:"lightning-charge",description:"Rondas, niveles o intentos para jugar a tu ritmo.",ids:["celeste","cuphead","rocket","among","hades"]},
    adventure:{title:"Grandes aventuras",icon:"compass",description:"Exploración, historias y mundos por descubrir.",ids:GAMES.filter(g=>g.genres.includes("Aventura")||g.genres.includes("RPG")).map(g=>g.id)},
    indie:{title:"Joyas independientes",icon:"gem",description:"Una selección editorial de propuestas independientes.",ids:["hollow","celeste","hades","stardew","terraria","disco","cuphead","undertale","outer","among"]}
  };
  const views = ["inicio", "catalogo", "favoritos", "solicitar", "info"];
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let duration = media.matches ? 0 : 180;
  let favorites = new Set();
  let activeView = "inicio";
  let opener = null;
  let modalType = null;
  let submitting = false;
  let notificationTimer = null;
  const byId = id => GAMES.find(game => game.id === id);
  const normalize = text => String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const unique = key => [...new Set(GAMES.flatMap(game => game[key]))];
  // Escapar los datos al construir plantillas; nunca interpretar entradas del formulario.
  const escape = text => String(text).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));

  /* 2. ALMACENAMIENTO: solo favoritos y tema; nunca datos personales. */
  function storageWarning() {
    $("#note").text("No pudimos guardar tus preferencias. Puedes seguir usando la página durante esta sesión.")
      .prop("hidden", false).hide().slideDown(duration);
  }
  function persist(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { storageWarning(); }
  }
  function setTheme(theme, save = true) {
    const light = theme === "light";
    $("html").attr("data-theme", light ? "light" : "dark");
    $("#themeBtn").attr({"aria-pressed": String(light), "aria-label": light ? "Activar tema oscuro" : "Activar tema claro"})
      .find("i").empty().attr("class", light ? "bi bi-moon" : "bi bi-sun");
    if (save) persist(KEYS.theme, light ? "light" : "dark");
  }
  function loadPreferences() {
    try {
      const raw = localStorage.getItem(KEYS.favorites);
      if (raw) {
        try {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids)) favorites = new Set(ids.filter(id => typeof id === "string" && byId(id)));
        } catch (_) { favorites = new Set(); } // Un JSON dañado no bloquea la interfaz.
      }
      setTheme(localStorage.getItem(KEYS.theme), false);
    } catch (_) { setTheme("dark", false); storageWarning(); }
  }
  function notify(message) {
    clearTimeout(notificationTimer);
    $("#toast").stop(true, true).text(message).slideDown(duration);
    notificationTimer = setTimeout(() => $("#toast").stop(true, true).fadeOut(duration), 2600);
  }

  /* 3. VISTAS: solo una visible. El hash conserva historial y enlaces directos. */
  function showView(id, focus = true) {
    activeView = views.includes(id) ? id : "inicio";
    if(activeView!=="solicitar")cancelAutoAdvance();
    $("main > .view").stop(true, true).prop("hidden", true).hide();
    $("#" + activeView).prop("hidden", false).fadeIn(duration);
    $("#sideNav a, #nav a").removeAttr("aria-current")
      .filter('[href="#' + activeView + '"]').attr("aria-current", "page");
    if (window.matchMedia("(max-width: 680px)").matches) $("#nav").stop(true, true).slideUp(duration);
    $("#menuBtn").attr({"aria-expanded":"false", "aria-label":"Abrir menú"});
    document.title = "Atlas Pixel · " + ({inicio:"Inicio", catalogo:"Catálogo", favoritos:"Favoritos", solicitar:"Solicitar juego", info:"Información"}[activeView]);
    refreshCarouselTimer();
    if (focus) {
      window.scrollTo({ top: 0, behavior: "instant" });
      $("#" + activeView).find("h1, h2").first().trigger("focus");
      if(activeView==="solicitar"&&steps[step].id)$("#"+steps[step].id).trigger("focus");
    }
  }
  function navigate(id, focus = true) {
    if (location.hash === "#" + id) showView(id, focus);
    else location.hash = id;
  }

  /* 4. TARJETAS COMPACTAS: sinopsis, plataformas e imágenes extra en detalles. */
  function cover(game, quick = false) {
    return `<div class="cover"><img src="${escape(game.cover)}" alt="${escape(game.alt)}" loading="lazy" width="460" height="215"><span class="image-fallback" hidden>${escape(game.name)}</span>${quick?`<button type="button" class="quick-view" aria-label="Vista rápida de ${escape(game.name)}"><i class="bi bi-eye" aria-hidden="true"></i><span>Vista rápida</span></button>`:""}</div>`;
  }
  function favoriteButton(game) {
    const selected = favorites.has(game.id);
    return `<button class="btn icon fav" type="button" aria-pressed="${selected}" aria-label="${selected ? "Quitar" : "Agregar"} ${escape(game.name)} ${selected ? "de" : "a"} favoritos"><i class="bi ${selected ? "bi-heart-fill" : "bi-heart"}" aria-hidden="true"></i></button>`;
  }
  function card(game) {
    return `<article class="card" data-id="${escape(game.id)}" data-genre="${escape(game.genres[0])}">${cover(game,true)}<div class="body"><h3>${escape(game.name)}</h3><div class="card-meta"><span class="tag g" data-genre="${escape(game.genres[0])}">${escape(game.genres[0])}</span><span>${game.year}</span></div><div class="acts"><button class="btn detail" type="button">Ver detalles <i class="bi bi-arrow-up-right" aria-hidden="true"></i></button>${favoriteButton(game)}</div></div></article>`;
  }
  function pageControls(container, current, total, kind) {
    const $container = $(container).empty().prop("hidden", total <= 1);
    if (total <= 1) return;
    function button(text, page, disabled, label) {
      const $button = $("<button type='button' class='page-btn'>").text(text).data({page, kind}).prop("disabled", disabled).attr("aria-label", label);
      if (page === current && /^\d+$/.test(text)) $button.attr("aria-current", "page");
      $button.appendTo($container);
    }
    button("←", current - 1, current === 1, "Página anterior");
    for (let page = 1; page <= total; page++) button(String(page), page, false, "Página " + page);
    button("→", current + 1, current === total, "Página siguiente");
  }
  function filteredGames() {
    const query = normalize(state.q.trim());
    const list = GAMES.filter(game => (!query || normalize(game.name).includes(query)) &&
      (!state.genre || game.genres.includes(state.genre)) && (!state.plat || game.platforms.includes(state.plat)) &&
      (!state.year || String(game.year) === state.year) && (!state.collection || collections[state.collection].ids.includes(game.id)));
    const orders = {
      az: (a,b) => a.name.localeCompare(b.name, "es"),
      za: (a,b) => b.name.localeCompare(a.name, "es"),
      new: (a,b) => b.year - a.year || a.name.localeCompare(b.name, "es"),
      old: (a,b) => a.year - b.year || a.name.localeCompare(b.name, "es")
    };
    return list.sort(orders[state.sort]);
  }
  function renderCatalog(resetPage = false) {
    if (resetPage) state.page = 1;
    const list = filteredGames();
    const total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, total);
    const start = (state.page - 1) * PAGE_SIZE;
    $("#grid").empty().append(list.slice(start, start + PAGE_SIZE).map(card).join(""))
      .stop(true, true).fadeTo(0, .65).fadeTo(duration, 1);
    $("#empty").prop("hidden", list.length > 0);
    $("#count").text(list.length ? `${start + 1}–${Math.min(start + PAGE_SIZE,list.length)} de ${list.length} ${list.length===1?"juego":"juegos"} · Página ${state.page} de ${total}` : "0 juegos encontrados");
    $("#genres .chip").each(function () { $(this).attr("aria-pressed", String(($(this).data("genre") || "") === state.genre)); });
    renderFilterTags();
    pageControls("#pagination", state.page, total, "catalog");
  }
  function renderFavorites() {
    const list = GAMES.filter(game => favorites.has(game.id));
    const total = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.favPage = Math.min(state.favPage, total);
    $("#favGrid").empty().append(list.slice((state.favPage-1)*PAGE_SIZE,state.favPage*PAGE_SIZE).map(card).join(""));
    $("#favEmpty").prop("hidden", list.length > 0);
    $("#favCount, #favCount2, #sideFavCount").text(list.length);
    pageControls("#favPagination", state.favPage, total, "favorites");
  }
  function syncFavorites(id) {
    $("#grid .card, #homeGrid .card").filter(function () { return $(this).data("id") === id; }).find(".fav").replaceWith(favoriteButton(byId(id)));
    if (modalType === "detail" && $("#mBody").data("id") === id) {
      $("#mBody .fav").attr("aria-pressed", String(favorites.has(id))).find("span").text(favorites.has(id) ? "Quitar de favoritos" : "Agregar a favoritos");
    }
    renderFavorites();
  }

  /* 5. FILTROS: valores derivados de datos y etiquetas removibles. */
  function buildFilters() {
    [["#plat",unique("platforms").sort(),"Todas"],["#year",unique("year").sort((a,b)=>b-a),"Todos"],
      ["#fp",[...unique("platforms").sort(),"PlayStation","Xbox","Nintendo Switch","Móvil","Otra"],"Elige una plataforma"]].forEach(([selector,values,initial]) => {
      $(selector).empty().append([...new Set(values)].map(value => $("<option>").val(value).text(value)))
        .prepend($("<option>").val("").text(initial)).val("");
    });
    const genres = ["", ...unique("genres").sort()];
    $("#genres").empty().append(genres.map(genre => $("<button type='button' class='chip'>").text(genre || "Todos").data("genre",genre).attr("aria-pressed",String(!genre))));
  }
  function renderFilterTags() {
    const $tags = $("#activeFilters").empty();
    const names = {q:"Búsqueda",genre:"Género",plat:"Plataforma",year:"Año",collection:"Selección"};
    Object.keys(names).forEach(key => {
      if (!state[key]) return;
      const value=key==="collection"?collections[state.collection].title:state[key];
      $("<button type='button' class='filter-tag'>").data("key",key).text(names[key]+": "+value+" ×")
        .attr("aria-label","Quitar filtro "+names[key]+": "+value).appendTo($tags);
    });
    const advanced=[state.plat,state.year].filter(Boolean).length;
    $("#filterButtonLabel").text(advanced?"Filtros · "+advanced:"Filtros");
    $("#clear").prop("hidden",!Object.keys(names).some(key=>state[key]) && state.sort === "az");
  }
  function clearFilters() {
    Object.assign(state,{q:"",genre:"",plat:"",year:"",collection:"",sort:"az",page:1});
    $("#globalSearch, #plat, #year").val(""); $("#sort").val("az"); renderCatalog();
  }
  function togglePanel($panel,$button) {
    $panel.stop(true,true);
    const opening = $panel.prop("hidden");
    if (opening) $panel.prop("hidden",false).hide().slideDown(duration);
    else $panel.slideUp(duration,()=> $panel.prop("hidden",true));
    $button.attr("aria-expanded",String(opening));
  }

  /* 6. DIÁLOGO: Escape, bloqueo del fondo y devolución del foco. */
  function openModal(content,type,id = null) {
    if($("#modal").prop("hidden"))opener = document.activeElement;
    modalType = type;
    $(".dlg").toggleClass("detail-dialog",type==="detail");
    $("#mBody").empty().data("id",id).append(content);
    $(".dlg").scrollTop(0);
    $("body").addClass("dialog-open"); $("header, main, footer, aside").prop("inert",true);
    $("#modal").stop(true,true).prop("hidden",false).hide().fadeIn(duration);
    $(".dlg").trigger("focus"); pause.modal = true; refreshCarouselTimer();
  }
  function closeModal() {
    submitting = false; $("#send").prop("disabled",false);
    $("#modal").stop(true,true).fadeOut(duration,function () {
      $(this).prop("hidden",true); $("header, main, footer, aside").prop("inert",false); $("body").removeClass("dialog-open");
      modalType = null; pause.modal = false; refreshCarouselTimer();
      if (opener && document.contains(opener)) $(opener).trigger("focus");
      else $("#"+activeView).find("h1, h2").first().trigger("focus");
    });
  }
  function showDetail(id) {
    const game = byId(id); if (!game) return;
    const source = new URL(game.source);
    const link = source.protocol === "https:" && source.hostname === "store.steampowered.com" ? `<a class="source-link" href="${escape(source.href)}" target="_blank" rel="noopener noreferrer">Ficha oficial ↗</a>` : "";
    const images=galleryImages(game);
    openModal(`<div class="detail-banner"><img src="${escape(game.hero)}" alt="" width="1280" height="720"><div><span class="eyebrow">DESCUBRE EL JUEGO</span><h2 id="mTitle">${escape(game.name)}</h2></div></div><div class="detail-content"><div class="detail-facts"><div><i class="bi bi-controller" aria-hidden="true"></i><span>Plataformas<strong>${escape(game.platforms.join(" · "))}</strong></span></div><div><i class="bi bi-grid" aria-hidden="true"></i><span>Géneros<strong>${escape(game.genres.join(" · "))}</strong></span></div><div><i class="bi bi-calendar3" aria-hidden="true"></i><span>Edición de Steam<strong>${game.year}</strong></span></div></div><p class="detail-synopsis">${escape(game.synopsis)}</p><p>${escape(game.description)}</p><div class="detail-actions">${link}<button class="btn fav" type="button" aria-pressed="${favorites.has(id)}" data-id="${escape(id)}"><i class="bi bi-heart" aria-hidden="true"></i><span>${favorites.has(id)?"Quitar de favoritos":"Agregar a favoritos"}</span></button></div><div class="game-gallery" role="region" aria-label="Galería de ${escape(game.name)}"><div class="gallery-heading"><h3>Dentro de este mundo</h3><span id="galleryCount" role="status" aria-live="polite">1 de ${images.length}</span></div><div class="gallery-stage"><img class="gallery-main" src="${escape(images[0].src)}" alt="${escape(images[0].label+" de "+game.name)}"><button class="gallery-arrow gallery-prev" type="button" aria-label="Imagen anterior">‹</button><button class="gallery-arrow gallery-next" type="button" aria-label="Imagen siguiente">›</button><p class="gallery-error" hidden>Esta imagen no está disponible. Prueba otra de la galería.</p></div><div class="gallery-thumbs">${images.map((img,index)=>`<button type="button" class="gallery-thumb" data-index="${index}" aria-pressed="${index===0}" aria-label="Ver imagen ${index+1}: ${escape(img.label)}"><img src="${escape(img.src)}" alt="" loading="lazy"></button>`).join("")}</div></div><p class="edition-note">Datos de la edición de Steam. Imágenes © sus respectivos titulares.</p></div>`,"detail",id);
    $("#mBody").data("galleryIndex",0);
  }
  function galleryImages(game) {return game.gallery?.length?game.gallery:[{src:game.hero,label:"Captura del juego"},{src:game.cover,label:"Arte promocional"}];}
  function changeGallery(index) {
    if(modalType!=="detail")return;
    const game=byId($("#mBody").data("id")),images=galleryImages(game);
    index=(index+images.length)%images.length;$("#mBody").data("galleryIndex",index);
    $(".gallery-error").prop("hidden",true);
    $(".gallery-main").stop(true,true).fadeOut(duration,function(){$(this).attr({src:images[index].src,alt:images[index].label+" de "+game.name}).fadeIn(duration);});
    $("#galleryCount").text((index+1)+" de "+images.length);
    $(".gallery-thumb").attr("aria-pressed","false").eq(index).attr("aria-pressed","true");
  }
  function showQuickView(id) {
    const game=byId(id);if(!game)return;
    openModal(`${cover(game)}<span class="eyebrow">VISTA RÁPIDA</span><h2 id="mTitle">${escape(game.name)}</h2><p>${escape(game.synopsis)}</p><div class="tags"><span class="tag">${escape(game.genres.join(" / "))}</span><span class="tag">${game.year}</span></div><p class="edition-note">${escape(game.platforms.join(" · "))}</p><button class="btn primary detail" type="button" data-id="${escape(id)}">Ver ficha completa →</button>`,"quick",id);
  }
  function buildCollections() {
    $("#collections").empty().append(Object.entries(collections).map(([key,item])=>`<button type="button" class="collection-tile" data-collection="${key}"><i class="bi bi-${item.icon}" aria-hidden="true"></i><span><strong>${item.title}</strong><small>${item.description}</small></span><span class="collection-count">${item.ids.filter(byId).length} →</span></button>`));
  }
  /* EMPRESA FICTICIA: perfiles locales de muestra; enlaces a las plataformas generales. */
  const socialProfiles = {
    instagram:{name:"Instagram",icon:"instagram",handle:"@atlaspixel_demo",text:"Portadas, descubrimientos y momentos de juego.",url:"https://www.instagram.com/"},
    facebook:{name:"Facebook",icon:"facebook",handle:"Atlas Pixel · Perfil de muestra",text:"Novedades del catálogo y comunidad gaming.",url:"https://www.facebook.com/"},
    youtube:{name:"YouTube",icon:"youtube",handle:"Atlas Pixel · Canal de muestra",text:"Recorridos por videojuegos y recomendaciones editoriales.",url:"https://www.youtube.com/"}
  };
  function showSocial(key) {
    const profile=socialProfiles[key];if(!profile)return;
    $("#socialChoices button").attr("aria-pressed","false").filter(function(){return $(this).data("social")===key;}).attr("aria-pressed","true");
    $("#socialPreview").stop(true,true).hide().empty().attr("data-social",key)
      .append($("<i aria-hidden='true' class='social-preview-icon'>").addClass("bi bi-"+profile.icon),$("<span class='social-demo-badge'>").text("PERFIL FICTICIO"),$("<h4>").text(profile.name),$("<strong>").text(profile.handle),$("<p>").text(profile.text),$("<a class='btn primary' target='_blank' rel='noopener noreferrer'>").attr({href:profile.url,"aria-label":"Abrir "+profile.name+", plataforma general, no es un perfil de Atlas Pixel"}).text("Abrir "+profile.name+" ↗"))
      .fadeIn(duration);
  }

  /* 7. CARRUSEL: un temporizador, pausa manual y solo en la vista Inicio. */
  const featured = GAMES.filter(game => game.featured);
  const pause = { manual:media.matches,hover:false,focus:false,modal:false };
  let slideIndex = 0;
  let carouselTimer = null;
  function goTo(index) {
    if (!featured.length) return;
    slideIndex = (index + featured.length) % featured.length;
    const game = featured[slideIndex];
    $("#slides").stop(true,true).css("min-height",$("#slides").height()).fadeOut(duration,function () {
      $(this).html(`<div class="slide scene-transition" data-id="${escape(game.id)}"><img class="hero-art" src="${escape(game.hero)}" alt="" width="1280" height="720"><div class="slide-content"><span class="featured-label">✦ DESTACADO DE ATLAS</span><h3>${escape(game.name)}</h3><p>${escape(game.synopsis)}</p><button class="btn primary detail" type="button">Explorar juego →</button></div></div>`)
        .fadeIn(duration,()=>$(this).css("min-height",""));
    });
    $("#dots button").removeAttr("aria-current").eq(slideIndex).attr("aria-current","true");
  }
  function refreshCarouselTimer() {
    clearInterval(carouselTimer); carouselTimer = null;
    if (activeView === "inicio" && featured.length>1 && !Object.values(pause).some(Boolean) && !document.hidden) carouselTimer = setInterval(()=>goTo(slideIndex+1),6000);
  }
  function setManualPause(value) {
    pause.manual = value;
    $("#pp").attr("aria-label",value?"Reanudar avance automático":"Pausar avance automático").find("i").empty().attr("class",value?"bi bi-play":"bi bi-pause");
    refreshCarouselTimer();
  }

  /* 8. FORMULARIO GUIADO: estado local, validación por paso y revisión como texto. */
  const steps = [
    {id:"fn",short:"Nombre",title:"¿Cómo te llamas?",guide:"Primero, escribe tu nombre. Después pasaremos a tu correo."},
    {id:"fe",short:"Correo",title:"Ahora, tu correo",guide:"Escribe un correo con formato válido, como nombre@ejemplo.com."},
    {id:"fg",short:"Juego",title:"¿Qué videojuego nos recomiendas?",guide:"Indica el título del juego que te gustaría ver en Atlas Pixel."},
    {id:"fp",short:"Plataforma",title:"Elige tu plataforma",guide:"Selecciona dónde te gustaría jugarlo. Si no aparece, elige Otra."},
    {id:"fc",short:"Comentario",title:"¿Quieres contarnos algo más?",guide:"Este bloque es opcional: escribe hasta 500 caracteres o continúa sin comentario."},
    {id:null,short:"Revisión",title:"Revisa tu sugerencia",guide:"Comprueba tus datos. Puedes volver para corregirlos antes de confirmar la demostración."}
  ];
  let step = 0;
  let completed = 0;
  let autoAdvanceTimer = null;
  const fieldPrompts={fn:"Llene su nombre para comenzar.",fe:"Ahora llene su correo electrónico.",fg:"Ahora escriba el nombre del videojuego.",fp:"Ahora seleccione una plataforma.",fc:"Puede escribir un comentario o continuar sin él."};
  function cancelAutoAdvance(){clearTimeout(autoAdvanceTimer);autoAdvanceTimer=null;}
  function fieldFeedback(id,valid){
    const $feedback=$("#fieldFeedback");
    const hasValue=!!fieldValue(id);
    const success=valid&&hasValue;
    $feedback.toggleClass("feedback-valid",success).toggleClass("feedback-error",!valid)
      .find("i").attr("class",success?"bi bi-check-circle-fill":!valid?"bi bi-exclamation-circle":"bi bi-pencil-square");
    const text=success?steps[step].short+" correcto. "+(step<4&&$("#autoAdvance").prop("checked")?"Puede seguir escribiendo; avanzaremos después de una pausa.":"Puede continuar cuando quiera."):
      !valid?"Revise este campo: "+$("#e-"+id).text():fieldPrompts[id];
    $feedback.find("span").text(text);
  }
  function scheduleAutoAdvance(id,delay=2000){
    cancelAutoAdvance();
    if(step>=4||!$("#autoAdvance").prop("checked")||activeView!=="solicitar")return;
    const expectedStep=step,expectedValue=fieldValue(id);
    if(!expectedValue||rules[id](expectedValue))return;
    autoAdvanceTimer=setTimeout(()=>{
      autoAdvanceTimer=null;
      if(activeView==="solicitar"&&step===expectedStep&&fieldValue(id)===expectedValue&&!document.hidden&&$("#autoAdvance").prop("checked")&&$("#modal").prop("hidden"))advanceStep();
    },delay);
  }
  const controlCharacters = /[\u0000-\u001F\u007F]/;
  const rules = {
    fn:value => value.length<2 || value.length>80 || !/[\p{L}]/u.test(value) || !/^[\p{L}\p{M}\p{Zs}.'’\-]+$/u.test(value) ? "Escribe un nombre de 2 a 80 caracteres; usa letras, espacios, apóstrofes, puntos o guiones." : "",
    fe:value => value.length>120 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]{2,}$/.test(value) || !$("#fe")[0].validity.valid ? "Escribe un correo válido, por ejemplo nombre@ejemplo.com." : "",
    fg:value => value.length<2 || value.length>120 || controlCharacters.test(value) ? "Escribe el nombre del juego, entre 2 y 120 caracteres y sin caracteres de control." : "",
    fp:value => !value || !$("#fp option").filter(function(){return this.value===value;}).length ? "Elige una plataforma de la lista." : "",
    fc:value => value.length>500 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value) ? "Escribe hasta 500 caracteres y evita caracteres de control." : ""
  };
  function fieldValue(id) { const value=$("#"+id).val(); return id==="fc" ? value : value.trim(); }
  function validateField(id) {
    const $field=$("#"+id), value=fieldValue(id), error=rules[id](value);
    $field.toggleClass("is-invalid",!!error).toggleClass("is-valid",!error && !!value).attr("aria-invalid",String(!!error));
    const $error=id==="fc"?$field.nextAll(".err").first():$field.next(".err");
    $error.text(error);return !error;
  }
  function renderReview() {
    const $review=$("#review").empty();
    steps.slice(0,5).forEach((item,index)=>{
      const $row=$("<div class='review-row'>");
      $("<span class='review-label'>").text(item.short).appendTo($row);
      // SEGURIDAD: text() evita ejecutar HTML incluso si se pega código en el comentario.
      $("<span class='review-value'>").text(fieldValue(item.id)||"Sin comentario").appendTo($row);
      $("<button type='button' class='link edit-step'>").data("step",index).text("Editar").attr("aria-label","Editar "+item.short.toLowerCase()).appendTo($row);
      $row.appendTo($review);
    });
  }
  function showStep(index,focus=true) {
    cancelAutoAdvance();
    step=Math.max(0,Math.min(index,5));
    $(".wizard-step").prop({hidden:true,disabled:true});
    const $current=$(".wizard-step").eq(step).prop({hidden:false,disabled:false});
    $("#stepNumber").text("PASO "+(step+1)+" DE 6");
    $("#stepTitle").text(steps[step].title); $("#stepGuide").text(steps[step].guide);
    $("#stepProgress").val(step+1).attr("aria-valuetext","Paso "+(step+1)+" de 6: "+steps[step].short);
    $("#stepList").empty().append(steps.map((item,i)=>{
      const $button=$("<button type='button' class='step-dot'>").data("step",i).prop("disabled",i>completed).text((i+1)+". "+item.short);
      if(i===step)$button.attr("aria-current","step");
      if(i<step)$button.addClass("completed");
      return $("<li>").append($button);
    }));
    $("#stepBack").prop("disabled",step===0);
    $("#stepNext").prop("hidden",step===5).text(step===4?"Revisar sugerencia →":"Continuar →");
    $("#send").prop("hidden",step!==5);
    if(step===5)renderReview();
    $("#fieldFeedback").prop("hidden",step===5);
    if(step<5)fieldFeedback(steps[step].id,!fieldValue(steps[step].id)||!rules[steps[step].id](fieldValue(steps[step].id)));
    if(focus){
      if(steps[step].id)$("#"+steps[step].id).trigger("focus");else $("#stepTitle").trigger("focus");
      $current.addClass("guided-highlight").delay(media.matches?0:700).queue(function(next){$(this).removeClass("guided-highlight");next();});
    }
  }
  function advanceStep() {
    if(step>=5)return;
    if(!validateField(steps[step].id)){fieldFeedback(steps[step].id,false);$("#"+steps[step].id).trigger("focus");return;}
    completed=Math.max(completed,step+1); showStep(step+1);
  }
  function requestStep(target) {
    if(target<=step){showStep(target);return;}
    // Revalidar TODOS los pasos intermedios: no se pueden saltar controles editados.
    for(let i=0;i<target;i++){
      if(!validateField(steps[i].id)){showStep(i);$("#"+steps[i].id).trigger("focus");return;}
    }
    completed=Math.max(completed,target);showStep(target);
  }
  function resetWizard() {
    $("#form")[0].reset();completed=0;step=0;
    $("#form input, #form select, #form textarea").removeClass("is-invalid is-valid").removeAttr("aria-invalid");
    $(".err").empty();$("#c-fc").text("0/500");$("#review").empty();showStep(0,false);
  }
  function confirmForm(event) {
    event.preventDefault();if(submitting)return;
    if(step<5){advanceStep();return;}
    // Campo deshabilitado no valida por HTML: las reglas siguen comprobando sus valores.
    const invalid=steps.slice(0,5).findIndex(item=>!validateField(item.id));
    if(invalid!==-1){showStep(invalid);$("#"+steps[invalid].id).trigger("focus");return;}
    submitting=true;$("#send").prop("disabled",true);
    openModal('<div class="success-mark" aria-hidden="true"><i class="bi bi-check2-circle"></i></div><span class="eyebrow">RECORRIDO COMPLETADO</span><h2 id="mTitle">¡Demostración completada!</h2><p>Tu sugerencia pasó todas las validaciones. Esta es una demostración: <strong>no se enviaron ni guardaron tus datos</strong>.</p><p class="edition-note">Puedes cerrar esta confirmación cuando quieras. Para recibir solicitudes reales habría que conectar un servicio de envío.</p><button id="okBtn" type="button" class="btn primary">Entendido</button>',"confirmation");
  }

  /* 9. EVENTOS: delegación para tarjetas, paginación y controles generados. */
  /* EFECTOS DE TARJETA: iluminación, inclinación suave y onda al pulsar.
   * Los botones conservan su acción; pulsar el resto abre los detalles.
   * Con movimiento reducido se conserva el color, sin inclinación ni partículas.
   */
  $("#main").on("pointermove", ".card", function(event) {
    if (media.matches || event.originalEvent?.pointerType === "touch") return;
    const box = this.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    $(this).css({"--pointer-x":(x*100)+"%", "--pointer-y":(y*100)+"%", "--tilt-x":((.5-y)*5)+"deg", "--tilt-y":((x-.5)*7)+"deg"});
  }).on("pointerleave", ".card", function() {
    $(this).css({"--tilt-x":"0deg", "--tilt-y":"0deg"});
  }).on("pointerdown", ".card", function(event) {
    if (media.matches || (event.button !== undefined && event.button !== 0)) return;
    const box = this.getBoundingClientRect();
    const size = Math.max(box.width, box.height)*2;
    const $wave = $("<span class='click-wave' aria-hidden='true'>").css({width:size,height:size,left:event.clientX-box.left-size/2,top:event.clientY-box.top-size/2});
    $(this).append($wave).addClass("card-pressed");
    setTimeout(() => $(this).removeClass("card-pressed"),180);
    setTimeout(() => $wave.remove(),700);
  }).on("click", ".card", function(event) {
    if ($(event.target).closest("button, a").length) return;
    showDetail($(this).data("id"));
  });
  $(document).on("click","a[href^='#']",function(event){
    const id=this.getAttribute("href").slice(1);
    if(!views.includes(id))return;event.preventDefault();navigate(id);
  });
  $(window).on("hashchange",()=>showView(location.hash.slice(1)));
  $("#globalSearch").on("input",function(){state.q=this.value;renderCatalog(true);if(activeView!=="catalogo"){history.pushState(null,"","#catalogo");showView("catalogo",false);}})
    .on("keydown",function(event){if(event.key==="Enter"){event.preventDefault();navigate("catalogo");}});
  $("#plat, #year, #sort").on("change",function(){
    if(this.id==="sort" && !["az","za","new","old"].includes(this.value))return;
    state[this.id]=this.value;renderCatalog(true);
  });
  $("#genres").on("click",".chip",function(){state.genre=$(this).data("genre");renderCatalog(true);});
  $("#activeFilters").on("click",".filter-tag",function(){
    const key=$(this).data("key");if(!["q","genre","plat","year","collection"].includes(key))return;
    state[key]="";if(key==="q")$("#globalSearch").val("");else if(!["genre","collection"].includes(key))$("#"+key).val("");renderCatalog(true);
    $("#count").attr("tabindex","-1").trigger("focus");
  });
  $("#clear, #clear2").on("click",()=>{clearFilters();$("#globalSearch").trigger("focus");});
  $("#filtBtn").on("click",function(){togglePanel($("#filters"),$(this));});
  $("#helpBtn").on("click",function(){
    const $panel=$("#help").stop(true,true),open=$panel.prop("hidden");
    if(open)$panel.prop("hidden",false).hide();
    $panel.fadeToggle(duration,()=>{if(!open)$panel.prop("hidden",true);});$(this).attr("aria-expanded",String(open));
  });
  $("#pagination, #favPagination").on("click",".page-btn",function(){
    if($(this).prop("disabled"))return;
    const page=$(this).data("page");
    if($(this).data("kind")==="catalog"){state.page=page;renderCatalog();}else{state.favPage=page;renderFavorites();}
    $("#"+activeView).find("h2").first().trigger("focus");window.scrollTo({top:0,behavior:"instant"});
  });
  $("#main, #modal").on("click",".detail",function(){showDetail($(this).closest("[data-id]").data("id"));});
  $("#main").on("click",".quick-view",function(){showQuickView($(this).closest("[data-id]").data("id"));});
  $("#collections").on("click",".collection-tile",function(){
    const key=$(this).data("collection");if(!collections[key])return;
    clearFilters();state.collection=key;renderCatalog(true);navigate("catalogo");
  });
  $("#mBody").on("click",".gallery-thumb",function(){changeGallery(Number($(this).data("index")));})
    .on("click",".gallery-prev",()=>changeGallery($("#mBody").data("galleryIndex")-1))
    .on("click",".gallery-next",()=>changeGallery($("#mBody").data("galleryIndex")+1))
    .on("keydown",".game-gallery button",event=>{if(event.key==="ArrowRight"||event.key==="ArrowLeft"){event.preventDefault();changeGallery($("#mBody").data("galleryIndex")+(event.key==="ArrowRight"?1:-1));}});
  $("#main, #modal").on("click",".fav",function(){
    const id=$(this).closest("[data-id]").data("id");if(!byId(id))return;
    const inFavorites=$(this).closest("#favGrid").length>0;
    const inCard=$(this).closest(".card").length>0;
    const added=!favorites.has(id);added?favorites.add(id):favorites.delete(id);
    persist(KEYS.favorites,JSON.stringify([...favorites]));syncFavorites(id);
    if (added && !media.matches) {
      const $buttons = $(".card").filter(function(){return $(this).data("id")===id;}).find(".fav").addClass("favorite-celebrate");
      setTimeout(()=>$buttons.removeClass("favorite-celebrate"),650);
    }
    if(inFavorites){const $next=$("#favGrid .fav").first();($next.length?$next:$("#favEmpty a")).trigger("focus");}
    else if(inCard)$("#"+activeView+" .card").filter(function(){return $(this).data("id")===id;}).find(".fav").trigger("focus");
    notify((added?"Guardado en favoritos: ":"Quitado de favoritos: ")+byId(id).name);
  });
  $("#themeBtn").on("click",()=>setTheme($("html").attr("data-theme")==="light"?"dark":"light"));
  $("#menuBtn").on("click",function(){
    const $nav=$("#nav").stop(true,true);$nav.slideToggle(duration);const open=$(this).attr("aria-expanded")!=="true";
    $(this).attr({"aria-expanded":String(open),"aria-label":open?"Cerrar menú":"Abrir menú"});
  });
  let mobile=window.matchMedia("(max-width: 680px)").matches;
  $(window).on("resize",()=>{const next=window.matchMedia("(max-width: 680px)").matches;if(next===mobile)return;mobile=next;$("#nav").stop(true,true).removeAttr("style");$("#menuBtn").attr({"aria-expanded":"false","aria-label":"Abrir menú"});});
  $("#mClose, #modal .backdrop").on("click",closeModal);
  $("#mBody").on("click","#okBtn",()=>{resetWizard();closeModal();});
  $(document).on("keydown",event=>{
    if(!$("#modal").prop("hidden")){
      if(event.key==="Escape"){event.preventDefault();closeModal();}
      if(event.key==="Tab"){
        const $focus=$(".dlg").find("button, a[href], input, select, textarea").not(":disabled").filter(":visible");
        const first=$focus.first()[0],last=$focus.last()[0];if(!first)return;
        if(event.shiftKey&&(document.activeElement===first||document.activeElement===$(".dlg")[0])){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    }else if(event.key==="/"&&!$(event.target).is("input, select, textarea")){event.preventDefault();$("#globalSearch").trigger("focus");}
  });
  $("#prev").on("click",()=>{goTo(slideIndex-1);refreshCarouselTimer();});
  $("#next").on("click",()=>{goTo(slideIndex+1);refreshCarouselTimer();});
  $("#pp").on("click",()=>setManualPause(!pause.manual));
  $("#dots").on("click","button",function(){goTo($(this).data("index"));refreshCarouselTimer();});
  $("#carousel").on("mouseenter",()=>{pause.hover=true;refreshCarouselTimer();}).on("mouseleave",()=>{pause.hover=false;refreshCarouselTimer();})
    .on("focusin",()=>{pause.focus=true;refreshCarouselTimer();}).on("focusout",event=>{pause.focus=!!event.relatedTarget&&$("#carousel")[0].contains(event.relatedTarget);refreshCarouselTimer();});
  $(document).on("visibilitychange",refreshCarouselTimer);
  media.addEventListener("change",event=>{duration=event.matches?0:180;if(event.matches)setManualPause(true);});
  $("#stepNext").on("click",advanceStep);$("#stepBack").on("click",()=>showStep(step-1));
  $("#socialChoices").on("click","button",function(){showSocial($(this).data("social"));});
  $("#hoursBtn").on("click",function(){togglePanel($("#companyHours"),$(this));});
  $("#autoAdvance").on("change",function(){cancelAutoAdvance();if(step<5){fieldFeedback(steps[step].id,!fieldValue(steps[step].id)||!rules[steps[step].id](fieldValue(steps[step].id)));if(this.checked)scheduleAutoAdvance(steps[step].id);}});
  $("#stepList, #review").on("click","button",function(){requestStep(Number($(this).data("step")));});
  $("#form").on("input change","input, select, textarea",function(event){
    if(!rules[this.id])return;
    cancelAutoAdvance();
    if(this.id==="fc")$("#c-fc").text(this.value.length+"/500");
    const valid=validateField(this.id);fieldFeedback(this.id,valid);
    completed=Math.min(completed,step); // Una edición invalida el avance previamente aprobado.
    $("#stepList button").each(function(){ $(this).prop("disabled",Number($(this).data("step"))>completed); });
    if(valid&&!eventIsComposing(event))scheduleAutoAdvance(this.id,this.tagName==="SELECT"?700:2000);
  }).on("focusout","input, select, textarea",function(){if(rules[this.id]&&step<5&&steps[step].id===this.id)fieldFeedback(this.id,validateField(this.id));})
    .on("compositionstart","input, textarea",cancelAutoAdvance)
    .on("compositionend","input, textarea",function(){if(rules[this.id]){fieldFeedback(this.id,validateField(this.id));scheduleAutoAdvance(this.id);}})
    .on("keydown","input, select",event=>{if(event.key==="Enter"&&event.target.id!=="autoAdvance"){event.preventDefault();advanceStep();}})
    .on("submit",confirmForm);
  function eventIsComposing(event){return !!event?.originalEvent?.isComposing;}
  // error no burbujea: captura cubre también las imágenes creadas después de cargar.
  document.addEventListener("error",event=>{
    if(event.target.matches?.(".cover img"))$(event.target).hide().next(".image-fallback").prop("hidden",false).show();
    else if(event.target.matches?.(".gallery-main")){$(event.target).hide();$(".gallery-error").prop("hidden",false);}
    else if(event.target.matches?.(".hero-art, .detail-extra, .detail-banner img"))$(event.target).hide();
  },true);

  /* 10. ARRANQUE: construir una vez y registrar eventos una sola vez. */
  loadPreferences();buildFilters();buildCollections();showSocial("instagram");renderCatalog();renderFavorites();
  $("#homeGrid").empty().append(GAMES.slice(0,4).map(card).join(""));
  $("#dots").empty().append(featured.map((game,index)=>$("<button type='button'>").data("index",index).attr("aria-label","Destacado "+(index+1)+": "+game.name)));
  goTo(0);setManualPause(media.matches);showStep(0,false);
  const initial=location.hash.slice(1);
  if(!views.includes(initial))history.replaceState(null,"","#inicio");
  showView(views.includes(initial)?initial:"inicio",false);
});
