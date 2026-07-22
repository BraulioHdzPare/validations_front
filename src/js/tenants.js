import {
  listTenantsFull,
  createTenant,
  updateTenant,
  deactivateTenant,
  reactivateTenant,
} from './tenants-api.js';
import { listParkingSites, listUsersLite } from './lookups-api.js';
import { escapeHtml } from './html.js';

// Estado en memoria, cargado desde el backend
let allTenants = [];
let parkingSites = []; // [{ id, name }]
let parkingSiteNameById = new Map();
let usernamesByTenantId = new Map(); // tenantId -> [username]
let currentResults = [];

// Elementos del DOM
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
const tenantsWithoutSite = document.getElementById('tenantsWithoutSite');

const tenantForm = document.getElementById('tenantForm');
const tenantFormModalLabel = document.getElementById('tenantFormModalLabel');
const tenantId = document.getElementById('tenantId');
const formCommercialName = document.getElementById('formCommercialName');
const formBusinessName = document.getElementById('formBusinessName');
const formTenantStatus = document.getElementById('formTenantStatus');
const formDescription = document.getElementById('formDescription');
const tenantParkingSitesContainer = document.getElementById('tenantParkingSitesContainer');

const detailCommercialName = document.getElementById('detailCommercialName');
const detailBusinessName = document.getElementById('detailBusinessName');
const detailTenantStatus = document.getElementById('detailTenantStatus');
const detailDescription = document.getElementById('detailDescription');
const detailAssociatedUsers = document.getElementById('detailAssociatedUsers');
const detailTenantParkingSites = document.getElementById('detailTenantParkingSites');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

async function initialize() {
  try {
    const [sites, users] = await Promise.all([listParkingSites(), listUsersLite()]);

    parkingSites = sites;
    parkingSiteNameById = new Map(parkingSites.map((p) => [p.id, p.name]));
    usernamesByTenantId = groupUsernamesByTenant(users);

    renderParkingSiteCheckboxes();

    allTenants = await listTenantsFull();
    currentResults = [...allTenants];
    renderTenants(currentResults);
  } catch (error) {
    showAlert('danger', `No se pudieron cargar los locatarios: ${error.message}`);
  }
}

function groupUsernamesByTenant(users) {
  const map = new Map();

  users.forEach((user) => {
    if (!user.tenantId) {
      return;
    }
    const current = map.get(user.tenantId) ?? [];
    current.push(user.username);
    map.set(user.tenantId, current);
  });

  return map;
}

// Filtros
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
  currentResults = [...allTenants];
  renderTenants(currentResults);
  hideAlert();
});

openCreateTenantModalButton?.addEventListener('click', () => {
  openTenantFormModal();
});

// Acciones en la tabla
tenantsTableBody?.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const id = Number(actionButton.dataset.id);
  const tenant = allTenants.find((item) => item.id === id);

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

// Alta / edición
tenantForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const isEditing = Boolean(tenantId.value);

  const uiTenant = {
    commercialName: formCommercialName.value.trim(),
    businessName: formBusinessName.value.trim(),
    description: formDescription.value.trim(),
    parkingSiteIds: getSelectedParkingSiteIds(),
    status: formTenantStatus.value,
  };

  try {
    if (isEditing) {
      await updateTenant(Number(tenantId.value), uiTenant);
    } else {
      await createTenant(uiTenant);
    }

    allTenants = await listTenantsFull();
    currentResults = filterTenants();
    renderTenants(currentResults);

    showAlert('success', isEditing ? 'Locatario actualizado correctamente.' : 'Locatario creado correctamente.');

    window.bootstrap.Modal.getOrCreateInstance(document.getElementById('tenantFormModal')).hide();
  } catch (error) {
    showAlert('danger', error.message);
  }
});

function renderParkingSiteCheckboxes() {
  if (parkingSites.length === 0) {
    tenantParkingSitesContainer.innerHTML =
      '<div class="col-12"><span class="text-muted">No hay unidades registradas.</span></div>';
    return;
  }

  tenantParkingSitesContainer.innerHTML = parkingSites.map((site) => `
    <div class="col-12 col-md-6">
      <div class="form-check border rounded-3 p-3 ps-5 bg-light">
        <input
          class="form-check-input tenant-parking-checkbox"
          type="checkbox"
          value="${site.id}"
          id="tenant-parking-${site.id}"
        >
        <label class="form-check-label" for="tenant-parking-${site.id}">
          ${escapeHtml(site.name)}
        </label>
      </div>
    </div>
  `).join('');
}

