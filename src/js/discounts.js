import {
  listDiscounts,
  createDiscount,
  updateDiscount,
  deactivateDiscount,
  reactivateDiscount,
} from './discounts-api.js';
import { listParkingSites, listTenants } from './lookups-api.js';

// Estado en memoria, cargado desde el backend
let allDiscounts = [];
let parkingSites = []; // [{ id, name }]
let tenants = []; // [{ id, name }]
let parkingSiteNameById = new Map();
let tenantNameById = new Map();
let currentResults = [];

// Referencias al DOM
const totalDiscounts = document.getElementById('totalDiscounts');
const activeDiscounts = document.getElementById('activeDiscounts');
const discountsWithoutSite = document.getElementById('discountsWithoutSite');
const discountsWithoutTenant = document.getElementById('discountsWithoutTenant');

const discountsFilterForm = document.getElementById('discountsFilterForm');
const clearDiscountFiltersButton = document.getElementById('clearDiscountFiltersButton');
const openCreateDiscountModalButton = document.getElementById('openCreateDiscountModalButton');
const discountSearch = document.getElementById('discountSearch');
const discountTypeFilter = document.getElementById('discountTypeFilter');
const discountStatusFilter = document.getElementById('discountStatusFilter');

const discountsAlert = document.getElementById('discountsAlert');
const discountsResultCountBadge = document.getElementById('discountsResultCountBadge');
const discountsTableBody = document.getElementById('discountsTableBody');

const discountForm = document.getElementById('discountForm');
const discountFormModalLabel = document.getElementById('discountFormModalLabel');
const discountId = document.getElementById('discountId');
const formDiscountName = document.getElementById('formDiscountName');
const formDiscountCode = document.getElementById('formDiscountCode');
const formExternalCode = document.getElementById('formExternalCode');
const formDiscountType = document.getElementById('formDiscountType');
const formDiscountStatus = document.getElementById('formDiscountStatus');
const formDiscountDescription = document.getElementById('formDiscountDescription');
const discountParkingSitesContainer = document.getElementById('discountParkingSitesContainer');
const discountTenantsContainer = document.getElementById('discountTenantsContainer');

const detailDiscountName = document.getElementById('detailDiscountName');
const detailDiscountStatus = document.getElementById('detailDiscountStatus');
const detailDiscountCode = document.getElementById('detailDiscountCode');
const detailExternalCode = document.getElementById('detailExternalCode');
const detailDiscountType = document.getElementById('detailDiscountType');
const detailDiscountDescription = document.getElementById('detailDiscountDescription');
const detailDiscountParkingSites = document.getElementById('detailDiscountParkingSites');
const detailDiscountTenants = document.getElementById('detailDiscountTenants');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

async function initialize() {
  try {
    [parkingSites, tenants] = await Promise.all([listParkingSites(), listTenants()]);
    parkingSiteNameById = new Map(parkingSites.map((p) => [p.id, p.name]));
    tenantNameById = new Map(tenants.map((t) => [t.id, t.name]));

    renderScopeCheckboxes();

    allDiscounts = await listDiscounts();
    currentResults = [...allDiscounts];
    renderDiscounts(currentResults);
  } catch (error) {
    showAlert('danger', `No se pudieron cargar los descuentos: ${error.message}`);
  }
}

// Filtros
discountsFilterForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  currentResults = filterDiscounts();
  renderDiscounts(currentResults);

  if (currentResults.length === 0) {
    showAlert('warning', 'No se encontraron descuentos con los filtros seleccionados.');
  } else {
    hideAlert();
  }
});

clearDiscountFiltersButton?.addEventListener('click', () => {
  discountsFilterForm.reset();
  currentResults = [...allDiscounts];
  renderDiscounts(currentResults);
  hideAlert();
});

openCreateDiscountModalButton?.addEventListener('click', () => {
  openDiscountFormModal();
});

// Acciones en la tabla
discountsTableBody?.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const id = Number(actionButton.dataset.id);
  const discount = allDiscounts.find((item) => item.id === id);

  if (!discount) {
    showAlert('danger', 'No se encontró el descuento seleccionado.');
    return;
  }

  if (action === 'view-detail') {
    showDiscountDetail(discount);
  }

  if (action === 'edit-discount') {
    openDiscountFormModal(discount);
  }

  if (action === 'toggle-status') {
    toggleDiscountStatus(discount);
  }
});

