import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  // the shared engine (packages/engine); tsconfig.json maps the same alias for tsc and tsx
  resolve: { alias: { '@engine': fileURLToPath(new URL('./packages/engine/src', import.meta.url)) } },
  plugins: [preact()],
  // the installed app (GitHub Pages) registers a service worker; the claude.ai artifact build does not
  define: { __PWA__: JSON.stringify(process.env.VITE_PWA === '1'), __BUILD_ID__: JSON.stringify(String(Date.now())) },
  test: { include: ['tests/**/*.test.ts'] },
} as never);