function filterTenants() {
  const search = tenantSearch.value.trim().toLowerCase();
  const status = tenantStatusFilter.value;

  return allTenants.filter((tenant) => {
    const matchesSearch =
      !search ||
      tenant.commercialName.toLowerCase().includes(search) ||
      tenant.businessName.toLowerCase().includes(search);

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
        <td colspan="6" class="text-center text-muted py-4">
          No hay locatarios para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  tenantsTableBody.innerHTML = tenants.map((tenant) => {
    const userCount = usersOf(tenant).length;
    const siteCount = tenant.parkingSiteIds.length;

    return `
    <tr>
      <td><strong>${escapeHtml(tenant.commercialName) || '<span class="text-muted">Sin nombre comercial</span>'}</strong></td>
      <td>${escapeHtml(tenant.businessName)}</td>
      <td>
        <span class="badge text-bg-light">
          ${siteCount} unidad${siteCount === 1 ? '' : 'es'}
        </span>
      </td>
      <td>
        <span class="badge text-bg-light">
          ${userCount} usuario${userCount === 1 ? '' : 's'}
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
  `;
  }).join('');
}

function usersOf(tenant) {
  return usernamesByTenantId.get(tenant.id) ?? [];
}

function updateSummary() {
  const associatedUsers = allTenants.reduce((total, tenant) => total + usersOf(tenant).length, 0);
  const withoutSite = allTenants.filter((tenant) => tenant.parkingSiteIds.length === 0).length;

  totalTenants.textContent = String(allTenants.length);
  activeTenants.textContent = String(allTenants.filter((tenant) => tenant.status === 'active').length);
  totalAssociatedUsers.textContent = String(associatedUsers);
  tenantsWithoutSite.textContent = String(withoutSite);
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
  clearParkingSiteCheckboxes();

  if (tenant) {
    tenantFormModalLabel.textContent = 'Editar locatario';
    tenantId.value = tenant.id;
    formCommercialName.value = tenant.commercialName;
    formBusinessName.value = tenant.businessName;
    formTenantStatus.value = tenant.status;
    formDescription.value = tenant.description;
    setSelectedParkingSiteIds(tenant.parkingSiteIds);
  } else {
    tenantFormModalLabel.textContent = 'Nuevo locatario';
    formTenantStatus.value = 'active';
  }

  window.bootstrap.Modal.getOrCreateInstance(document.getElementById('tenantFormModal')).show();
}

async function toggleTenantStatus(tenant) {
  try {
    if (tenant.status === 'active') {
      await deactivateTenant(tenant.id);
    } else {
      await reactivateTenant(tenant.id);
    }

    allTenants = await listTenantsFull();
    currentResults = filterTenants();
    renderTenants(currentResults);

    showAlert(
      'success',
      `Locatario ${tenant.commercialName || tenant.businessName} ${tenant.status === 'active' ? 'desactivado' : 'activado'} correctamente.`,
    );
  } catch (error) {
    showAlert('danger', error.message);
  }
}

function showTenantDetail(tenant) {
  detailCommercialName.textContent = tenant.commercialName || '—';
  detailBusinessName.textContent = tenant.businessName;
  detailDescription.textContent = tenant.description || 'Sin notas registradas.';

  detailTenantStatus.textContent = tenant.statusText;
  detailTenantStatus.className = `badge ${tenant.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`;

  const usernames = usersOf(tenant);

  detailAssociatedUsers.innerHTML = usernames.length
    ? usernames.map((username) => `
        <div class="d-flex align-items-center justify-content-between border rounded-3 p-2 bg-light">
          <span>
            <i class="bi bi-person-circle me-1"></i>
            ${escapeHtml(username)}
          </span>
          <span class="badge text-bg-secondary">Usuario</span>
        </div>
      `).join('')
    : '<span class="text-muted">Sin usuarios asociados</span>';

  const siteNames = tenant.parkingSiteIds
    .map((id) => parkingSiteNameById.get(id))
    .filter(Boolean);

  detailTenantParkingSites.innerHTML = siteNames.length
    ? siteNames.map((name) => `<span class="badge text-bg-light">${escapeHtml(name)}</span>`).join('')
    : '<span class="text-muted">Sin unidades asignadas</span>';

  window.bootstrap.Modal.getOrCreateInstance(document.getElementById('tenantDetailModal')).show();
}

function getSelectedParkingSiteIds() {
  return [...document.querySelectorAll('.tenant-parking-checkbox:checked')]
    .map((checkbox) => Number(checkbox.value));
}

function setSelectedParkingSiteIds(ids) {
  document.querySelectorAll('.tenant-parking-checkbox').forEach((checkbox) => {
    checkbox.checked = ids.includes(Number(checkbox.value));
  });
}

function clearParkingSiteCheckboxes() {
  document.querySelectorAll('.tenant-parking-checkbox').forEach((checkbox) => {
    checkbox.checked = false;
  });
}

function showAlert(type, message) {
  tenantsAlert.className = `alert alert-${type}`;
  tenantsAlert.textContent = message;
}

function hideAlert() {
  tenantsAlert.className = 'alert d-none';
  tenantsAlert.textContent = '';
}