// Alta / edición
discountForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const isEditing = Boolean(discountId.value);

  const uiDiscount = {
    name: formDiscountName.value.trim(),
    code: normalizeInternalCode(formDiscountCode.value),
    externalCode: formExternalCode.value.trim(),
    type: formDiscountType.value,
    description: formDiscountDescription.value.trim(),
    parkingSiteIds: getCheckedIds('.discount-parking-checkbox'),
    tenantIds: getCheckedIds('.discount-tenant-checkbox'),
    status: formDiscountStatus.value,
  };

  try {
    if (isEditing) {
      await updateDiscount(Number(discountId.value), uiDiscount);
    } else {
      await createDiscount(uiDiscount);
    }

    allDiscounts = await listDiscounts();
    currentResults = filterDiscounts();
    renderDiscounts(currentResults);

    showAlert('success', isEditing ? 'Descuento actualizado correctamente.' : 'Descuento creado correctamente.');

    window.bootstrap.Modal.getOrCreateInstance(document.getElementById('discountFormModal')).hide();
  } catch (error) {
    showAlert('danger', error.message);
  }
});

function renderScopeCheckboxes() {
  discountParkingSitesContainer.innerHTML = buildCheckboxes(
    parkingSites,
    'discount-parking-checkbox',
    'discount-parking',
    'No hay unidades registradas.',
  );

  discountTenantsContainer.innerHTML = buildCheckboxes(
    tenants,
    'discount-tenant-checkbox',
    'discount-tenant',
    'No hay locatarios registrados.',
  );
}

function buildCheckboxes(items, checkboxClass, idPrefix, emptyMessage) {
  if (items.length === 0) {
    return `<div class="col-12"><span class="text-muted">${emptyMessage}</span></div>`;
  }

  return items.map((item) => `
    <div class="col-12 col-md-6">
      <div class="form-check border rounded-3 p-3 ps-5 bg-light">
        <input
          class="form-check-input ${checkboxClass}"
          type="checkbox"
          value="${item.id}"
          id="${idPrefix}-${item.id}"
        >
        <label class="form-check-label" for="${idPrefix}-${item.id}">
          ${item.name}
        </label>
      </div>
    </div>
  `).join('');
}

function filterDiscounts() {
  const search = discountSearch.value.trim().toLowerCase();
  const type = discountTypeFilter.value;
  const status = discountStatusFilter.value;

  return allDiscounts.filter((discount) => {
    const matchesSearch =
      !search ||
      discount.name.toLowerCase().includes(search) ||
      discount.code.toLowerCase().includes(search) ||
      discount.externalCode.toLowerCase().includes(search) ||
      discount.description.toLowerCase().includes(search);

    const matchesType = !type || discount.type === type;
    const matchesStatus = !status || discount.status === status;

    return matchesSearch && matchesType && matchesStatus;
  });
}

