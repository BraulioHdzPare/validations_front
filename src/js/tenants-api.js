/** Adaptador entre la UI de locatarios y el backend de administración.
 *
 * Traduce entre la forma del backend (name/trade_name/is_active/parking_sites)
 * y la de la UI (businessName/commercialName/status/parkingSiteIds).
 *
 * Mapeo de nombres acordado:
 *   - "Nombre comercial" (UI) <-> `trade_name` (backend)
 *   - "Razón social"     (UI) <-> `name`       (backend)
 */
import { apiClient } from './api-client.js';
import { unwrap } from './lookups-api.js';

export async function listTenantsFull() {
  const data = await apiClient.get('/api/admin/tenants/');
  return unwrap(data).map(toUiTenant);
}

export async function createTenant(uiTenant) {
  const created = await apiClient.post('/api/admin/tenants/', toApiTenant(uiTenant));
  return toUiTenant(created);
}

export async function updateTenant(id, uiTenant) {
  const updated = await apiClient.patch(`/api/admin/tenants/${id}/`, toApiTenant(uiTenant));
  return toUiTenant(updated);
}

/** Borrado lógico: el backend traduce DELETE a is_active=false. */
export async function deactivateTenant(id) {
  await apiClient.delete(`/api/admin/tenants/${id}/`);
}

export async function reactivateTenant(id) {
  const updated = await apiClient.patch(`/api/admin/tenants/${id}/`, { is_active: true });
  return toUiTenant(updated);
}

// ---------------------------------------------------------------------------
// Traductores backend <-> UI
// ---------------------------------------------------------------------------

function toUiTenant(t) {
  return {
    id: t.id,
    commercialName: t.trade_name ?? '',
    businessName: t.name ?? '',
    description: t.description ?? '',
    parkingSiteIds: t.parking_sites ?? [],
    status: t.is_active ? 'active' : 'inactive',
    statusText: t.is_active ? 'Activo' : 'Inactivo',
  };
}

function toApiTenant(ui) {
  return {
    name: ui.businessName,
    trade_name: ui.commercialName,
    description: ui.description,
    parking_sites: ui.parkingSiteIds,
    is_active: ui.status === 'active',
  };
}
