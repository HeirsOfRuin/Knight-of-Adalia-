// Draws the world's terrain into content/map/world.txt: one character per tile.
// The shapes below are the source of truth; the noise makes coasts and borders ragged.
// Run after changing a shape: npx tsx tools/make-map.ts   (then npm run content)
//
//   ~ deep sea   - shallow sea   . lowland   , farmland   f forest   h hills
//   M mountains   w marsh   r river   = salt pans   l lake
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const W = 160;
export const H = 120;
type Pt = [number, number];

// ---- deterministic value noise -------------------------------------------------
function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number, scale: number, s: number): number {
  const fx = x / scale, fy = y / scale;
  const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const sm = (t: number) => t * t * (3 - 2 * t);
  const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s);
  const top = a + (b - a) * sm(tx), bot = c + (d - c) * sm(tx);
  return top + (bot - top) * sm(ty);
}
/** fractal noise in -1..1 */
function fbm(x: number, y: number, s: number): number {
  return (noise(x, y, 9, s) - 0.5) * 1.2 + (noise(x, y, 4, s + 7) - 0.5) * 0.6 + (noise(x, y, 2, s + 13) - 0.5) * 0.3;
}

function inside(p: Pt, poly: Pt[]): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!, [xj, yj] = poly[j]!;
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
/** a ragged shape: the tile is tested at a point pushed about by noise */
function ragged(x: number, y: number, poly: Pt[], amp: number, seed: number): boolean {
  return inside([x + 0.5 + fbm(x, y, seed) * amp, y + 0.5 + fbm(x, y, seed + 31) * amp], poly);
}

// ---- the world ------------------------------------------------------------------
// The island: Caldmoor in the north, the March across its waist, Adalia in the south.
const ISLAND: Pt[] = [[14, 6], [26, 3], [40, 4], [50, 9], [52, 18], [47, 24], [55, 30], [58, 40], [57, 50], [52, 57], [40, 60], [28, 59], [17, 57], [9, 50], [8, 40], [12, 32], [9, 24], [10, 14]];
// Valdrenne and its neighbours: one continent from the Armance to Hroswald.
const MAINLAND: Pt[] = [[36, 69], [44, 66], [54, 66], [66, 64], [80, 63], [96, 62], [112, 60], [130, 58], [150, 56], [160, 56], [160, 112], [140, 113], [124, 115], [110, 116], [96, 117], [82, 117], [68, 114], [52, 112], [40, 106], [34, 98], [34, 90], [36, 84], [34, 76]];
// The Armance: a fist of land sticking out into the sea, west of the mainland.
const ARMANCE: Pt[] = [[36, 72], [28, 70], [18, 71], [9, 75], [7, 81], [11, 88], [20, 91], [30, 90], [37, 86]];
// Sauvemer's spit, between the sea and the salt marshes.
const SPIT: Pt[] = [[42, 66], [47, 64.5], [48, 66.5], [44, 68]];

