/** Escapa un valor para interpolarlo con seguridad dentro de HTML.
 *
 * Convierte los cinco metacaracteres de HTML en sus entidades, de modo que el
 * valor se trate como TEXTO y no como marcado. Cubre tanto contexto de texto
 * (`<td>${...}</td>`) como de atributo con comillas dobles o simples
 * (`value="${...}"`).
 *
 * **Úsalo siempre** que un valor proveniente del servidor o del usuario se
 * inyecte dentro de un template literal que termine en `innerHTML`. Lo que se
 * asigna con `.textContent` no lo necesita (el navegador ya no interpreta HTML).
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
