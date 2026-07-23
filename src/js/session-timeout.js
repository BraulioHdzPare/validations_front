/** Cierre de sesión por inactividad.
 *
 * Mientras el usuario INTERACTÚA (mouse, teclado, scroll, toque), la sesión
 * sigue viva: `api-client.js` refresca el access token de forma transparente.
 * El único motivo de expulsión mientras la sesión es válida es la inactividad:
 * si pasan `IDLE_LIMIT_MS` sin interacción, se cierra la sesión y se vuelve al
 * login con un aviso.
 *
 * Nota: el temporizador es por pestaña (en memoria). Con la sesión en
 * sessionStorage cada pestaña es independiente; con "recordar sesión"
 * (localStorage) el storage se comparte, pero el conteo de inactividad no.
 */
import { clearSession } from './auth.js';

const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 min sin interacción → expulsar
const CHECK_INTERVAL_MS = 30 * 1000; // revisa cada 30 s
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

let lastActivity = Date.now();

function markActivity() {
  lastActivity = Date.now();
}

function expireForInactivity() {
  clearSession();
  // El query param permite que login.js muestre el motivo del cierre.
  window.location.replace('login.html?reason=inactivity');
}

/** Inicia el vigilante de inactividad. Llamar en cada página autenticada. */
export function startInactivityWatch() {
  ACTIVITY_EVENTS.forEach((evt) => {
    window.addEventListener(evt, markActivity, { passive: true });
  });

  window.setInterval(() => {
    if (Date.now() - lastActivity >= IDLE_LIMIT_MS) {
      expireForInactivity();
    }
  }, CHECK_INTERVAL_MS);
}
