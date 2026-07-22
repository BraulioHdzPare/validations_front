import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  setUserPassword,
} from './users-api.js';
import { listTenants, listParkingSites } from './lookups-api.js';
import { escapeHtml } from './html.js';

// Estado en memoria, cargado desde el backend
let allUsers = [];
let tenants = []; // [{ id, name }]
let parkingSites = []; // [{ id, name }]
let tenantNameById = new Map();
let parkingSiteNameById = new Map();
let currentResults = [];

// Elementos del DOM
const totalUsers = document.getElementById('totalUsers');
const activeUsers = document.getElementById('activeUsers');
const adminUsers = document.getElementById('adminUsers');
const tenantUsers = document.getElementById('tenantUsers');

const usersFilterForm = document.getElementById('usersFilterForm');
const clearUserFiltersButton = document.getElementById('clearUserFiltersButton');
const openCreateUserModalButton = document.getElementById('openCreateUserModalButton');
const usersTableBody = document.getElementById('usersTableBody');

const userSearch = document.getElementById('userSearch');
const roleFilter = document.getElementById('roleFilter');
const tenantFilter = document.getElementById('tenantFilter');
const statusFilter = document.getElementById('statusFilter');

const usersAlert = document.getElementById('usersAlert');
const usersResultCountBadge = document.getElementById('usersResultCountBadge');

const userForm = document.getElementById('userForm');
const userFormModalLabel = document.getElementById('userFormModalLabel');
const userId = document.getElementById('userId');
const formUsername = document.getElementById('formUsername');
const formFirstName = document.getElementById('formFirstName');
const formLastName = document.getElementById('formLastName');
const formEmail = document.getElementById('formEmail');
const formRole = document.getElementById('formRole');
const formTenant = document.getElementById('formTenant');
const formParkingSite = document.getElementById('formParkingSite');
const formStatus = document.getElementById('formStatus');
const formPassword = document.getElementById('formPassword');
const passwordHelp = document.getElementById('passwordHelp');

const detailUsername = document.getElementById('detailUsername');
const detailFullName = document.getElementById('detailFullName');
const detailEmail = document.getElementById('detailEmail');
const detailRole = document.getElementById('detailRole');
const detailStatus = document.getElementById('detailStatus');
const detailTenant = document.getElementById('detailTenant');
const detailParkingSite = document.getElementById('detailParkingSite');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

async function initialize() {
  try {
    [tenants, parkingSites] = await Promise.all([listTenants(), listParkingSites()]);
    tenantNameById = new Map(tenants.map((t) => [t.id, t.name]));
    parkingSiteNameById = new Map(parkingSites.map((p) => [p.id, p.name]));

    loadFilterOptions();
    loadFormOptions();

    allUsers = await listUsers();
    currentResults = [...allUsers];
    renderUsers(currentResults);
  } catch (error) {
    showAlert('danger', `No se pudieron cargar los usuarios: ${error.message}`);
  }
}

// Filtros
usersFilterForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  currentResults = filterUsers();
  renderUsers(currentResults);

  if (currentResults.length === 0) {
    showAlert('warning', 'No se encontraron usuarios con los filtros seleccionados.');
  } else {
    hideAlert();
  }
});

clearUserFiltersButton?.addEventListener('click', () => {
  usersFilterForm.reset();
  currentResults = [...allUsers];
  renderUsers(currentResults);
  hideAlert();
});

openCreateUserModalButton?.addEventListener('click', () => {
  openUserFormModal();
});

// Acciones en la tabla
usersTableBody?.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const id = Number(actionButton.dataset.id);
  const user = allUsers.find((item) => item.id === id);

  if (!user) {
    showAlert('danger', 'No se encontró el usuario seleccionado.');
    return;
  }

  if (action === 'view-detail') {
    showUserDetail(user);
  }

  if (action === 'edit-user') {
    openUserFormModal(user);
  }

  if (action === 'toggle-status') {
    toggleUserStatus(user);
  }

  if (action === 'reset-password') {
    resetUserPassword(user);
  }
});

// Ocultar/limpiar los campos que solo aplican a locatarios cuando el rol es admin
formRole?.addEventListener('change', () => {
  applyRoleFieldRules();
});

