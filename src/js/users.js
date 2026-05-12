// Mock de datos para locatarios y descuentos
const tenantsMock = [
  'Cine',
  'Gimnasio',
  'Restaurante',
  'Empresa X',
];

const discountsMock = [
  {
    id: 'two_hours_free',
    name: '2 horas gratis',
  },
  {
    id: 'fifty_percent',
    name: '50% descuento',
  },
  {
    id: 'preferred_rate',
    name: 'Tarifa preferente',
  },
  {
    id: 'full_courtesy',
    name: 'Cortesía total',
  },
];

// Mock de datos para usuarios
let usersMock = [
  {
    id: 1,
    username: 'admin',
    fullName: 'Administrador General',
    email: 'admin@pare.com.mx',
    role: 'admin',
    roleText: 'Administrador',
    tenant: '',
    status: 'active',
    statusText: 'Activo',
    permissions: ['two_hours_free', 'fifty_percent', 'preferred_rate', 'full_courtesy'],
  },
  {
    id: 2,
    username: 'usuario.cine01',
    fullName: 'Usuario Cine 01',
    email: 'cine01@locatario.com',
    role: 'tenant_user',
    roleText: 'Locatario',
    tenant: 'Cine',
    status: 'active',
    statusText: 'Activo',
    permissions: ['two_hours_free'],
  },
  {
    id: 3,
    username: 'usuario.gym01',
    fullName: 'Usuario Gimnasio 01',
    email: 'gym01@locatario.com',
    role: 'tenant_user',
    roleText: 'Locatario',
    tenant: 'Gimnasio',
    status: 'active',
    statusText: 'Activo',
    permissions: ['fifty_percent', 'preferred_rate'],
  },
  {
    id: 4,
    username: 'usuario.rest01',
    fullName: 'Usuario Restaurante 01',
    email: 'rest01@locatario.com',
    role: 'tenant_user',
    roleText: 'Locatario',
    tenant: 'Restaurante',
    status: 'inactive',
    statusText: 'Inactivo',
    permissions: ['preferred_rate'],
  },
];

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
const formFullName = document.getElementById('formFullName');
const formEmail = document.getElementById('formEmail');
const formRole = document.getElementById('formRole');
const formTenant = document.getElementById('formTenant');
const formStatus = document.getElementById('formStatus');
const discountPermissionsContainer = document.getElementById('discountPermissionsContainer');

const detailUsername = document.getElementById('detailUsername');
const detailFullName = document.getElementById('detailFullName');
const detailEmail = document.getElementById('detailEmail');
const detailRole = document.getElementById('detailRole');
const detailStatus = document.getElementById('detailStatus');
const detailTenant = document.getElementById('detailTenant');
const detailPermissions = document.getElementById('detailPermissions');

let currentResults = [...usersMock];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadFilterOptions();
  loadFormOptions();
  renderPermissionCheckboxes();
  renderUsers(usersMock);
});

// Actualización de resultados al aplicar filtros
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

// Limpieza de filtros y resultados
clearUserFiltersButton?.addEventListener('click', () => {
  usersFilterForm.reset();
  currentResults = [...usersMock];
  renderUsers(currentResults);
  hideAlert();
});

// Apertura del modal para crear nuevo usuario
openCreateUserModalButton?.addEventListener('click', () => {
  openUserFormModal();
});

// Manejo de acciones en la tabla de usuarios
usersTableBody?.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const id = Number(actionButton.dataset.id);
  const user = usersMock.find((item) => item.id === id);

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

// Manejo del formulario de creación/edición de usuario
userForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const selectedPermissions = getSelectedPermissions();

  if (formRole.value === 'tenant_user' && !formTenant.value) {
    showAlert('danger', 'Los usuarios locatarios deben tener un locatario asignado.');
    return;
  }

  if (selectedPermissions.length === 0) {
    showAlert('danger', 'Selecciona al menos una validación permitida.');
    return;
  }

  const id = userId.value ? Number(userId.value) : null;

  if (id) {
    updateUser(id, selectedPermissions);
    showAlert('success', 'Usuario actualizado correctamente.');
  } else {
    createUser(selectedPermissions);
    showAlert('success', 'Usuario creado correctamente.');
  }

  currentResults = [...usersMock];
  renderUsers(currentResults);

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('userFormModal'));
  modal.hide();
});

//
formRole?.addEventListener('change', () => {
  if (formRole.value === 'admin') {
    formTenant.value = '';
  }
});

function loadFilterOptions() {
  renderSelectOptions(tenantFilter, tenantsMock);
}

function loadFormOptions() {
  renderSelectOptions(formTenant, tenantsMock);
}

