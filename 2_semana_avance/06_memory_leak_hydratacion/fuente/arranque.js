import {mount} from './funciones.js';
/* SIMULACIÓN AUTORIZADA: no es hidratación SSR. Activa y libera el código original. */
let dispose=null,busy=false;
const button=document.querySelector('#hydrateBtn'),release=document.querySelector('#releaseBtn'),status=document.querySelector('#hydrationState');
const setStatic=value=>document.querySelectorAll('header,main,aside,footer').forEach(e=>e.inert=value);
button.addEventListener('click',async()=>{if(busy||dispose)return;busy=true;button.disabled=true;status.textContent='Activando funciones originales…';setStatic(false);try{dispose=await mount();if(!dispose)throw Error('No se completó el montaje');release.disabled=false;status.textContent='Interacción activa';}catch{setStatic(true);button.disabled=false;status.textContent='No se pudo activar. Revisa la consola y los recursos.';}finally{busy=false;}});
release.addEventListener('click',()=>{dispose?.();dispose=null;setStatic(true);release.disabled=true;button.disabled=false;status.textContent='Vista estática · recursos liberados';});
window.addEventListener('pagehide',()=>dispose?.(),{once:true});
