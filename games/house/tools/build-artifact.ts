// Packs dist/house/ into one self-contained HTML fragment for hosting as a claude.ai Artifact
// (the host supplies <html>/<head>/<body>): the playtest link. Run: npm run house:build:artifact
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', '..', '..');
const dist = join(root, 'dist', 'house');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const js = [...html.matchAll(/<script[^>]*src="\.?\/?([^"]+)"[^>]*><\/script>/g)].map((m) => readFileSync(join(dist, m[1]!), 'utf8'));
const css = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="\.?\/?([^"]+)"[^>]*>/g)].map((m) => readFileSync(join(dist, m[1]!), 'utf8'));
if (!js.length) throw new Error('no script found in dist/house/index.html; run npm run house:build first');

const safe = (s: string) => s.replace(/<\/script/gi, '<\\/script');
const out = [
  '<title>House of Adalia</title>',
  `<style>${css.join('\n')}</style>`,
  '<div id="app"></div>',
  `<script type="module">${safe(js.join('\n'))}</script>`,
  '',
].join('\n');
mkdirSync(join(root, 'dist-artifact'), { recursive: true });
const file = join(root, 'dist-artifact', 'house-of-adalia.html');
writeFileSync(file, out);
console.log(`wrote ${file} (${(out.length / 1024).toFixed(0)} KB)`);
