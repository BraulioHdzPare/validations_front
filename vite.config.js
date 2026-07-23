import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Portal multipágina (MPA): por defecto Vite toma solo index.html como entrada,
// así que `vite build` dejaba fuera el resto de las páginas y su JS/CSS. Aquí se
// declara CADA página HTML como entrada de Rollup para que el build empaquete el
// portal completo; los chunks comunes (Bootstrap, api-client, auth…) se comparten
// automáticamente entre páginas.
const pages = [
  'index',
  'login',
  'dashboard',
  'validation-ticket',
  'reports',
  'users',
  'tenants',
  'discounts',
];

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((name) => [name, resolve(__dirname, `${name}.html`)]),
      ),
    },
  },
});
