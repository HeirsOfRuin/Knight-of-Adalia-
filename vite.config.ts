import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { fileURLToPath } from 'node:url';

// One config for every game: GAME=knight (the default) or GAME=house picks games/<game>/ as the
// root. Knight of Adalia builds to dist/, so it keeps its published URL; other games build beside it.
const game = process.env.GAME ?? 'knight';
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here(`./games/${game}`),
  base: './',
  // the shared engine (packages/engine); tsconfig.json maps the same alias for tsc and tsx
  resolve: { alias: { '@engine': here('./packages/engine/src'), '@dynasty': here('./packages/dynasty/src') } },
  plugins: [preact()],
  build: { outDir: here(game === 'knight' ? './dist' : `./dist/${game}`), emptyOutDir: game === 'knight' },
  // the installed app (GitHub Pages) registers a service worker; the claude.ai artifact build does not
  define: { __PWA__: JSON.stringify(process.env.VITE_PWA === '1'), __BUILD_ID__: JSON.stringify(String(Date.now())) },
});
