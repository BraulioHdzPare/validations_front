const SESSION_KEY = 'portalUser';

// Recupera la sesión activa desde sessionStorage o localStorage.
export function getSession() {
  try {
    const data = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Elimina la sesión de ambos storages (cubre el caso "recordar sesión").
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

// Verifica que haya una sesión activa.
// Si no la hay, redirige a login y retorna null.
export function requireAuth() {
  const user = getSession();

  if (!user) {
    window.location.replace('login.html');
    return null;
  }

  return user;
}

// Indica si el usuario tiene rol de administrador.
export function isAdmin(user) {
  return user?.role === 'admin';
}
