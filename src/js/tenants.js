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

let tenantsMock = [
  {
    id: 1,
    commercialName: 'Cine',
    businessName: 'Cines del Centro S.A. de C.V.',
    code: 'CINE-001',
    status: 'active',
    statusText: 'Activo',
    description: 'Locatario autorizado para aplicar validaciones de cortesía parcial.',
    permissions: ['two_hours_free'],
    users: ['usuario.cine01', 'usuario.cine02'],
  },
  {
    id: 2,
    commercialName: 'Gimnasio',
    businessName: 'Fitness Plaza S.A. de C.V.',
    code: 'GYM-001',
    status: 'active',
    statusText: 'Activo',
    description: 'Locatario con validaciones para clientes con membresía activa.',
    permissions: ['fifty_percent', 'preferred_rate'],
    users: ['usuario.gym01'],
  },
  {
    id: 3,
    commercialName: 'Restaurante',
    businessName: 'Restaurantes del Patio S.A. de C.V.',
    code: 'REST-001',
    status: 'inactive',
    statusText: 'Inactivo',
    description: 'Locatario temporalmente inactivo por revisión administrativa.',
    permissions: ['preferred_rate'],
    users: ['usuario.rest01'],
  },
  {
    id: 4,
    commercialName: 'Empresa X',
    businessName: 'Empresa X Servicios Corporativos S.A. de C.V.',
    code: 'EMPX-001',
    status: 'active',
    statusText: 'Activo',
    description: 'Empresa autorizada para validaciones corporativas.',
    permissions: ['full_courtesy'],
    users: ['empresa.x01', 'empresa.x02', 'empresa.x03'],
  },
];

const tenantsFilterForm = document.getElementById('tenantsFilterForm');
const clearTenantFiltersButton = document.getElementById('clearTenantFiltersButton');
const openCreateTenantModalButton = document.getElementById('openCreateTenantModalButton');
const tenantsTableBody = document.getElementById('tenantsTableBody');

const tenantSearch = document.getElementById('tenantSearch');
const tenantStatusFilter = document.getElementById('tenantStatusFilter');

const tenantsAlert = document.getElementById('tenantsAlert');
const tenantsResultCountBadge = document.getElementById('tenantsResultCountBadge');

const totalTenants = document.getElementById('totalTenants');
const activeTenants = document.getElementById('activeTenants');
const totalAssociatedUsers = document.getElementById('totalAssociatedUsers');
const totalAssignedPermissions = document.getElementById('totalAssignedPermissions');

const tenantForm = document.getElementById('tenantForm');
const tenantFormModalLabel = document.getElementById('tenantFormModalLabel');
const tenantId = document.getElementById('tenantId');
const formCommercialName = document.getElementById('formCommercialName');
const formBusinessName = document.getElementById('formBusinessName');
const formTenantCode = document.getElementById('formTenantCode');
const formTenantStatus = document.getElementById('formTenantStatus');
const formDescription = document.getElementById('formDescription');
const tenantPermissionsContainer = document.getElementById('tenantPermissionsContainer');

const detailCommercialName = document.getElementById('detailCommercialName');
const detailBusinessName = document.getElementById('detailBusinessName');
const detailTenantCode = document.getElementById('detailTenantCode');
const detailTenantStatus = document.getElementById('detailTenantStatus');
const detailDescription = document.getElementById('detailDescription');
const detailAssociatedUsers = document.getElementById('detailAssociatedUsers');
const detailTenantPermissions = document.getElementById('detailTenantPermissions');

let currentResults = [...tenantsMock];

document.addEventListener('DOMContentLoaded', () => {
  renderTenantPermissionCheckboxes();
  renderTenants(tenantsMock);
});

tenantsFilterForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  currentResults = filterTenants();
  renderTenants(currentResults);

  if (currentResults.length === 0) {
    showAlert('warning', 'No se encontraron locatarios con los filtros seleccionados.');
  } else {
    hideAlert();
  }
});

clearTenantFiltersButton?.addEventListener('click', () => {
  tenantsFilterForm.reset();
  currentResults = [...tenantsMock];
  renderTenants(currentResults);
  hideAlert();
});

openCreateTenantModalButton?.addEventListener('click', () => {
  openTenantFormModal();
});

tenantsTableBody?.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const id = Number(actionButton.dataset.id);
  const tenant = tenantsMock.find((item) => item.id === id);

  if (!tenant) {
    showAlert('danger', 'No se encontró el locatario seleccionado.');
    return;
  }

  if (action === 'view-detail') {
    showTenantDetail(tenant);
  }

  if (action === 'edit-tenant') {
    openTenantFormModal(tenant);
  }

  if (action === 'toggle-status') {
    toggleTenantStatus(tenant);
  }
});

tenantForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const selectedPermissions = getSelectedPermissions();

  if (selectedPermissions.length === 0) {
    showAlert('danger', 'Selecciona al menos una validación permitida para el locatario.');
    return;
  }

  const id = tenantId.value ? Number(tenantId.value) : null;

  if (id) {
    updateTenant(id, selectedPermissions);
    showAlert('success', 'Locatario actualizado correctamente.');
  } else {
    createTenant(selectedPermissions);
    showAlert('success', 'Locatario creado correctamente.');
  }

  currentResults = [...tenantsMock];
  renderTenants(currentResults);

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('tenantFormModal'));
  modal.hide();
});

function renderTenantPermissionCheckboxes() {
  tenantPermissionsContainer.innerHTML = discountsMock.map((discount) => `
    <div class="col-12 col-md-6">
      <div class="form-check border rounded-3 p-3 ps-5 bg-light">
        <input
          class="form-check-input tenant-permission-checkbox"
          type="checkbox"
          value="${discount.id}"
          id="tenant-permission-${discount.id}"
        >
        <label class="form-check-label" for="tenant-permission-${discount.id}">
          ${discount.name}
        </label>
      </div>
    </div>
  `).join('');
}

function filterTenants() {
  const search = tenantSearch.value.trim().toLowerCase();
  const status = tenantStatusFilter.value;

  return tenantsMock.filter((tenant) => {
    const matchesSearch =
      !search ||
      tenant.commercialName.toLowerCase().includes(search) ||
      tenant.businessName.toLowerCase().includes(search) ||
      tenant.code.toLowerCase().includes(search);

    const matchesStatus = !status || tenant.status === status;

    return matchesSearch && matchesStatus;
  });
}

