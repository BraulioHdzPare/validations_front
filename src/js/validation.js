import { searchTicket, applyValidation } from './parking-api.js';
import { getSession, isAdmin } from './auth.js';

const ticketSearchForm = document.getElementById('ticketSearchForm');
const ticketNumberInput = document.getElementById('ticketNumber');
const ticketAlert = document.getElementById('ticketAlert');
const ticketResult = document.getElementById('ticketResult');

const ticketStatusBadge = document.getElementById('ticketStatusBadge');
const resultTicketNumber = document.getElementById('resultTicketNumber');
const resultEntryDate = document.getElementById('resultEntryDate');
const resultRate = document.getElementById('resultRate');
const resultOriginalAmount = document.getElementById('resultOriginalAmount');
const resultCurrentAmount = document.getElementById('resultCurrentAmount');

const discountType = document.getElementById('discountType');
const clearTicketButton = document.getElementById('clearTicketButton');
const openConfirmModalButton = document.getElementById('openConfirmModalButton');
const confirmValidationButton = document.getElementById('confirmValidationButton');

const modalTicketNumber = document.getElementById('modalTicketNumber');
const modalDiscountName = document.getElementById('modalDiscountName');
const modalCurrentAmount = document.getElementById('modalCurrentAmount');
const modalFinalAmount = document.getElementById('modalFinalAmount');

const testTicketButtons = document.querySelectorAll('.test-ticket-btn');

let currentTicket = null;
let availableDiscounts = [];

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

ticketNumberInput?.focus();

ticketSearchForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const ticketNumber = ticketNumberInput.value.trim();
  const submitButton = ticketSearchForm.querySelector('button[type="submit"]');

  resetResult();
  showAlert('info', 'Consultando boleto...');

  submitButton.disabled = true;

  try {
    const response = await searchTicket(ticketNumber);

    if (!response.found) {
      showAlert('warning', response.message);
      return;
    }

    currentTicket = response.ticket;

    // Los administradores ven todos los descuentos disponibles.
    // Los locatarios solo ven los que tienen asignados en su perfil.
    const session = getSession();
    availableDiscounts = (isAdmin(session) || !session?.permissions)
      ? response.discounts
      : response.discounts.filter((d) => session.permissions.includes(d.id));

    renderTicket(currentTicket);
    renderDiscounts(availableDiscounts);

    if (currentTicket.status !== 'active') {
      showAlert('warning', 'El boleto fue encontrado, pero no está activo para validación.');
      openConfirmModalButton.disabled = true;
      return;
    }

    showAlert('success', 'Boleto encontrado correctamente.');
  } catch (error) {
    showAlert('danger', error.message || 'Ocurrió un error al consultar el boleto.');
  } finally {
    submitButton.disabled = false;
  }
});

discountType?.addEventListener('change', () => {
  openConfirmModalButton.disabled = !discountType.value;
});

openConfirmModalButton?.addEventListener('click', () => {
  const selectedDiscount = getSelectedDiscount();

  if (!currentTicket || !selectedDiscount) {
    showAlert('warning', 'Selecciona un boleto y una validación.');
    return;
  }

  modalTicketNumber.textContent = currentTicket.ticketNumber;
  modalDiscountName.textContent = selectedDiscount.name;
  modalCurrentAmount.textContent = currencyFormatter.format(currentTicket.currentAmount);
  modalFinalAmount.textContent = currencyFormatter.format(selectedDiscount.estimatedFinalAmount);

  const modalElement = document.getElementById('confirmValidationModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  modal.show();
});

confirmValidationButton?.addEventListener('click', async () => {
  const selectedDiscount = getSelectedDiscount();

  if (!currentTicket || !selectedDiscount) {
    showAlert('warning', 'No hay datos suficientes para aplicar la validación.');
    return;
  }

  confirmValidationButton.disabled = true;
  confirmValidationButton.textContent = 'Aplicando...';

  try {
    const response = await applyValidation(currentTicket.ticketNumber, selectedDiscount.id);

    const modalElement = document.getElementById('confirmValidationModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.hide();

    showAlert(
      'success',
      `${response.message} Monto final estimado: ${currencyFormatter.format(response.finalAmount)}.`
    );

    openConfirmModalButton.disabled = true;
    discountType.disabled = true;
  } catch (error) {
    showAlert('danger', error.message || 'No fue posible aplicar la validación.');
  } finally {
    confirmValidationButton.disabled = false;
    confirmValidationButton.textContent = 'Confirmar validación';
  }
});

clearTicketButton?.addEventListener('click', () => {
  ticketNumberInput.value = '';
  resetResult();
  hideAlert();
  ticketNumberInput.focus();
});

testTicketButtons.forEach((button) => {
  button.addEventListener('click', () => {
    ticketNumberInput.value = button.dataset.ticket;
    ticketSearchForm.requestSubmit();
  });
});

function renderTicket(ticket) {
  ticketResult.classList.remove('d-none');

  resultTicketNumber.textContent = ticket.ticketNumber;
  resultEntryDate.textContent = ticket.entryDate;
  resultRate.textContent = ticket.rate;
  resultOriginalAmount.textContent = currencyFormatter.format(ticket.originalAmount);
  resultCurrentAmount.textContent = currencyFormatter.format(ticket.currentAmount);

  ticketStatusBadge.textContent = ticket.statusText;
  ticketStatusBadge.className = 'badge align-self-start';

  if (ticket.status === 'active') {
    ticketStatusBadge.classList.add('text-bg-success');
  } else if (ticket.status === 'paid') {
    ticketStatusBadge.classList.add('text-bg-secondary');
  } else {
    ticketStatusBadge.classList.add('text-bg-danger');
  }
}

function renderDiscounts(discounts) {
  discountType.innerHTML = '<option value="">Selecciona una validación</option>';

  discounts.forEach((discount) => {
    const option = document.createElement('option');
    option.value = discount.id;
    option.textContent = `${discount.name} - Final estimado ${currencyFormatter.format(discount.estimatedFinalAmount)}`;
    discountType.appendChild(option);
  });

  discountType.disabled = discounts.length === 0;
  openConfirmModalButton.disabled = true;
}

function getSelectedDiscount() {
  return availableDiscounts.find((discount) => discount.id === discountType.value);
}

function resetResult() {
  currentTicket = null;
  availableDiscounts = [];

  ticketResult.classList.add('d-none');
  discountType.innerHTML = '<option value="">Selecciona una validación</option>';
  discountType.disabled = false;
  openConfirmModalButton.disabled = true;
}

function showAlert(type, message) {
  ticketAlert.className = `alert alert-${type}`;
  ticketAlert.textContent = message;
}

function hideAlert() {
  ticketAlert.className = 'alert d-none';
  ticketAlert.textContent = '';
}