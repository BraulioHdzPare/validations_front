const tickets = {
  '123456': {
    ticketNumber: '123456',
    status: 'active',
    statusText: 'Activo',
    entryDate: '2026-05-05 10:35',
    rate: 'Tarifa normal',
    originalAmount: 80,
    currentAmount: 80,
  },
  '987654': {
    ticketNumber: '987654',
    status: 'paid',
    statusText: 'Pagado',
    entryDate: '2026-05-05 09:10',
    rate: 'Pagado',
    originalAmount: 60,
    currentAmount: 0,
  },
  '555000': {
    ticketNumber: '555000',
    status: 'error',
    statusText: 'Error',
    entryDate: '2026-05-05 08:50',
    rate: 'No disponible',
    originalAmount: 0,
    currentAmount: 0,
  },
};

const discounts = [
  {
    id: 'two_hours_free',
    name: '2 horas gratis',
    estimatedFinalAmount: 30,
  },
  {
    id: 'fifty_percent',
    name: '50% descuento',
    estimatedFinalAmount: 40,
  },
  {
    id: 'preferred_rate',
    name: 'Tarifa preferente',
    estimatedFinalAmount: 25,
  },
];

export async function searchTicket(ticketNumber) {
  await simulateDelay();

  const cleanTicketNumber = String(ticketNumber).trim();

  if (!cleanTicketNumber) {
    throw new Error('Ingresa un número de boleto.');
  }

  const ticket = tickets[cleanTicketNumber];

  if (!ticket) {
    return {
      found: false,
      message: 'No se encontró el boleto ingresado.',
    };
  }

  if (ticket.status === 'error') {
    throw new Error('No fue posible consultar el boleto en Designa.');
  }

  return {
    found: true,
    ticket,
    discounts: ticket.status === 'active' ? discounts : [],
  };
}

export async function applyValidation(ticketNumber, discountId) {
  await simulateDelay();

  const ticket = tickets[ticketNumber];
  const discount = discounts.find((item) => item.id === discountId);

  if (!ticket) {
    throw new Error('El boleto ya no está disponible.');
  }

  if (ticket.status !== 'active') {
    throw new Error('Solo se pueden validar boletos activos.');
  }

  if (!discount) {
    throw new Error('Selecciona una validación válida.');
  }

  return {
    success: true,
    message: 'Validación aplicada correctamente.',
    ticketNumber,
    discountName: discount.name,
    originalAmount: ticket.originalAmount,
    finalAmount: discount.estimatedFinalAmount,
    appliedAt: new Date().toISOString(),
  };
}

function simulateDelay() {
  return new Promise((resolve) => {
    setTimeout(resolve, 400);
  });
}