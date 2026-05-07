// Mock de validaciones para pruebas
const validationsMock = [
  {
    id: 1,
    date: '2026-05-05 10:35',
    ticketNumber: '123456',
    tenant: 'Cine',
    user: 'usuario.cine01',
    discount: '2 horas gratis',
    originalAmount: 80,
    finalAmount: 30,
    status: 'success',
    statusText: 'Exitosa',
    message: 'Validación aplicada correctamente.',
    ip: '192.168.1.25',
    designaResponseId: 'DSG-20260505-0001',
  },
  {
    id: 2,
    date: '2026-05-05 10:22',
    ticketNumber: '987654',
    tenant: 'Gimnasio',
    user: 'usuario.gym01',
    discount: '50% descuento',
    originalAmount: 60,
    finalAmount: 30,
    status: 'success',
    statusText: 'Exitosa',
    message: 'Validación aplicada correctamente.',
    ip: '192.168.1.26',
    designaResponseId: 'DSG-20260505-0002',
  },
  {
    id: 3,
    date: '2026-05-05 09:58',
    ticketNumber: '778899',
    tenant: 'Restaurante',
    user: 'usuario.rest01',
    discount: 'Tarifa preferente',
    originalAmount: 95,
    finalAmount: 25,
    status: 'error',
    statusText: 'Error',
    message: 'No fue posible conectar con Designa.',
    ip: '192.168.1.27',
    designaResponseId: '-',
  },
  {
    id: 4,
    date: '2026-05-04 18:40',
    ticketNumber: '456789',
    tenant: 'Cine',
    user: 'usuario.cine02',
    discount: '2 horas gratis',
    originalAmount: 120,
    finalAmount: 70,
    status: 'success',
    statusText: 'Exitosa',
    message: 'Validación aplicada correctamente.',
    ip: '192.168.1.28',
    designaResponseId: 'DSG-20260504-0009',
  },
  {
    id: 5,
    date: '2026-05-04 17:05',
    ticketNumber: '112233',
    tenant: 'Empresa X',
    user: 'empresa.x01',
    discount: 'Cortesía total',
    originalAmount: 140,
    finalAmount: 0,
    status: 'rejected',
    statusText: 'Rechazada',
    message: 'El usuario no tiene permiso para aplicar esta validación.',
    ip: '192.168.1.29',
    designaResponseId: '-',
  },
];

// Elementos del DOM
const totalValidations = document.getElementById('totalValidations');
const totalOriginalAmount = document.getElementById('totalOriginalAmount');
const totalFinalAmount = document.getElementById('totalFinalAmount');
const totalDiscountAmount = document.getElementById('totalDiscountAmount');

const reportsFilterForm = document.getElementById('reportsFilterForm');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const exportButton = document.getElementById('exportButton');

const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const tenantFilter = document.getElementById('tenantFilter');
const discountFilter = document.getElementById('discountFilter');
const statusFilter = document.getElementById('statusFilter');
const ticketSearch = document.getElementById('ticketSearch');

const reportsAlert = document.getElementById('reportsAlert');
const resultCountBadge = document.getElementById('resultCountBadge');

const reportsTableBody = document.getElementById('reportsTableBody');

const detailDate = document.getElementById('detailDate');
const detailTicket = document.getElementById('detailTicket');
const detailStatus = document.getElementById('detailStatus');
const detailTenant = document.getElementById('detailTenant');
const detailUser = document.getElementById('detailUser');
const detailDiscount = document.getElementById('detailDiscount');
const detailOriginalAmount = document.getElementById('detailOriginalAmount');
const detailFinalAmount = document.getElementById('detailFinalAmount');
const detailDiscountAmount = document.getElementById('detailDiscountAmount');
const detailMessage = document.getElementById('detailMessage');
const detailIp = document.getElementById('detailIp');
const detailDesignaResponseId = document.getElementById('detailDesignaResponseId');

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

let currentResults = [...validationsMock];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  loadFilterOptions();
  renderReports(validationsMock);
});

// Actualización de resultados al aplicar filtros
reportsFilterForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const start = startDate.value;
  const end = endDate.value;

  if (!isValidDateRange(start, end)) {
    showAlert('danger', 'La fecha y hora de inicio no puede ser mayor que la fecha y hora final.');
    return;
  }

  currentResults = filterReports();
  renderReports(currentResults);

  if (currentResults.length === 0) {
    showAlert('warning', 'No se encontraron validaciones con los filtros seleccionados.');
  } else {
    hideAlert();
  }
});

// Limpieza de filtros y resultados
clearFiltersButton?.addEventListener('click', () => {
  reportsFilterForm?.reset();
  currentResults = [...validationsMock];
  renderReports(currentResults);
  hideAlert();
});

// Simulación de exportación de resultados
exportButton?.addEventListener('click', () => {
  if (currentResults.length === 0) {
    showAlert('warning', 'No hay registros para exportar.');
    return;
  }

  showAlert('success', `Exportación simulada: ${currentResults.length} registro(s) preparados.`);
});

// Manejo de clics en botones de detalle
reportsTableBody?.addEventListener('click', (event) => {
  const detailButton = event.target.closest('[data-action="view-detail"]');

  if (!detailButton) {
    return;
  }

  const validationId = Number(detailButton.dataset.id);
  const validation = validationsMock.find((item) => item.id === validationId);

  if (!validation) {
    showAlert('danger', 'No se encontró el detalle de la validación.');
    return;
  }

  showValidationDetail(validation);
});