function renderTenants(tenants) {
  updateSummary();
  updateResultCount(tenants.length);

  if (tenants.length === 0) {
    tenantsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          No hay locatarios para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  tenantsTableBody.innerHTML = tenants.map((tenant) => `
    <tr>
      <td><strong>${tenant.commercialName}</strong></td>
      <td>${tenant.businessName}</td>
      <td><span class="badge text-bg-light">${tenant.code}</span></td>
      <td>
        <span class="badge text-bg-light">
          ${tenant.users.length} usuario${tenant.users.length === 1 ? '' : 's'}
        </span>
      </td>
      <td>
        <span class="badge text-bg-light">
          ${tenant.permissions.length} permiso${tenant.permissions.length === 1 ? '' : 's'}
        </span>
      </td>
      <td>${renderStatusBadge(tenant)}</td>
      <td class="text-end">
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            data-action="view-detail"
            data-id="${tenant.id}"
            title="Ver detalle"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            data-action="edit-tenant"
            data-id="${tenant.id}"
            title="Editar"
          >
            <i class="bi bi-pencil"></i>
          </button>

          <button
            type="button"
            class="btn ${tenant.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'} btn-sm"
            data-action="toggle-status"
            data-id="${tenant.id}"
            title="${tenant.status === 'active' ? 'Desactivar' : 'Activar'}"
          >
            <i class="bi ${tenant.status === 'active' ? 'bi-shop-window' : 'bi-check2-circle'}"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateSummary() {
  const associatedUsers = tenantsMock.reduce((total, tenant) => total + tenant.users.length, 0);
  const assignedPermissions = tenantsMock.reduce((total, tenant) => total + tenant.permissions.length, 0);

  totalTenants.textContent = String(tenantsMock.length);
  activeTenants.textContent = String(tenantsMock.filter((tenant) => tenant.status === 'active').length);
  totalAssociatedUsers.textContent = String(associatedUsers);
  totalAssignedPermissions.textContent = String(assignedPermissions);
}

function updateResultCount(count) {
  tenantsResultCountBadge.textContent = `${count} locatario${count === 1 ? '' : 's'}`;
}

function renderStatusBadge(tenant) {
  if (tenant.status === 'active') {
    return `<span class="badge text-bg-success">${tenant.statusText}</span>`;
  }

  return `<span class="badge text-bg-secondary">${tenant.statusText}</span>`;
}

function openTenantFormModal(tenant = null) {
  tenantForm.reset();
  tenantId.value = '';
  clearPermissionCheckboxes();

  if (tenant) {
    tenantFormModalLabel.textContent = 'Editar locatario';
    tenantId.value = tenant.id;
    formCommercialName.value = tenant.commercialName;
    formBusinessName.value = tenant.businessName;
    formTenantCode.value = tenant.code;
    formTenantStatus.value = tenant.status;
    formDescription.value = tenant.description;
    setSelectedPermissions(tenant.permissions);
  } else {
    tenantFormModalLabel.textContent = 'Nuevo locatario';
    formTenantStatus.value = 'active';
  }

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('tenantFormModal'));
  modal.show();
}

function createTenant(selectedPermissions) {
  const newTenant = {
    id: getNextTenantId(),
    commercialName: formCommercialName.value.trim(),
    businessName: formBusinessName.value.trim(),
    code: formTenantCode.value.trim().toUpperCase(),
    status: formTenantStatus.value,
    statusText: getStatusText(formTenantStatus.value),
    description: formDescription.value.trim() || 'Sin notas registradas.',
    permissions: selectedPermissions,
    users: [],
  };

  tenantsMock = [newTenant, ...tenantsMock];
}

function updateTenant(id, selectedPermissions) {
  tenantsMock = tenantsMock.map((tenant) => {
    if (tenant.id !== id) {
      return tenant;
    }

    return {
      ...tenant,
      commercialName: formCommercialName.value.trim(),
      businessName: formBusinessName.value.trim(),
      code: formTenantCode.value.trim().toUpperCase(),
      status: formTenantStatus.value,
      statusText: getStatusText(formTenantStatus.value),
      description: formDescription.value.trim() || 'Sin notas registradas.',
      permissions: selectedPermissions,
    };
  });
}

function toggleTenantStatus(tenant) {
  const newStatus = tenant.status === 'active' ? 'inactive' : 'active';

  tenantsMock = tenantsMock.map((item) => {
    if (item.id !== tenant.id) {
      return item;
    }

    return {
      ...item,
      status: newStatus,
      statusText: getStatusText(newStatus),
    };
  });

  currentResults = filterTenants();
  renderTenants(currentResults);

  showAlert(
    'success',
    `Locatario ${tenant.commercialName} ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente.`
  );
}

function showTenantDetail(tenant) {
  detailCommercialName.textContent = tenant.commercialName;
  detailBusinessName.textContent = tenant.businessName;
  detailTenantCode.textContent = tenant.code;
  detailDescription.textContent = tenant.description;

  detailTenantStatus.textContent = tenant.statusText;
  detailTenantStatus.className = `badge ${tenant.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`;

  detailAssociatedUsers.innerHTML = tenant.users.length
    ? tenant.users.map((user) => `
        <div class="d-flex align-items-center justify-content-between border rounded-3 p-2 bg-light">
          <span>
            <i class="bi bi-person-circle me-1"></i>
            ${user}
          </span>
          <span class="badge text-bg-secondary">Usuario</span>
        </div>
      `).join('')
    : '<span class="text-muted">Sin usuarios asociados</span>';

  const permissions = getPermissionNames(tenant.permissions);

  detailTenantPermissions.innerHTML = permissions.length
    ? permissions.map((name) => `<span class="badge text-bg-light">${name}</span>`).join('')
    : '<span class="text-muted">Sin permisos asignados</span>';

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('tenantDetailModal'));
  modal.show();
}

function getSelectedPermissions() {
  return [...document.querySelectorAll('.tenant-permission-checkbox:checked')]
    .map((checkbox) => checkbox.value);
}

function setSelectedPermissions(permissions) {
  document.querySelectorAll('.tenant-permission-checkbox').forEach((checkbox) => {
    checkbox.checked = permissions.includes(checkbox.value);
  });
}

function clearPermissionCheckboxes() {
  document.querySelectorAll('.tenant-permission-checkbox').forEach((checkbox) => {
    checkbox.checked = false;
  });
}

function getPermissionNames(permissionIds) {
  return permissionIds.map((permissionId) => {
    const discount = discountsMock.find((item) => item.id === permissionId);
    return discount ? discount.name : permissionId;
  });
}

function getStatusText(status) {
  if (status === 'active') {
    return 'Activo';
  }

  return 'Inactivo';
}

function getNextTenantId() {
  return tenantsMock.length ? Math.max(...tenantsMock.map((tenant) => tenant.id)) + 1 : 1;
}

function showAlert(type, message) {
  tenantsAlert.className = `alert alert-${type}`;
  tenantsAlert.textContent = message;
}

function hideAlert() {
  tenantsAlert.className = 'alert d-none';
  tenantsAlert.textContent = '';
}