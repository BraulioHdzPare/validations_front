/** Adaptador entre la UI de descuentos y el backend de administración.
 *
 * Traduce entre la forma del backend (external_code/discount_type/is_active/
 * parking_sites/tenants) y la de la UI (externalCode/type/status/...).
 *
 * Nota de diseño: el portal NO guarda cuánto descuenta cada validación. Eso lo
 * define el sistema externo y se invoca con `external_code`. Aquí `type` es solo
 * una categoría de presentación.
 */
import { apiClient } from './api-client.js';
import { unwrap } from './lookups-api.js';

export const TYPE_LABELS = {
  time: 'Tiempo',
  percentage: 'Porcentaje',
  fixed_rate: 'Tarifa fija',
  courtesy: 'Cortesía',
};

export async function listDiscounts() {
  const data = await apiClient.get('/api/admin/validation-types/');
  return unwrap(data).map(toUiDiscount);
}

export async function createDiscount(uiDiscount) {
  const created = await apiClient.post('/api/admin/validation-types/', toApiDiscount(uiDiscount));
  return toUiDiscount(created);
}

export async function updateDiscount(id, uiDiscount) {
  const updated = await apiClient.patch(`/api/admin/validation-types/${id}/`, toApiDiscount(uiDiscount));
  return toUiDiscount(updated);
}

/** Borrado lógico: el backend traduce DELETE a is_active=false. */
export async function deactivateDiscount(id) {
  await apiClient.delete(`/api/admin/validation-types/${id}/`);
}

export async function reactivateDiscount(id) {
  const updated = await apiClient.patch(`/api/admin/validation-types/${id}/`, { is_active: true });
  return toUiDiscount(updated);
}

// ---------------------------------------------------------------------------
// Traductores backend <-> UI
// ---------------------------------------------------------------------------

function toUiDiscount(d) {
  return {
    id: d.id,
    name: d.name,
    code: d.code,
    externalCode: d.external_code ?? '',
    type: d.discount_type ?? '',
    typeText: TYPE_LABELS[d.discount_type] ?? 'No definido',
    description: d.description ?? '',
    parkingSiteIds: d.parking_sites ?? [],
    tenantIds: d.tenants ?? [],
    status: d.is_active ? 'active' : 'inactive',
    statusText: d.is_active ? 'Activo' : 'Inactivo',
  };
}

function toApiDiscount(ui) {
  return {
    name: ui.name,
    code: ui.code,
    external_code: ui.externalCode,
    discount_type: ui.type,
    description: ui.description,
    parking_sites: ui.parkingSiteIds,
    tenants: ui.tenantIds,
    is_active: ui.status === 'active',
  };
}
