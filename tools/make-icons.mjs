// Renders the app icons (public/icons) from an inline SVG with the preinstalled Chromium. Run: node tools/make-icons.mjs
import { chromium } from 'playwright';
const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#1d1a16"/>
<g transform="translate(${pad} ${pad}) scale(${(512 - 2 * pad) / 512})">
<path d="M96 64h320v192c0 110-160 192-160 192S96 366 96 256z" fill="#7a2e1d" stroke="#d8c39a" stroke-width="18"/>
<path d="M256 120v272M176 200h160" stroke="#d8c39a" stroke-width="26" stroke-linecap="round"/>
</g></svg>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const p = await b.newPage();
for (const [name, size, pad] of [['icon-192.png', 192, 40], ['icon-512.png', 512, 40], ['maskable-512.png', 512, 110], ['apple-touch-icon.png', 180, 40]]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<html><body style="margin:0">${svg(pad).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await p.screenshot({ path: `public/icons/${name}`, omitBackground: false });
}
await b.close();