// Funcion para cargar las opciones de filtro dinámicamente en locatario y descuento
function loadFilterOptions() {
  const tenants = getUniqueValues(validationsMock, 'tenant');
  const discounts = getUniqueValues(validationsMock, 'discount');

  renderSelectOptions(tenantFilter, tenants);
  renderSelectOptions(discountFilter, discounts);
}

// Función para renderizar opciones de filtro dinámicamente
function renderSelectOptions(selectElement, values) {
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

// Función para obtener valores únicos de un array de objetos (idel para cargar filtros dinámicos)
function getUniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]))].sort();
}

// Función para filtrar los reportes según los criterios seleccionados
function filterReports() {
  const start = startDate.value;
  const end = endDate.value;
  const tenant = tenantFilter.value;
  const discount = discountFilter.value;
  const status = statusFilter.value;
  const ticket = ticketSearch.value.trim().toLowerCase();

  if (!isValidDateRange(start, end)) {
    showAlert('danger', 'La fecha y hora de inicio no puede ser mayor que la fecha y hora final.');
    return currentResults;
  }

  return validationsMock.filter((item) => {
    const itemDate = normalizeReportDate(item.date);

    const matchesStartDate = !start || itemDate >= start;
    const matchesEndDate = !end || itemDate <= end;
    const matchesTenant = !tenant || item.tenant === tenant;
    const matchesDiscount = !discount || item.discount === discount;
    const matchesStatus = !status || item.status === status;
    const matchesTicket = !ticket || item.ticketNumber.toLowerCase().includes(ticket);

    return (
      matchesStartDate &&
      matchesEndDate &&
      matchesTenant &&
      matchesDiscount &&
      matchesStatus &&
      matchesTicket
    );
  });
}

// Función para renderizar los reportes en la tabla
function renderReports(items) {
  updateSummary(items);
  updateResultCount(items.length);

  if (items.length === 0) {
    reportsTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center text-muted py-4">
          No hay registros para mostrar.
        </td>
      </tr>
    `;
    return;
  }

  reportsTableBody.innerHTML = items.map((item) => `
    <tr>
      <td>${item.date}</td>
      <td><strong>${item.ticketNumber}</strong></td>
      <td>${item.tenant}</td>
      <td>${item.user}</td>
      <td>${item.discount}</td>
      <td>${currencyFormatter.format(item.originalAmount)}</td>
      <td>${currencyFormatter.format(item.finalAmount)}</td>
      <td>${renderStatusBadge(item)}</td>
      <td class="text-end">
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          data-action="view-detail"
          data-id="${item.id}"
        >
          <i class="bi bi-eye"></i>
          Ver
        </button>
      </td>
    </tr>
  `).join('');
}

// Funcion para actualizar el resumen de estadísticas generales
function updateSummary(items) {
  const { originalTotal, finalTotal } = items.reduce((acc, item) => {
  acc.originalTotal += item.originalAmount;
  acc.finalTotal += item.finalAmount;
  return acc;
    }, { originalTotal: 0, finalTotal: 0 });
  const discountTotal = originalTotal - finalTotal;

  totalValidations.textContent = String(items.length);
  totalOriginalAmount.textContent = currencyFormatter.format(originalTotal);
  totalFinalAmount.textContent = currencyFormatter.format(finalTotal);
  totalDiscountAmount.textContent = currencyFormatter.format(discountTotal);
}

// Función para actualizar el contador de resultados encontrados
function updateResultCount(count) {
  resultCountBadge.textContent = `${count} registro${count === 1 ? '' : 's'}`;
}

// Funcion para renderizar el estado con estilos dinámicos
function renderStatusBadge(item) {
  const className = getStatusBadgeClass(item.status);

  return `<span class="badge ${className}">${item.statusText}</span>`;
}

// Función para obtener la clase de badge según el estado
function getStatusBadgeClass(status) {
  if (status === 'success') {
    return 'text-bg-success';
  }

  if (status === 'error') {
    return 'text-bg-danger';
  }

  if (status === 'rejected') {
    return 'text-bg-warning';
  }

  return 'text-bg-secondary';
}

// Función para mostrar el detalle de una validación en un modal
function showValidationDetail(validation) {
  const discountAmount = validation.originalAmount - validation.finalAmount;

  detailDate.textContent = validation.date;
  detailTicket.textContent = validation.ticketNumber;
  detailTenant.textContent = validation.tenant;
  detailUser.textContent = validation.user;
  detailDiscount.textContent = validation.discount;
  detailOriginalAmount.textContent = currencyFormatter.format(validation.originalAmount);
  detailFinalAmount.textContent = currencyFormatter.format(validation.finalAmount);
  detailDiscountAmount.textContent = currencyFormatter.format(discountAmount);
  detailMessage.textContent = validation.message;
  detailIp.textContent = validation.ip;
  detailDesignaResponseId.textContent = validation.designaResponseId;

  detailStatus.textContent = validation.statusText;
  detailStatus.className = `badge ${getStatusBadgeClass(validation.status)}`;

  const modalElement = document.getElementById('validationDetailModal');
  const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
  modal.show();
}

// Funciones para mostrar alertas
function showAlert(type, message) {
  reportsAlert.className = `alert alert-${type}`;
  reportsAlert.textContent = message;
}

// Función para ocultar alertas
function hideAlert() {
  reportsAlert.className = 'alert d-none';
  reportsAlert.textContent = '';
}

// Función para validar que el rango de fechas sea correcto
function isValidDateRange(start, end) {
  if (!start || !end) {
    return true;
  }

  return start <= end;
}

// Función para normalizar el formato de fecha de los reportes (reemplaza espacio por T para comparaciones)
function normalizeReportDate(dateText) {
  return dateText.replace(' ', 'T');
}