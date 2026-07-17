/** Consultas de solo lectura compartidas entre las pantallas de administración.
 *
 * Sirven para poblar selectores (unidades, locatarios) y para derivar datos
 * que el backend no expone directamente (ej. los usuarios de cada locatario,
 * que es una relación inversa desde User.tenant).
 */
import { apiClient } from './api-client.js';

/** La API admin pagina: {count, results:[...]}. Toleramos ambas formas. */
export function unwrap(data) {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

export async function listTenants() {
  const data = await apiClient.get('/api/admin/tenants/');
  return unwrap(data).map((t) => ({ id: t.id, name: t.name }));
}

export async function listParkingSites() {
  const data = await apiClient.get('/api/admin/parking-sites/');
  return unwrap(data).map((p) => ({ id: p.id, name: p.name }));
}

/** Versión ligera de usuarios: solo lo necesario para agruparlos por locatario. */
export async function listUsersLite() {
  const data = await apiClient.get('/api/admin/users/');
  return unwrap(data).map((u) => ({
    id: u.id,
    username: u.username,
    tenantId: u.tenant ?? null,
  }));
}
