let discountsMock = [
  {
    id: 1,
    name: '2 horas gratis',
    code: 'TWO_HOURS_FREE',
    designaCode: 'DSG-VAL-001',
    type: 'time',
    typeText: 'Tiempo',
    value: 120,
    valueText: '120 min',
    requiresAmount: false,
    requiresConfirmation: true,
    status: 'active',
    statusText: 'Activo',
    description: 'Validación para otorgar dos horas sin costo al cliente del locatario.',
  },
  {
    id: 2,
    name: '50% descuento',
    code: 'FIFTY_PERCENT',
    designaCode: 'DSG-VAL-002',
    type: 'percentage',
    typeText: 'Porcentaje',
    value: 50,
    valueText: '50%',
    requiresAmount: false,
    requiresConfirmation: true,
    status: 'active',
    statusText: 'Activo',
    description: 'Aplica un descuento del 50% sobre el monto actual del boleto.',
  },
  {
    id: 3,
    name: 'Tarifa preferente',
    code: 'PREFERRED_RATE',
    designaCode: 'DSG-VAL-003',
    type: 'fixed_rate',
    typeText: 'Tarifa fija',
    value: 25,
    valueText: '$25.00',
    requiresAmount: false,
    requiresConfirmation: true,
    status: 'active',
    statusText: 'Activo',
    description: 'Configura el boleto con una tarifa final preferente.',
  },
  {
    id: 4,
    name: 'Cortesía total',
    code: 'FULL_COURTESY',
    designaCode: 'DSG-VAL-004',
    type: 'courtesy',
    typeText: 'Cortesía',
    value: 100,
    valueText: '100%',
    requiresAmount: false,
    requiresConfirmation: true,
    status: 'inactive',
    statusText: 'Inactivo',
    description: 'Validación de cortesía total. Su uso debe estar restringido a perfiles autorizados.',
  },
];

const discountsFilterForm = document.getElementById('discountsFilterForm');
const clearDiscountFiltersButton = document.getElementById('clearDiscountFiltersButton');
const openCreateDiscountModalButton = document.getElementById('openCreateDiscountModalButton');
const discountsTableBody = document.getElementById('discountsTableBody');

const discountSearch = document.getElementById('discountSearch');
const discountTypeFilter = document.getElementById('discountTypeFilter');
const discountStatusFilter = document.getElementById('discountStatusFilter');

const discountsAlert = document.getElementById('discountsAlert');
const discountsResultCountBadge = document.getElementById('discountsResultCountBadge');

const totalDiscounts = document.getElementById('totalDiscounts');
const activeDiscounts = document.getElementById('activeDiscounts');
const amountRequiredDiscounts = document.getElementById('amountRequiredDiscounts');
const designaMappedDiscounts = document.getElementById('designaMappedDiscounts');

const discountForm = document.getElementById('discountForm');
const discountFormModalLabel = document.getElementById('discountFormModalLabel');
const discountId = document.getElementById('discountId');
const formDiscountName = document.getElementById('formDiscountName');
const formDiscountCode = document.getElementById('formDiscountCode');
const formDesignaCode = document.getElementById('formDesignaCode');
const formDiscountType = document.getElementById('formDiscountType');
const formDiscountValue = document.getElementById('formDiscountValue');
const formDiscountStatus = document.getElementById('formDiscountStatus');
const formRequiresAmount = document.getElementById('formRequiresAmount');
const formRequiresConfirmation = document.getElementById('formRequiresConfirmation');
const formDiscountDescription = document.getElementById('formDiscountDescription');

const detailDiscountName = document.getElementById('detailDiscountName');
const detailDiscountStatus = document.getElementById('detailDiscountStatus');
const detailDiscountCode = document.getElementById('detailDiscountCode');
const detailDesignaCode = document.getElementById('detailDesignaCode');
const detailDiscountType = document.getElementById('detailDiscountType');
const detailDiscountValue = document.getElementById('detailDiscountValue');
const detailRequiresAmount = document.getElementById('detailRequiresAmount');
const detailRequiresConfirmation = document.getElementById('detailRequiresConfirmation');
const detailDiscountDescription = document.getElementById('detailDiscountDescription');

