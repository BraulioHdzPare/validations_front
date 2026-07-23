const SESSION_KEY = 'portalUser';
const ACCESS_TOKEN_KEY = 'portalAccessToken';
const REFRESH_TOKEN_KEY = 'portalRefreshToken';

// ---------------------------------------------------------------------------
// Lectura de sesión
// ---------------------------------------------------------------------------

/** Recupera el perfil del usuario desde sessionStorage o localStorage. */
export function getSession() {
  try {
    const data = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/** Devuelve el access token JWT actual. */
export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || null;
}

/** Devuelve el refresh token JWT actual. */
export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY) || null;
}

// ---------------------------------------------------------------------------
// Escritura de sesión
// ---------------------------------------------------------------------------

/**
 * Guarda la sesión completa tras un login exitoso.
 * @param {object} tokens   - { access, refresh } del backend
 * @param {object} user     - perfil del usuario del backend
 * @param {boolean} remember - si true, persiste en localStorage (recordar sesión)
 */
export function saveSession(tokens, user, remember = false) {
  const storage = remember ? localStorage : sessionStorage;

  storage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);

  storage.setItem(SESSION_KEY, JSON.stringify({
    username: user.username,
    displayName: user.first_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.username,
    role: user.role,
    tenantId: user.tenant_id,
    tenantName: user.tenant_name,
    parkingSiteId: user.parking_site_id,
    loggedAt: new Date().toISOString(),
  }));
}

/** Devuelve el storage donde vive la sesión actual (localStorage si se marcó
 * "recordar", si no sessionStorage). Null si no hay sesión. */
function activeStorage() {
  if (localStorage.getItem(SESSION_KEY)) return localStorage;
  if (sessionStorage.getItem(SESSION_KEY)) return sessionStorage;
  return null;
}

/**
 * Reemplaza los tokens tras un refresh (rotación), en el mismo storage donde
 * ya vive la sesión. No toca el perfil. Con ROTATE_REFRESH_TOKENS el backend
 * devuelve también un refresh nuevo; hay que persistirlo o el siguiente refresh
 * usaría el anterior (ya en blacklist) y fallaría.
 */
export function updateTokens(tokens) {
  const storage = activeStorage();
  if (!storage) return;

  storage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  if (tokens.refresh) {
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
}

// ---------------------------------------------------------------------------
// Limpieza
// ---------------------------------------------------------------------------

/** Elimina la sesión y los tokens de ambos storages. */
export function clearSession() {
  [sessionStorage, localStorage].forEach((storage) => {
    storage.removeItem(SESSION_KEY);
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  });
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Verifica que haya sesión activa.
 * Si no la hay, redirige a login y retorna null.
 * return {object|null} El perfil del usuario o null si no hay sesión.
 */
export function requireAuth() {
  const user = getSession();

  if (!user) {
    window.location.replace('login.html');
    return null;
  }

  return user;
}

/** Indica si el usuario tiene rol de administrador. */
export function isAdmin(user) {
  return user?.role === 'admin';
}
