import { record } from "../utilidades.js";

/* Instalación y conexión. Los eventos se retiran con la señal de vida de la interfaz. */
export function startPWA(signal, notify, showInstallHelp) {
  const red = document.querySelector("#connectionStatus");
  const offline = document.querySelector("#offlineStatus");
  const instalar = document.querySelector("#installBtn");
  const actualizar = document.querySelector("#updateBtn");
  const aviso = document.querySelector("#avisoInstalar");
  const instalado = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  let invitacion, registro, avisoTimer, recargar = false;
  function ocultarAviso() {
    clearTimeout(avisoTimer);
    aviso.hidden = true;
  }
  if (instalado()) instalar.hidden = true;
  else {
    aviso.hidden = false;
    avisoTimer = setTimeout(ocultarAviso, 5000);
  }
  /* El aviso dura cinco segundos. prompt() se ejecuta dentro del gesto del usuario. */
  async function solicitarInstalacion() {
    ocultarAviso();
    if (!invitacion) return showInstallHelp();
    const evento = invitacion;
    invitacion = null;
    try {
      await evento.prompt();
      instalar.hidden = (await evento.userChoice).outcome === "accepted";
    } catch { showInstallHelp(); }
  }
  window.addEventListener("beforeinstallprompt", evento => {
    evento.preventDefault();
    invitacion = evento;
    instalar.hidden = false;
  }, { signal });
  window.addEventListener("appinstalled", () => {
    instalar.hidden = true;
    invitacion = null;
    ocultarAviso();
    record("pwa", "Aplicación instalada.");
    notify("Atlas Pixel se instaló.");
  }, { signal });
  instalar.addEventListener("click", solicitarInstalacion, { signal });
  document.querySelector("#accionInstalar").addEventListener("click", solicitarInstalacion, { signal });
  document.querySelector("#cerrarAvisoInstalar").addEventListener("click", ocultarAviso, { signal });
  function mostrarRed() {
    red.textContent = navigator.onLine ? "Con conexión" : "Sin conexión";
    red.classList.toggle("is-offline", !navigator.onLine);
    record("connection", red.textContent);
    if (!navigator.onLine) notify("Sin conexión. Puedes usar los recursos guardados.");
  }
  window.addEventListener("online", mostrarRed, { signal });
  window.addEventListener("offline", mostrarRed, { signal });
  mostrarRed();
  signal.addEventListener("abort", () => {
    ocultarAviso();

  }, { once: true });

  /* Proxy offline para los archivos del sitio. El arte remoto requiere conexión. */
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    offline.textContent = "Offline disponible desde HTTPS o localhost.";
    return;
  }
  const worker = navigator.serviceWorker;
  function consultar() {
    worker.controller?.postMessage({ type: "STATUS" });


  }
  worker.addEventListener("message", ({data}) => {
    if (data?.type === "OFFLINE_READY") {
      offline.textContent = "Catálogo offline · imágenes con Internet";
    }
  }, { signal });
  // Al actualizar una PWA controlada, recarga una vez para aplicar los nuevos módulos.
  let teniaControlador = Boolean(worker.controller);
  let recargaSolicitada = false;
  worker.addEventListener("controllerchange", () => {
    if (!worker.controller) return;
    consultar();
    if ((teniaControlador || recargar) && !recargaSolicitada) {
      recargaSolicitada = true;
      location.reload();
    }
    teniaControlador = true;
  }, { signal });
  function ofrecerActualizacion() { actualizar.hidden = !registro?.waiting; }
  async function registrar() {
    try {
      registro = await worker.register("./sw.js", { updateViaCache: "none" });
      if (signal.aborted) return;
      ofrecerActualizacion();
      registro.addEventListener("updatefound", () => {
        registro.installing?.addEventListener("statechange", ofrecerActualizacion, { signal });
      }, { signal });
      consultar();
    } catch { offline.textContent = "No se pudo preparar el modo offline."; }
  }
  if (document.readyState === "complete") registrar();
  else window.addEventListener("load", registrar, { once: true, signal });
  actualizar.addEventListener("click", () => {
    if (document.querySelector("#solicitar:not([hidden]), #modal:not([hidden])")) {
      return notify("Cierra la ficha o termina el formulario antes de actualizar.");
    }
    if (!registro?.waiting) return;
    recargar = true;
    actualizar.disabled = true;
    registro.waiting.postMessage({ type: "SKIP_WAITING" });
  }, { signal });
}