function renderSelectOptions(selectElement, values) {
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

function renderPermissionCheckboxes() {
  discountPermissionsContainer.innerHTML = discountsMock.map((discount) => `
    <div class="col-12 col-md-6">
      <div class="form-check border rounded-3 p-3 ps-5 bg-light">
        <input
          class="form-check-input permission-checkbox"
          type="checkbox"
          value="${discount.id}"
          id="permission-${discount.id}"
        >
        <label class="form-check-label" for="permission-${discount.id}">
          ${discount.name}
        </label>
      </div>
    </div>
  `).join('');
}

function filterUsers() {
  const search = userSearch.value.trim().toLowerCase();
  const role = roleFilter.value;
  const tenant = tenantFilter.value;
  const status = statusFilter.value;

  return usersMock.filter((user) => {
    const matchesSearch =
      !search ||
      user.username.toLowerCase().includes(search) ||
      user.fullName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search);

    const matchesRole = !role || user.role === role;
    const matchesTenant = !tenant || user.tenant === tenant;
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
        <td colspan="8" class="text-center text-muted py-4">
          No hay usuarios para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  usersTableBody.innerHTML = users.map((user) => `
    <tr>
      <td><strong>${user.username}</strong></td>
      <td>${user.fullName}</td>
      <td>${user.email}</td>
      <td>${renderRoleBadge(user)}</td>
      <td>${user.tenant || '<span class="text-muted">Sin locatario</span>'}</td>
      <td>
        <span class="badge text-bg-light">
          ${user.permissions.length} permiso${user.permissions.length === 1 ? '' : 's'}
        </span>
      </td>
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
  totalUsers.textContent = String(usersMock.length);
  activeUsers.textContent = String(usersMock.filter((user) => user.status === 'active').length);
  adminUsers.textContent = String(usersMock.filter((user) => user.role === 'admin').length);
  tenantUsers.textContent = String(usersMock.filter((user) => user.role === 'tenant_user').length);
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

function openUserFormModal(user = null) {
  userForm.reset();
  userId.value = '';
  clearPermissionCheckboxes();

  if (user) {
    userFormModalLabel.textContent = 'Editar usuario';
    userId.value = user.id;
    formUsername.value = user.username;
    formFullName.value = user.fullName;
    formEmail.value = user.email;
    formRole.value = user.role;
    formTenant.value = user.tenant;
    formStatus.value = user.status;
    setSelectedPermissions(user.permissions);
  } else {
    userFormModalLabel.textContent = 'Nuevo usuario';
    formStatus.value = 'active';
  }

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('userFormModal'));
  modal.show();
}

function createUser(selectedPermissions) {
  const newUser = {
    id: getNextUserId(),
    username: formUsername.value.trim(),
    fullName: formFullName.value.trim(),
    email: formEmail.value.trim(),
    role: formRole.value,
    roleText: getRoleText(formRole.value),
    tenant: formRole.value === 'admin' ? '' : formTenant.value,
    status: formStatus.value,
    statusText: getStatusText(formStatus.value),
    permissions: selectedPermissions,
  };

  usersMock = [newUser, ...usersMock];
}

function updateUser(id, selectedPermissions) {
  usersMock = usersMock.map((user) => {
    if (user.id !== id) {
      return user;
    }

    return {
      ...user,
      username: formUsername.value.trim(),
      fullName: formFullName.value.trim(),
      email: formEmail.value.trim(),
      role: formRole.value,
      roleText: getRoleText(formRole.value),
      tenant: formRole.value === 'admin' ? '' : formTenant.value,
      status: formStatus.value,
      statusText: getStatusText(formStatus.value),
      permissions: selectedPermissions,
    };
  });
}

function toggleUserStatus(user) {
  const newStatus = user.status === 'active' ? 'inactive' : 'active';

  usersMock = usersMock.map((item) => {
    if (item.id !== user.id) {
      return item;
    }

    return {
      ...item,
      status: newStatus,
      statusText: getStatusText(newStatus),
    };
  });

  currentResults = filterUsers();
  renderUsers(currentResults);

  showAlert(
    'success',
    `Usuario ${user.username} ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente.`
  );
}

function resetUserPassword(user) {
  showAlert('success', `Contraseña de ${user.username} restablecida de forma simulada.`);
}

function showUserDetail(user) {
  detailUsername.textContent = user.username;
  detailFullName.textContent = user.fullName;
  detailEmail.textContent = user.email;
  detailTenant.textContent = user.tenant || 'Sin locatario';

  detailRole.textContent = user.roleText;
  detailRole.className = `badge ${user.role === 'admin' ? 'text-bg-primary' : 'text-bg-info'}`;

  detailStatus.textContent = user.statusText;
  detailStatus.className = `badge ${user.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`;

  const permissions = getPermissionNames(user.permissions);

  detailPermissions.innerHTML = permissions.length
    ? permissions.map((name) => `<span class="badge text-bg-light">${name}</span>`).join('')
    : '<span class="text-muted">Sin permisos asignados</span>';

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('userDetailModal'));
  modal.show();
}

function getSelectedPermissions() {
  return [...document.querySelectorAll('.permission-checkbox:checked')]
    .map((checkbox) => checkbox.value);
}

function setSelectedPermissions(permissions) {
  document.querySelectorAll('.permission-checkbox').forEach((checkbox) => {
    checkbox.checked = permissions.includes(checkbox.value);
  });
}

function clearPermissionCheckboxes() {
  document.querySelectorAll('.permission-checkbox').forEach((checkbox) => {
    checkbox.checked = false;
  });
}

function getPermissionNames(permissionIds) {
  return permissionIds.map((permissionId) => {
    const discount = discountsMock.find((item) => item.id === permissionId);
    return discount ? discount.name : permissionId;
  });
}

function getRoleText(role) {
  if (role === 'admin') {
    return 'Administrador';
  }

  return 'Locatario';
}

function getStatusText(status) {
  if (status === 'active') {
    return 'Activo';
  }

  return 'Inactivo';
}

function getNextUserId() {
  return usersMock.length ? Math.max(...usersMock.map((user) => user.id)) + 1 : 1;
}

function showAlert(type, message) {
  usersAlert.className = `alert alert-${type}`;
  usersAlert.textContent = message;
}

function hideAlert() {
  usersAlert.className = 'alert d-none';
  usersAlert.textContent = '';
}