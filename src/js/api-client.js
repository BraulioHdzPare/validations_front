import { getAccessToken, clearSession } from './auth.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

/**
 * Realiza una petición HTTP autenticada al backend.
 * - Agrega automáticamente el header Authorization: Bearer <token>
 * - Si el servidor responde 401, limpia la sesión y redirige al login
 * - Si la respuesta no es OK lanza un error con el mensaje del servidor
 */
async function request(method, path, body = null) {
  const token = getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  // Sesión expirada o token inválido → limpiar y redirigir
  if (response.status === 401) {
    clearSession();
    window.location.replace('login.html'); // Redirige a login
    return;
  }

  // Sin contenido (ej. logout 204)
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    // El backend puede devolver { detail: "..." } o { field: ["error"] }
    const message = extractErrorMessage(data);
    throw new Error(message);
  }

  return data;
}

function extractErrorMessage(data) {
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.non_field_errors) return data.non_field_errors[0];

  // Primer mensaje de cualquier campo con error
  const firstField = Object.values(data)[0];
  if (Array.isArray(firstField)) return firstField[0];

  return 'Ocurrió un error inesperado.';
}

export const apiClient = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};