// Alta / edición
userForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const isEditing = Boolean(userId.value);
  const password = formPassword.value.trim();

  if (formRole.value === 'tenant_user' && !formTenant.value) {
    showAlert('danger', 'Los usuarios locatarios deben tener un locatario asignado.');
    return;
  }

  if (formRole.value === 'tenant_user' && !formParkingSite.value) {
    showAlert('danger', 'Los usuarios locatarios deben tener una unidad asignada para poder validar boletos.');
    return;
  }

  if (!isEditing && !password) {
    showAlert('danger', 'La contraseña es obligatoria al crear un usuario.');
    return;
  }

  const uiUser = {
    username: formUsername.value.trim(),
    firstName: formFirstName.value.trim(),
    lastName: formLastName.value.trim(),
    email: formEmail.value.trim(),
    role: formRole.value,
    tenantId: formRole.value === 'admin' ? null : Number(formTenant.value) || null,
    parkingSiteId: formRole.value === 'admin' ? null : Number(formParkingSite.value) || null,
    status: formStatus.value,
    password,
  };

  try {
    if (isEditing) {
      await updateUser(Number(userId.value), uiUser);
    } else {
      await createUser(uiUser);
    }

    allUsers = await listUsers();
    currentResults = filterUsers();
    renderUsers(currentResults);

    showAlert('success', isEditing ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');

    window.bootstrap.Modal.getOrCreateInstance(document.getElementById('userFormModal')).hide();
  } catch (error) {
    showAlert('danger', error.message);
  }
});

// Poblar selectores
function loadFilterOptions() {
  renderSelectOptions(tenantFilter, tenants, { keepFirst: true });
}

function loadFormOptions() {
  renderSelectOptions(formTenant, tenants, { keepFirst: true });
  renderSelectOptions(formParkingSite, parkingSites, { keepFirst: true });
}

function renderSelectOptions(selectElement, items, { keepFirst = false } = {}) {
  if (!selectElement) {
    return;
  }

  // Conserva la primera opción (placeholder "Todos"/"Sin ...") si se pide.
  const placeholder = keepFirst ? selectElement.querySelector('option') : null;
  selectElement.innerHTML = '';
  if (placeholder) {
    selectElement.appendChild(placeholder);
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = String(item.id);
    option.textContent = item.name;
    fragment.appendChild(option);
  });
  selectElement.appendChild(fragment);
}

function filterUsers() {
  const search = userSearch.value.trim().toLowerCase();
  const role = roleFilter.value;
  const tenantIdValue = tenantFilter.value;
  const status = statusFilter.value;

  return allUsers.filter((user) => {
    const matchesSearch =
      !search ||
      user.username.toLowerCase().includes(search) ||
      user.fullName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);

    const matchesRole = !role || user.role === role;
    const matchesTenant = !tenantIdValue || user.tenantId === Number(tenantIdValue);
    const matchesStatus = !status || user.status === status;

    return matchesSearch && matchesRole && matchesTenant && matchesStatus;
  });
}