const MOUNTAINS: Pt[][] = [
  [[18, 7], [30, 5], [40, 8], [42, 15], [33, 19], [20, 18]], // the Caldmoor highlands
  [[132, 62], [150, 60], [158, 70], [156, 92], [144, 98], [136, 86], [134, 72]], // Hroswald
  [[70, 104], [88, 102], [104, 104], [100, 110], [80, 111]], // the hills above Sarenza's coast
];
const HILLS: Pt[][] = [
  [[14, 20], [42, 18], [46, 24], [16, 28]], // the March
  [[16, 78], [30, 76], [32, 86], [18, 88]], // the Armance hills (Kerval)
  [[54, 82], [68, 80], [70, 90], [56, 92]], // Mortefontaine's ridge
  [[118, 64], [132, 62], [134, 80], [120, 82]], // the Vervais uplands
];
const FORESTS: Pt[][] = [
  [[20, 40], [30, 38], [32, 46], [22, 48]], // the Ravell chase
  [[44, 30], [54, 32], [52, 38], [44, 37]], // the northern woods by Carrow
  [[138, 88], [156, 86], [158, 108], [142, 108]], // Hroswald's forest
  [[86, 70], [100, 68], [102, 78], [88, 80]], // the woods of the Lisonne
  [[38, 92], [48, 90], [50, 100], [40, 102]], // the southern West
];
const MARSHES: Pt[][] = [
  [[44, 69], [56, 68], [56, 76], [46, 76]], // Les Salines and the Sauvemer marsh
  [[30, 92], [38, 92], [40, 100], [32, 100]], // Quérec's southern marsh
  [[48, 54], [56, 52], [56, 57], [50, 58]], // the Saltmarsh coast
];
const SALT: Pt[][] = [[[45, 70], [50, 69.5], [50, 72], [46, 72.5]]];
const FARMS: Pt[][] = [
  [[22, 44], [44, 42], [50, 52], [30, 56], [20, 52]], // the south midlands round Wendham
  [[60, 90], [110, 86], [116, 100], [64, 104]], // the Midi
  [[66, 66], [84, 66], [86, 76], [68, 78]], // the road east past Vaudrey
];
const RIVERS: Pt[][] = [
  [[12, 26], [24, 25], [36, 24], [48, 23], [52, 21]], // the Leven, the border river
  [[40, 36], [46, 40], [50, 44], [55, 46], [58, 46]], // Wendmere's tidal river
  [[62, 77], [60, 72], [58, 66]], // the Vaudrey river, with the Pont-aux-Moines on it
  [[100, 92], [99, 82], [98, 72], [97, 62]], // the Lisonne
  [[80, 84], [80, 76], [79, 64]], // the Aube, crossed at Grisolles
  [[60, 100], [72, 96], [84, 94], [96, 96], [110, 100], [120, 112]], // Cordelle's great river, to the southern sea
];

function draw(): string[][] {
  const g: string[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => '~'));
  const land = (x: number, y: number) =>
    ragged(x, y, ISLAND, 3.6, 1) || ragged(x, y, MAINLAND, 4.2, 2) || ragged(x, y, ARMANCE, 3.4, 3) || inside([x + 0.5, y + 0.5], SPIT);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (land(x, y)) g[y]![x] = '.';
  const paint = (polys: Pt[][], ch: string, amp: number, seed: number) => {
    for (const [i, p] of polys.entries()) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y]![x] !== '~' && g[y]![x] !== '-' && ragged(x, y, p, amp, seed + i * 5)) g[y]![x] = ch;
    }
  };
  // scattered woods and hills across the open country, and a few lakes
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y]![x] !== '.') continue;
    if (noise(x, y, 5, 200) > 0.72) g[y]![x] = 'f';
    else if (noise(x, y, 6, 210) > 0.76) g[y]![x] = 'h';
    else if (noise(x, y, 3, 220) > 0.95) g[y]![x] = 'l';
  }
  paint(FARMS, ',', 2.0, 40);
  paint(HILLS, 'h', 2.2, 50);
  paint(FORESTS, 'f', 2.0, 60);
  paint(MOUNTAINS, 'M', 2.4, 70);
  paint(MARSHES, 'w', 1.6, 80);
  paint(SALT, '=', 0.8, 90);
  // rivers: a line between the points, meandering a little, until it meets the sea
  for (const [i, r] of RIVERS.entries()) {
    for (let k = 0; k < r.length - 1; k++) {
      const [x0, y0] = r[k]!, [x1, y1] = r[k + 1]!;
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2);
      for (let t = 0; t <= n; t++) {
        const f = t / n;
        const x = Math.round(x0 + (x1 - x0) * f + fbm(t, k, 100 + i) * 0.8);
        const y = Math.round(y0 + (y1 - y0) * f + fbm(k, t, 120 + i) * 0.8);
        if (g[y]?.[x] !== undefined && g[y]![x] !== '~' && g[y]![x] !== '-') g[y]![x] = 'r';
      }
    }
  }
  // shallow water along every coast
  const near = (x: number, y: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = g[y + dy]?.[x + dx]; if (c && c !== '~' && c !== '-') return true; }
    return false;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y]![x] === '~' && near(x, y)) g[y]![x] = '-';
  return g;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const g = draw();
  const dir = join(import.meta.dirname, '..', 'content', 'map');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'world.txt'), g.map((r) => r.join('')).join('\n') + '\n');
  console.log(`wrote content/map/world.txt (${W}x${H})`);
}
