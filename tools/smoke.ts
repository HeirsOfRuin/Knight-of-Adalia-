// Browser smoke test against the built site: npm run build && npm run smoke
// Plays a few choices, opens panels, exports a save, reloads, re-imports it
// and checks the state matches. Writes screenshots to ./smoke-out/.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '..', 'smoke-out');
mkdirSync(OUT, { recursive: true });
const server = await preview({ preview: { port: 0, strictPort: false }, logLevel: 'silent' });
const addr = server.httpServer.address();
if (!addr || typeof addr !== 'object') throw new Error('no preview port');
const PORT = addr.port;

const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const fail = (m: string) => { throw new Error(m); };
// Click through any Continue page breaks so the scene's choices are showing.
async function readAll(page: import('playwright').Page) {
  for (let i = 0; i < 10; i++) {
    const cont = page.getByRole('button', { name: 'Continue', exact: true });
    if (!(await cont.count())) return;
    await cont.first().click();
  }
}
const errors: string[] = [];
try {
  for (const [label, viewport] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 900 }]] as const) {
    const ctx = await browser.newContext({ viewport, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label}: ${m.text()}`); });
    await page.goto(`http://localhost:${PORT}/`);
    await page.screenshot({ path: join(OUT, `${label}-1-title.png`) });

    await page.getByRole('button', { name: 'New life' }).click();
    await page.getByRole('radio', { name: /Reeve's son/ }).click();
    await page.screenshot({ path: join(OUT, `${label}-2-newgame.png`), fullPage: true });
    await page.getByRole('button', { name: 'Begin' }).click();
    await page.getByRole('heading', { name: 'Lady Day Reckoning' }).waitFor();
    await readAll(page);
    await page.screenshot({ path: join(OUT, `${label}-3-scene.png`), fullPage: true });

    // Copy the tallies (no check), then share bread in the wet year.
    await page.getByRole('button', { name: /Copy the tallies/ }).click();
    await page.getByRole('heading', { name: 'The Wet Year' }).waitFor();
    await readAll(page);
    await page.screenshot({ path: join(OUT, `${label}-4-after-choice.png`), fullPage: true });
    await page.getByRole('button', { name: /Take your share of the bread/ }).click();
    await page.getByRole('heading', { name: 'What a Boy Learns' }).waitFor();

    await page.getByRole('button', { name: 'People' }).click();
    await page.getByRole('heading', { name: 'People' }).waitFor();
    await page.screenshot({ path: join(OUT, `${label}-5b-people.png`), fullPage: true });
    await page.getByRole('button', { name: 'World' }).click();
    await page.screenshot({ path: join(OUT, `${label}-5c-world.png`), fullPage: true });
    await page.getByRole('button', { name: 'Status' }).click();
    await page.screenshot({ path: join(OUT, `${label}-5-status.png`), fullPage: true });
    await page.getByRole('button', { name: 'Journal' }).click();
    const entries = await page.locator('.journal-list > li').count();
    if (entries < 2) fail(`${label}: expected 2+ journal entries, got ${entries}`);
    await page.screenshot({ path: join(OUT, `${label}-6-journal.png`), fullPage: true });

    // Export, then reload and continue from autosave, then import the export.
    await page.getByRole('button', { name: 'Menu' }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download save file' }).click()]);
    const savePath = join(OUT, `${label}-save.json`);
    await download.saveAs(savePath);
    const exported = JSON.parse(readFileSync(savePath, 'utf8'));
    if (exported.state.scene !== 'p_learning') fail(`${label}: exported save at ${exported.state.scene}`);

    await page.reload();
    await page.getByRole('button', { name: /Continue/ }).click();
    await page.getByRole('heading', { name: 'What a Boy Learns' }).waitFor();
    await readAll(page);
    await page.locator('.choice:not([disabled])').first().click(); // advance past the export point
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('.menu input[type=file]').setInputFiles(savePath);
    await page.getByRole('heading', { name: 'What a Boy Learns' }).waitFor();
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('knight-of-adalia.autosave.v1')!).state);
    if (JSON.stringify(restored) !== JSON.stringify(exported.state)) fail(`${label}: imported state differs from export`);

    // Debug drawer
    await page.keyboard.press('Control+Shift+D');
    await page.getByText('Force next check').waitFor();
    await page.screenshot({ path: join(OUT, `${label}-7-debug.png`), fullPage: false });

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) fail(`${label}: horizontal overflow`);
    console.log(`${label}: ok (${entries} journal entries, save round-trip matched)`);
    await ctx.close();
  }
  if (errors.length) fail(`console errors:\n${errors.join('\n')}`);
  console.log('smoke: PASS');
} finally {
  await browser.close();
  await server.close();
}