function renderUsers(users) {
  updateSummary();
  updateResultCount(users.length);

  if (users.length === 0) {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          No hay usuarios para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  usersTableBody.innerHTML = users.map((user) => `
    <tr>
      <td><strong>${escapeHtml(user.username)}</strong></td>
      <td>${escapeHtml(user.fullName)}</td>
      <td>${escapeHtml(user.email) || '<span class="text-muted">—</span>'}</td>
      <td>${renderRoleBadge(user)}</td>
      <td>${tenantLabel(user)}</td>
      <td>${renderStatusBadge(user)}</td>
      <td class="text-end">
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            data-action="view-detail"
            data-id="${user.id}"
            title="Ver detalle"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            data-action="edit-user"
            data-id="${user.id}"
            title="Editar"
          >
            <i class="bi bi-pencil"></i>
          </button>

          <button
            type="button"
            class="btn btn-outline-warning btn-sm"
            data-action="reset-password"
            data-id="${user.id}"
            title="Resetear contraseña"
          >
            <i class="bi bi-key"></i>
          </button>

          <button
            type="button"
            class="btn ${user.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'} btn-sm"
            data-action="toggle-status"
            data-id="${user.id}"
            title="${user.status === 'active' ? 'Desactivar' : 'Activar'}"
          >
            <i class="bi ${user.status === 'active' ? 'bi-person-x' : 'bi-person-check'}"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateSummary() {
  totalUsers.textContent = String(allUsers.length);
  activeUsers.textContent = String(allUsers.filter((user) => user.status === 'active').length);
  adminUsers.textContent = String(allUsers.filter((user) => user.role === 'admin').length);
  tenantUsers.textContent = String(allUsers.filter((user) => user.role === 'tenant_user').length);
}

function updateResultCount(count) {
  usersResultCountBadge.textContent = `${count} usuario${count === 1 ? '' : 's'}`;
}

function renderRoleBadge(user) {
  if (user.role === 'admin') {
    return `<span class="badge text-bg-primary">${user.roleText}</span>`;
  }

  return `<span class="badge text-bg-info">${user.roleText}</span>`;
}

function renderStatusBadge(user) {
  if (user.status === 'active') {
    return `<span class="badge text-bg-success">${user.statusText}</span>`;
  }

  return `<span class="badge text-bg-secondary">${user.statusText}</span>`;
}

function tenantLabel(user) {
  if (user.tenantId && tenantNameById.has(user.tenantId)) {
    return escapeHtml(tenantNameById.get(user.tenantId));
  }
  return '<span class="text-muted">Sin locatario</span>';
}

function parkingSiteLabel(user) {
  if (user.parkingSiteId && parkingSiteNameById.has(user.parkingSiteId)) {
    return parkingSiteNameById.get(user.parkingSiteId);
  }
  return 'Sin unidad';
}

function openUserFormModal(user = null) {
  userForm.reset();
  userId.value = '';

  if (user) {
    userFormModalLabel.textContent = 'Editar usuario';
    userId.value = user.id;
    formUsername.value = user.username;
    formFirstName.value = user.firstName;
    formLastName.value = user.lastName;
    formEmail.value = user.email;
    formRole.value = user.role;
    formTenant.value = user.tenantId ? String(user.tenantId) : '';
    formParkingSite.value = user.parkingSiteId ? String(user.parkingSiteId) : '';
    formStatus.value = user.status;
    passwordHelp.textContent = 'Déjala vacía para conservar la contraseña actual.';
  } else {
    userFormModalLabel.textContent = 'Nuevo usuario';
    formStatus.value = 'active';
    passwordHelp.textContent = 'Obligatoria al crear el usuario.';
  }

  applyRoleFieldRules();

  window.bootstrap.Modal.getOrCreateInstance(document.getElementById('userFormModal')).show();
}

// Un admin no necesita locatario ni unidad: se limpian y deshabilitan.
function applyRoleFieldRules() {
  const isAdmin = formRole.value === 'admin';

  if (isAdmin) {
    formTenant.value = '';
    formParkingSite.value = '';
  }

  formTenant.disabled = isAdmin;
  formParkingSite.disabled = isAdmin;
}

async function toggleUserStatus(user) {
  try {
    if (user.status === 'active') {
      await deactivateUser(user.id);
    } else {
      await reactivateUser(user.id);
    }

    allUsers = await listUsers();
    currentResults = filterUsers();
    renderUsers(currentResults);

    showAlert(
      'success',
      `Usuario ${user.username} ${user.status === 'active' ? 'desactivado' : 'activado'} correctamente.`,
    );
  } catch (error) {
    showAlert('danger', error.message);
  }
}

async function resetUserPassword(user) {
  const newPassword = window.prompt(`Nueva contraseña para ${user.username} (mínimo 8 caracteres):`);

  if (newPassword === null) {
    return; // el admin canceló
  }

  if (newPassword.trim().length < 8) {
    showAlert('danger', 'La contraseña debe tener al menos 8 caracteres.');
    return;
  }

  try {
    await setUserPassword(user.id, newPassword.trim());
    showAlert('success', `Contraseña de ${user.username} actualizada correctamente.`);
  } catch (error) {
    showAlert('danger', error.message);
  }
}

function showUserDetail(user) {
  detailUsername.textContent = user.username;
  detailFullName.textContent = user.fullName;
  detailEmail.textContent = user.email || '—';
  detailTenant.textContent = user.tenantId ? tenantNameById.get(user.tenantId) ?? '—' : 'Sin locatario';
  detailParkingSite.textContent = parkingSiteLabel(user);

  detailRole.textContent = user.roleText;
  detailRole.className = `badge ${user.role === 'admin' ? 'text-bg-primary' : 'text-bg-info'}`;

  detailStatus.textContent = user.statusText;
  detailStatus.className = `badge ${user.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`;

  window.bootstrap.Modal.getOrCreateInstance(document.getElementById('userDetailModal')).show();
}

function showAlert(type, message) {
  usersAlert.className = `alert alert-${type}`;
  usersAlert.textContent = message;
}

function hideAlert() {
  usersAlert.className = 'alert d-none';
  usersAlert.textContent = '';
}
