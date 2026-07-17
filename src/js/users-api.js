/** Adaptador entre la UI de usuarios y el backend de administración.
 *
 * Sigue el mismo patrón que parking-api.js: envuelve `apiClient` (que ya maneja
 * el JWT y los 401) y traduce entre la forma del backend
 * (first_name/last_name/is_active/tenant-id) y la forma que espera la UI
 * (firstName/lastName/status/tenantId).
 */
import { apiClient } from './api-client.js';
import { unwrap } from './lookups-api.js';

// ---------------------------------------------------------------------------
// CRUD de usuarios
// ---------------------------------------------------------------------------

export async function listUsers() {
  const data = await apiClient.get('/api/admin/users/');
  return unwrap(data).map(toUiUser);
}

export async function createUser(uiUser) {
  const created = await apiClient.post(
    '/api/admin/users/',
    toApiUser(uiUser, { includePassword: true }),
  );
  return toUiUser(created);
}

export async function updateUser(id, uiUser) {
  const updated = await apiClient.patch(
    `/api/admin/users/${id}/`,
    toApiUser(uiUser, { includePassword: Boolean(uiUser.password) }),
  );
  return toUiUser(updated);
}

/** Borrado lógico: el backend traduce DELETE a is_active=false. */
export async function deactivateUser(id) {
  await apiClient.delete(`/api/admin/users/${id}/`);
}

export async function reactivateUser(id) {
  const updated = await apiClient.patch(`/api/admin/users/${id}/`, { is_active: true });
  return toUiUser(updated);
}

export async function setUserPassword(id, password) {
  await apiClient.patch(`/api/admin/users/${id}/`, { password });
}

// ---------------------------------------------------------------------------
// Traductores backend <-> UI
// ---------------------------------------------------------------------------

function toUiUser(u) {
  const firstName = u.first_name ?? '';
  const lastName = u.last_name ?? '';

  return {
    id: u.id,
    username: u.username,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || u.username,
    email: u.email ?? '',
    role: u.role,
    roleText: u.role === 'admin' ? 'Administrador' : 'Locatario',
    tenantId: u.tenant ?? null,
    parkingSiteId: u.parking_site ?? null,
    status: u.is_active ? 'active' : 'inactive',
    statusText: u.is_active ? 'Activo' : 'Inactivo',
  };
}

function toApiUser(ui, { includePassword }) {
  const payload = {
    username: ui.username,
    first_name: ui.firstName,
    last_name: ui.lastName,
    email: ui.email,
    role: ui.role,
    tenant: ui.tenantId || null,
    parking_site: ui.parkingSiteId || null,
    is_active: ui.status === 'active',
  };

  if (includePassword && ui.password) {
    payload.password = ui.password;
  }

  return payload;
}
