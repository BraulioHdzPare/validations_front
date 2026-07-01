/** Este modulo se encarga de interactuar con la API de estacionamiento
 * para buscar boletos y aplicar validaciones. Mantiene la misma firma que mock-api.js
 * para que validation.js no tenga que cambiar al pasar de mock a real API.
 */

import { apiClient } from './api-client.js';
import { getSession } from './auth.js';

/**
 * Busca un boleto en el sistema externo de estacionamiento.
 * Mantiene la misma firma que mock-api.js para que validation.js no cambie.
 *
 * @param {string} ticketNumber
 * @returns {{ found: boolean, ticket?: object, discounts?: object[], message?: string }}
 */
export async function searchTicket(ticketNumber) {
  const session = getSession();
  const parkingSiteId = session?.parkingSiteId ?? null;

  if (!parkingSiteId) {
    throw new Error('No tienes una unidad de estacionamiento asignada. Contacta al administrador.');
  }

  const data = await apiClient.post('/api/validations/tickets/lookup/', {
    ticket_number: ticketNumber,
    parking_site_id: parkingSiteId,
  });

  if (!data.ticket) {
    return { found: false, message: 'No se encontró el boleto ingresado.' };
  }

  return {
    found: true,
    ticket: {
      ticketNumber: data.ticket.ticket_number,
      status: data.ticket.status,
      statusText: statusLabel(data.ticket.status),
      entryDate: formatDateTime(data.ticket.entry_datetime),
      rate: data.ticket.currency ?? 'MXN',
      originalAmount: data.ticket.current_amount,
      currentAmount: data.ticket.current_amount,
    },
    discounts: (data.validation_options ?? []).map((opt) => ({
      id: String(opt.code),
      name: opt.name,
      estimatedFinalAmount: 0, // El monto final real lo calcula el backend al aplicar
    })),
  };
}

/**
 * Aplica una validación a un boleto.
 * Mantiene la misma firma que mock-api.js.
 *
 * @param {string} ticketNumber
 * @param {string} discountId  - code del ValidationType
 * @returns {{ success: boolean, message: string, finalAmount: number }}
 */
export async function applyValidation(ticketNumber, discountId) {
  const session = getSession();
  const parkingSiteId = session?.parkingSiteId ?? null;

  if (!parkingSiteId) {
    console.error('Intento de aplicar validación sin parkingSiteId en sesión');
    throw new Error('No tienes una unidad de estacionamiento asignada.');
  }

  const data = await apiClient.post('/api/validations/apply/', {
    ticket_number: ticketNumber,
    validation_code: discountId,
    parking_site_id: parkingSiteId,
  });

  return {
    success: data.success,
    message: data.message ?? 'Validación aplicada correctamente.',
    ticketNumber,
    finalAmount: data.final_amount ?? 0,
    originalAmount: data.original_amount ?? 0,
    appliedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status) {
  const labels = {
    active: 'Activo',
    paid: 'Pagado',
    cancelled: 'Cancelado',
    expired: 'Expirado',
  };
  return labels[status] ?? status;
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
