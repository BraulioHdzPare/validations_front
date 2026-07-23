import { getAccessToken, getRefreshToken, updateTokens, clearSession } from './auth.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
const REFRESH_PATH = '/api/auth/token/refresh/';

// Un solo refresh en vuelo: si varias peticiones reciben 401 a la vez, comparten
// el mismo refresh en lugar de dispararlo N veces (con rotación, el segundo
// fallaría porque el refresh token ya habría quedado en blacklist).
let refreshInFlight = null;

/** Refresca el access token con el refresh token (rotación). Devuelve true/false. */
async function refreshAccessToken() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refresh = getRefreshToken();
  if (!refresh) {
    return false;
  }

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE_URL}${REFRESH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      updateTokens({ access: data.access, refresh: data.refresh });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function endSession() {
  clearSession();
  window.location.replace('login.html');
}

/**
 * Realiza una petición HTTP autenticada al backend.
 * - Agrega el header Authorization: Bearer <token>.
 * - Ante 401 (access token expirado), intenta refrescar UNA vez y reintenta la
 *   misma petición; si el refresh también falla (refresh token expirado o
 *   invalidado), cierra la sesión y redirige al login.
 * - La expulsión por INACTIVIDAD la maneja `session-timeout.js`, no esto.
 * - Si la respuesta no es OK lanza un error con el mensaje del servidor.
 */
async function request(method, path, body = null, retried = false) {
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (response.status === 401) {
    // Ya reintentamos, o el que falló fue el propio refresh: no hay a dónde recurrir.
    if (retried || path === REFRESH_PATH) {
      endSession();
      return;
    }
    // Access token expirado → refrescar y reintentar la misma petición una vez.
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(method, path, body, true);
    }
    endSession();
    return;
  }

  // Sin contenido (ej. logout 204)
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    // El backend puede devolver { detail: "..." } o { field: ["error"] }
    const message = extractErrorMessage(data);
    throw new Error(message);
  }

  return data;
}

function extractErrorMessage(data) {
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.non_field_errors) return data.non_field_errors[0];

  // Primer mensaje de cualquier campo con error
  const firstField = Object.values(data)[0];
  if (Array.isArray(firstField)) return firstField[0];

  return 'Ocurrió un error inesperado.';
}

export const apiClient = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};