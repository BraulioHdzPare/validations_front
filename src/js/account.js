/** Menú de cuenta del navbar: "Mi perfil" (RF-04) y "Cambiar contraseña" (RF-05).
 *
 * Los modales se **inyectan por JS** en lugar de duplicar su marcado en las seis
 * páginas autenticadas: `navbar.js` ya corre en todas, así que este módulo es el
 * único lugar donde viven el HTML y la lógica de ambos.
 *
 * Los valores del perfil se pintan con `textContent` (no `innerHTML`), así que
 * no requieren escapado.
 */
import { apiClient } from './api-client.js';

const MODALS_HTML = `
<div class="modal fade" id="accountProfileModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title h5">Mi perfil</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <div class="modal-body">
        <div id="accountProfileAlert" class="alert d-none" role="alert"></div>

        <div class="row g-3">
          <div class="col-12 col-md-6">
            <small class="text-muted d-block">Usuario</small>
            <strong id="profileUsername">—</strong>
          </div>
          <div class="col-12 col-md-6">
            <small class="text-muted d-block">Nombre</small>
            <strong id="profileFullName">—</strong>
          </div>
          <div class="col-12 col-md-6">
            <small class="text-muted d-block">Correo</small>
            <strong id="profileEmail">—</strong>
          </div>
          <div class="col-12 col-md-6">
            <small class="text-muted d-block">Rol</small>
            <strong id="profileRole">—</strong>
          </div>
          <div class="col-12 col-md-6">
            <small class="text-muted d-block">Locatario</small>
            <strong id="profileTenant">—</strong>
          </div>
          <div class="col-12 col-md-6">
            <small class="text-muted d-block">Unidad</small>
            <strong id="profileParkingSite">—</strong>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="accountPasswordModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <form id="accountPasswordForm" class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title h5">Cambiar contraseña</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>

      <div class="modal-body">
        <div id="accountPasswordAlert" class="alert d-none" role="alert"></div>

        <div class="row g-3">
          <div class="col-12">
            <label for="currentPassword" class="form-label">Contraseña actual</label>
            <input type="password" id="currentPassword" class="form-control" autocomplete="current-password" required>
          </div>
          <div class="col-12">
            <label for="newPassword" class="form-label">Nueva contraseña</label>
            <input type="password" id="newPassword" class="form-control" autocomplete="new-password" minlength="8" required>
            <div class="form-text">Mínimo 8 caracteres.</div>
          </div>
          <div class="col-12">
            <label for="confirmNewPassword" class="form-label">Confirmar nueva contraseña</label>
            <input type="password" id="confirmNewPassword" class="form-control" autocomplete="new-password" required>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="submit" class="btn btn-primary" id="accountPasswordSubmit">Guardar</button>
      </div>
    </form>
  </div>
</div>
`;

/** Punto de entrada: inyecta los modales y liga los enlaces del dropdown. */
export function initAccountMenu() {
  const profileLinks = document.querySelectorAll('[data-action="profile"]');
  const passwordLinks = document.querySelectorAll('[data-action="change-password"]');

  // Si la página no tiene el menú de cuenta, no inyectamos nada.
  if (profileLinks.length === 0 && passwordLinks.length === 0) {
    return;
  }

  document.body.insertAdjacentHTML('beforeend', MODALS_HTML);

  profileLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openProfileModal();
    });
  });

  passwordLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openPasswordModal();
    });
  });

  bindPasswordForm();
}

// ---------------------------------------------------------------------------
// Mi perfil (GET /api/auth/me/)
// ---------------------------------------------------------------------------

async function openProfileModal() {
  resetProfileFields();
  hideAlert('accountProfileAlert');
  modal('accountProfileModal').show();

  try {
    // Datos frescos del backend, no la copia cacheada del login.
    const me = await apiClient.get('/api/auth/me/');
    if (!me) {
      return; // sesión terminada: apiClient ya redirigió al login
    }

    const fullName = `${me.first_name ?? ''} ${me.last_name ?? ''}`.trim();

    setText('profileUsername', me.username);
    setText('profileFullName', fullName || '—');
    setText('profileEmail', me.email || '—');
    setText('profileRole', me.role_display || me.role);
    setText('profileTenant', me.tenant_name || 'Sin locatario');
    setText('profileParkingSite', me.parking_site_name || 'Sin unidad');
  } catch (error) {
    showAlert('accountProfileAlert', 'danger', error.message);
  }
}

function resetProfileFields() {
  [
    'profileUsername',
    'profileFullName',
    'profileEmail',
    'profileRole',
    'profileTenant',
    'profileParkingSite',
  ].forEach((id) => setText(id, '…'));
}

// ---------------------------------------------------------------------------
// Cambiar contraseña (POST /api/auth/change-password/)
// ---------------------------------------------------------------------------

function openPasswordModal() {
  const form = document.getElementById('accountPasswordForm');
  form?.reset();
  hideAlert('accountPasswordAlert');
  modal('accountPasswordModal').show();
}

function bindPasswordForm() {
  const form = document.getElementById('accountPasswordForm');
  const submitButton = document.getElementById('accountPasswordSubmit');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    // El backend valida lo mismo; esto evita un viaje de ida y vuelta.
    if (newPassword !== confirmPassword) {
      showAlert('accountPasswordAlert', 'danger', 'Las contraseñas no coinciden.');
      return;
    }

    submitButton.disabled = true;

    try {
      const result = await apiClient.post('/api/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      if (!result) {
        return; // sesión terminada
      }

      form.reset();
      showAlert(
        'accountPasswordAlert',
        'success',
        result.detail ?? 'Contraseña actualizada correctamente.',
      );
    } catch (error) {
      showAlert('accountPasswordAlert', 'danger', error.message);
    } finally {
      submitButton.disabled = false;
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function modal(id) {
  return window.bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function showAlert(id, type, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'alert d-none';
  el.textContent = '';
}