function renderDiscounts(discounts) {
  updateSummary();
  updateResultCount(discounts.length);

  if (discounts.length === 0) {
    discountsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          No hay descuentos para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  discountsTableBody.innerHTML = discounts.map((discount) => `
    <tr>
      <td><strong>${discount.name}</strong></td>
      <td><span class="badge text-bg-light">${discount.code}</span></td>
      <td>${discount.externalCode || '<span class="text-muted">Sin mapear</span>'}</td>
      <td>${renderTypeBadge(discount)}</td>
      <td>${renderScopeBadge(discount.parkingSiteIds.length, 'unidad', 'unidades')}</td>
      <td>${renderScopeBadge(discount.tenantIds.length, 'locatario', 'locatarios')}</td>
      <td>${renderStatusBadge(discount)}</td>
      <td class="text-end">
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            data-action="view-detail"
            data-id="${discount.id}"
            title="Ver detalle"
          >
            <i class="bi bi-eye"></i>
          </button>

          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            data-action="edit-discount"
            data-id="${discount.id}"
            title="Editar"
          >
            <i class="bi bi-pencil"></i>
          </button>

          <button
            type="button"
            class="btn ${discount.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'} btn-sm"
            data-action="toggle-status"
            data-id="${discount.id}"
            title="${discount.status === 'active' ? 'Desactivar' : 'Activar'}"
          >
            <i class="bi ${discount.status === 'active' ? 'bi-x-circle' : 'bi-check2-circle'}"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateSummary() {
  totalDiscounts.textContent = String(allDiscounts.length);
  activeDiscounts.textContent = String(allDiscounts.filter((d) => d.status === 'active').length);
  discountsWithoutSite.textContent = String(allDiscounts.filter((d) => d.parkingSiteIds.length === 0).length);
  discountsWithoutTenant.textContent = String(allDiscounts.filter((d) => d.tenantIds.length === 0).length);
}

function updateResultCount(count) {
  discountsResultCountBadge.textContent = `${count} descuento${count === 1 ? '' : 's'}`;
}

function renderStatusBadge(discount) {
  if (discount.status === 'active') {
    return `<span class="badge text-bg-success">${discount.statusText}</span>`;
  }

  return `<span class="badge text-bg-secondary">${discount.statusText}</span>`;
}

function renderTypeBadge(discount) {
  const badgeClassByType = {
    time: 'text-bg-primary',
    percentage: 'text-bg-info',
    fixed_rate: 'text-bg-warning',
    courtesy: 'text-bg-dark',
  };

  const className = badgeClassByType[discount.type] || 'text-bg-secondary';

  return `<span class="badge ${className}">${discount.typeText}</span>`;
}

/** Un descuento sin unidades o sin locatarios no lo ve nadie: lo marcamos. */
function renderScopeBadge(count, singular, plural) {
  if (count === 0) {
    return '<span class="badge text-bg-warning">Ninguno</span>';
  }

  return `<span class="badge text-bg-light">${count} ${count === 1 ? singular : plural}</span>`;
}

function openDiscountFormModal(discount = null) {
  discountForm.reset();
  discountId.value = '';
  clearCheckboxes();

  if (discount) {
    discountFormModalLabel.textContent = 'Editar descuento';
    discountId.value = discount.id;
    formDiscountName.value = discount.name;
    formDiscountCode.value = discount.code;
    formExternalCode.value = discount.externalCode;
    formDiscountType.value = discount.type;
    formDiscountStatus.value = discount.status;
    formDiscountDescription.value = discount.description;
    setCheckedIds('.discount-parking-checkbox', discount.parkingSiteIds);
    setCheckedIds('.discount-tenant-checkbox', discount.tenantIds);
  } else {
    discountFormModalLabel.textContent = 'Nuevo descuento';
    formDiscountStatus.value = 'active';
  }

  window.bootstrap.Modal.getOrCreateInstance(document.getElementById('discountFormModal')).show();
}

async function toggleDiscountStatus(discount) {
  try {
    if (discount.status === 'active') {
      await deactivateDiscount(discount.id);
    } else {
      await reactivateDiscount(discount.id);
    }

    allDiscounts = await listDiscounts();
    currentResults = filterDiscounts();
    renderDiscounts(currentResults);

    showAlert(
      'success',
      `Descuento ${discount.name} ${discount.status === 'active' ? 'desactivado' : 'activado'} correctamente.`,
    );
  } catch (error) {
    showAlert('danger', error.message);
  }
}

function showDiscountDetail(discount) {
  detailDiscountName.textContent = discount.name;
  detailDiscountCode.textContent = discount.code;
  detailExternalCode.textContent = discount.externalCode || 'Sin mapear';
  detailDiscountType.textContent = discount.typeText;
  detailDiscountDescription.textContent = discount.description || 'Sin descripción registrada.';

  detailDiscountStatus.textContent = discount.statusText;
  detailDiscountStatus.className = `badge ${discount.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`;

  detailDiscountParkingSites.innerHTML = renderNameBadges(
    discount.parkingSiteIds,
    parkingSiteNameById,
    'Sin unidades asignadas (nadie lo verá)',
  );

  detailDiscountTenants.innerHTML = renderNameBadges(
    discount.tenantIds,
    tenantNameById,
    'Sin locatarios asignados (ningún locatario lo verá)',
  );

  window.bootstrap.Modal.getOrCreateInstance(document.getElementById('discountDetailModal')).show();
}

function renderNameBadges(ids, nameById, emptyMessage) {
  const names = ids.map((id) => nameById.get(id)).filter(Boolean);

  if (names.length === 0) {
    return `<span class="text-muted">${emptyMessage}</span>`;
  }

  return names.map((name) => `<span class="badge text-bg-light">${name}</span>`).join('');
}

function getCheckedIds(selector) {
  return [...document.querySelectorAll(`${selector}:checked`)].map((checkbox) => Number(checkbox.value));
}

function setCheckedIds(selector, ids) {
  document.querySelectorAll(selector).forEach((checkbox) => {
    checkbox.checked = ids.includes(Number(checkbox.value));
  });
}

function clearCheckboxes() {
  document.querySelectorAll('.discount-parking-checkbox, .discount-tenant-checkbox').forEach((checkbox) => {
    checkbox.checked = false;
  });
}

/** Normaliza el código interno: MAYÚSCULAS_CON_GUIONES_BAJOS. */
function normalizeInternalCode(value) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

function showAlert(type, message) {
  discountsAlert.className = `alert alert-${type}`;
  discountsAlert.textContent = message;
}

function hideAlert() {
  discountsAlert.className = 'alert d-none';
  discountsAlert.textContent = '';
}