let currentResults = [...discountsMock];

document.addEventListener('DOMContentLoaded', () => {
  renderDiscounts(discountsMock);
});

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
  currentResults = [...discountsMock];
  renderDiscounts(currentResults);
  hideAlert();
});

openCreateDiscountModalButton?.addEventListener('click', () => {
  openDiscountFormModal();
});

discountsTableBody?.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const id = Number(actionButton.dataset.id);
  const discount = discountsMock.find((item) => item.id === id);

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

discountForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const id = discountId.value ? Number(discountId.value) : null;

  if (Number(formDiscountValue.value) < 0) {
    showAlert('danger', 'El valor del descuento no puede ser negativo.');
    return;
  }

  if (id) {
    updateDiscount(id);
    showAlert('success', 'Descuento actualizado correctamente.');
  } else {
    createDiscount();
    showAlert('success', 'Descuento creado correctamente.');
  }

  currentResults = [...discountsMock];
  renderDiscounts(currentResults);

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('discountFormModal'));
  modal.hide();
});

formDiscountType?.addEventListener('change', () => {
  updateValueHelperByType();
});

function filterDiscounts() {
  const search = discountSearch.value.trim().toLowerCase();
  const type = discountTypeFilter.value;
  const status = discountStatusFilter.value;

  return discountsMock.filter((discount) => {
    const matchesSearch =
      !search ||
      discount.name.toLowerCase().includes(search) ||
      discount.code.toLowerCase().includes(search) ||
      discount.designaCode.toLowerCase().includes(search) ||
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
      <td>${discount.designaCode || '<span class="text-muted">Sin mapear</span>'}</td>
      <td>${renderTypeBadge(discount)}</td>
      <td>${discount.valueText}</td>
      <td>${renderBooleanBadge(discount.requiresAmount)}</td>
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
  totalDiscounts.textContent = String(discountsMock.length);
  activeDiscounts.textContent = String(discountsMock.filter((discount) => discount.status === 'active').length);
  amountRequiredDiscounts.textContent = String(discountsMock.filter((discount) => discount.requiresAmount).length);
  designaMappedDiscounts.textContent = String(discountsMock.filter((discount) => Boolean(discount.designaCode)).length);
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

function renderBooleanBadge(value) {
  if (value) {
    return '<span class="badge text-bg-warning">Sí</span>';
  }

  return '<span class="badge text-bg-light">No</span>';
}

function openDiscountFormModal(discount = null) {
  discountForm.reset();
  discountId.value = '';

  if (discount) {
    discountFormModalLabel.textContent = 'Editar descuento';
    discountId.value = discount.id;
    formDiscountName.value = discount.name;
    formDiscountCode.value = discount.code;
    formDesignaCode.value = discount.designaCode;
    formDiscountType.value = discount.type;
    formDiscountValue.value = discount.value;
    formDiscountStatus.value = discount.status;
    formRequiresAmount.checked = discount.requiresAmount;
    formRequiresConfirmation.checked = discount.requiresConfirmation;
    formDiscountDescription.value = discount.description;
  } else {
    discountFormModalLabel.textContent = 'Nuevo descuento';
    formDiscountStatus.value = 'active';
    formRequiresConfirmation.checked = true;
  }

  updateValueHelperByType();

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('discountFormModal'));
  modal.show();
}

function createDiscount() {
  const newDiscount = {
    id: getNextDiscountId(),
    name: formDiscountName.value.trim(),
    code: normalizeInternalCode(formDiscountCode.value),
    designaCode: formDesignaCode.value.trim(),
    type: formDiscountType.value,
    typeText: getTypeText(formDiscountType.value),
    value: Number(formDiscountValue.value),
    valueText: formatValue(formDiscountType.value, Number(formDiscountValue.value)),
    requiresAmount: formRequiresAmount.checked,
    requiresConfirmation: formRequiresConfirmation.checked,
    status: formDiscountStatus.value,
    statusText: getStatusText(formDiscountStatus.value),
    description: formDiscountDescription.value.trim() || 'Sin descripción registrada.',
  };

  discountsMock = [newDiscount, ...discountsMock];
}

function updateDiscount(id) {
  discountsMock = discountsMock.map((discount) => {
    if (discount.id !== id) {
      return discount;
    }

    return {
      ...discount,
      name: formDiscountName.value.trim(),
      code: normalizeInternalCode(formDiscountCode.value),
      designaCode: formDesignaCode.value.trim(),
      type: formDiscountType.value,
      typeText: getTypeText(formDiscountType.value),
      value: Number(formDiscountValue.value),
      valueText: formatValue(formDiscountType.value, Number(formDiscountValue.value)),
      requiresAmount: formRequiresAmount.checked,
      requiresConfirmation: formRequiresConfirmation.checked,
      status: formDiscountStatus.value,
      statusText: getStatusText(formDiscountStatus.value),
      description: formDiscountDescription.value.trim() || 'Sin descripción registrada.',
    };
  });
}

function toggleDiscountStatus(discount) {
  const newStatus = discount.status === 'active' ? 'inactive' : 'active';

  discountsMock = discountsMock.map((item) => {
    if (item.id !== discount.id) {
      return item;
    }

    return {
      ...item,
      status: newStatus,
      statusText: getStatusText(newStatus),
    };
  });

  currentResults = filterDiscounts();
  renderDiscounts(currentResults);

  showAlert(
    'success',
    `Descuento ${discount.name} ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente.`
  );
}

function showDiscountDetail(discount) {
  detailDiscountName.textContent = discount.name;
  detailDiscountCode.textContent = discount.code;
  detailDesignaCode.textContent = discount.designaCode || 'Sin mapear';
  detailDiscountType.textContent = discount.typeText;
  detailDiscountValue.textContent = discount.valueText;
  detailRequiresAmount.textContent = discount.requiresAmount ? 'Sí' : 'No';
  detailRequiresConfirmation.textContent = discount.requiresConfirmation ? 'Sí' : 'No';
  detailDiscountDescription.textContent = discount.description;

  detailDiscountStatus.textContent = discount.statusText;
  detailDiscountStatus.className = `badge ${discount.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`;

  const modal = window.bootstrap.Modal.getOrCreateInstance(document.getElementById('discountDetailModal'));
  modal.show();
}

function normalizeInternalCode(value) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

function getTypeText(type) {
  const typeMap = {
    time: 'Tiempo',
    percentage: 'Porcentaje',
    fixed_rate: 'Tarifa fija',
    courtesy: 'Cortesía',
  };

  return typeMap[type] || 'No definido';
}

function getStatusText(status) {
  if (status === 'active') {
    return 'Activo';
  }

  return 'Inactivo';
}

function formatValue(type, value) {
  if (type === 'time') {
    return `${value} min`;
  }

  if (type === 'percentage' || type === 'courtesy') {
    return `${value}%`;
  }

  if (type === 'fixed_rate') {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  }

  return String(value);
}

function updateValueHelperByType() {
  const helper = formDiscountValue?.nextElementSibling;

  if (!helper) {
    return;
  }

  const helperTextByType = {
    time: 'Captura minutos. Ejemplo: 120 para dos horas.',
    percentage: 'Captura porcentaje. Ejemplo: 50 para 50%.',
    fixed_rate: 'Captura monto final. Ejemplo: 25 para $25.00.',
    courtesy: 'Captura 100 para cortesía total.',
  };

  helper.textContent = helperTextByType[formDiscountType.value] || 'Ejemplo: minutos, porcentaje, monto fijo o 100 para cortesía.';
}

function getNextDiscountId() {
  return discountsMock.length ? Math.max(...discountsMock.map((discount) => discount.id)) + 1 : 1;
}

function showAlert(type, message) {
  discountsAlert.className = `alert alert-${type}`;
  discountsAlert.textContent = message;
}

function hideAlert() {
  discountsAlert.className = 'alert d-none';
  discountsAlert.textContent = '';
}