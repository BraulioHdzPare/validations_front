import { requireAuth, clearSession, isAdmin, getRefreshToken } from './auth.js';
import { apiClient } from './api-client.js';
import { startInactivityWatch } from './session-timeout.js';

// Páginas a las que solo puede acceder el administrador.
// Si un locatario intenta acceder directamente por URL, se le redirige al dashboard.
const ADMIN_ONLY_PAGES = ['reports.html', 'users.html', 'tenants.html', 'discounts.html'];

const user = requireAuth();

if (user) {
  applyNavbarUser(user);
  applyRoleRestrictions(user);
  applyRouteGuard(user);
  bindLogout();
  startInactivityWatch();
}

// Muestra el nombre real del usuario en el botón del navbar superior.
function applyNavbarUser(user) {
  const navbarToggle = document.querySelector('.app-navbar .dropdown-toggle');

  if (!navbarToggle) {
    return;
  }

  navbarToggle.innerHTML = `<i class="bi bi-person-circle me-1"></i>${user.displayName}`;
}

// Oculta en el sidebar los enlaces marcados como [data-admin-only]
// cuando el usuario no es administrador.
function applyRoleRestrictions(user) {
  if (isAdmin(user)) {
    return;
  }

  document.querySelectorAll('[data-admin-only]').forEach((el) => {
    el.style.display = 'none';
  });
}

// Redirige al dashboard si un locatario intenta acceder a una página de administración.
function applyRouteGuard(user) {
  if (isAdmin(user)) {
    return;
  }

  const currentPage = window.location.pathname.split('/').pop() || '';

  if (ADMIN_ONLY_PAGES.includes(currentPage)) {
    window.location.replace('dashboard.html');
  }
}

// Captura los clics en los enlaces de cierre de sesión [data-action="logout"],
// limpia el storage y redirige al login.
function bindLogout() {
  document.querySelectorAll('[data-action="logout"]').forEach((el) => {
    el.addEventListener('click', async (event) => {
      event.preventDefault();
      const refresh = getRefreshToken();
      // Intentamos invalidar el token en el servidor; si falla, continuamos igual
      if (refresh) {
        try {
          await apiClient.post('/api/auth/logout/', { refresh });
        } catch {
          // silencioso — el token quedará activo hasta expirar (30 min)
        }
      }
      clearSession();
      window.location.href = 'login.html';
    });
  });
}