// The world, generated: a deterministic heightmap and biome map built from the shapes
// below, the same in the browser (src/ui/components/MapView.tsx) and in the validator.
// Shapes are in tiles on a WORLD_W x WORLD_H grid; noise makes them ragged.
//
// Geography (canon.md): the island (Caldmoor's fjords to the north, the March on the neck
// between the lobes, Adalia to the south), the Narrow Sea, Valdrenne and its West (the
// Armance hook, Sauvemer's spit and the salt flats of Les Salines), the escarpment where
// the Cordelle road climbs to Mortefontaine, Cordelle's river and its delta, Vervais,
// Hroswald's forest and the Iron Spine, the Ostmark, the Midsea and the lands beyond.

export const WORLD_W = 360;
export const WORLD_H = 240;

export const Biome = {
  Deep: 0, Sea: 1, Shallow: 2, Floe: 3, Beach: 4, Grass: 5, Farm: 6, Vines: 7, Forest: 8, Pine: 9, DarkForest: 10, Hills: 11, Mountain: 12, Snow: 13, Tundra: 14, Ice: 15, Steppe: 16, Desert: 17, Dunes: 18, Salt: 19, Marsh: 20, River: 21, Lake: 22, Lava: 23, Cliff: 24,
} as const;
export type Biome = (typeof Biome)[keyof typeof Biome];

type Pt = [number, number];
interface Poly { pts: Pt[]; amp: number; box: [number, number, number, number] }

// ---- noise -------------------------------------------------------------------
function hash(x: number, y: number, s: number): number {
  let h = (x * 374761393 + y * 668265263 + s * 974634163) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x: number, y: number, scale: number, s: number): number {
  const fx = x / scale, fy = y / scale;
  const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const sm = (t: number) => t * t * (3 - 2 * t);
  const a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s);
  const top = a + (b - a) * sm(tx), bot = c + (d - c) * sm(tx);
  return top + (bot - top) * sm(ty);
}
/** fractal noise, about -1..1 */
export function fbm(x: number, y: number, s: number, base = 24): number {
  let v = 0, amp = 1, sc = base, norm = 0;
  for (let o = 0; o < 5; o++) { v += (vnoise(x, y, sc, s + o * 17) - 0.5) * 2 * amp; norm += amp; amp *= 0.5; sc /= 2; }
  return v / norm;
}
export function tileHash(x: number, y: number): number { return hash(x, y, 9); }

/** A whole fbm field at once: random values on a lattice per octave, interpolated (fast). Same range as fbm. */
function fbmField(W: number, H: number, s: number, base: number, octaves = 5): Float32Array {
  const out = new Float32Array(W * H);
  const sm = (t: number) => t * t * (3 - 2 * t);
  let amp = 1, sc = base, norm = 0;
  for (let o = 0; o < octaves; o++) {
    const gw = Math.ceil(W / sc) + 2, gh = Math.ceil(H / sc) + 2;
    const lat = new Float32Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) lat[gy * gw + gx] = hash(gx, gy, s + o * 17);
    for (let y = 0; y < H; y++) {
      const fy = y / sc, y0 = Math.floor(fy), ty = sm(fy - y0);
      for (let x = 0; x < W; x++) {
        const fx = x / sc, x0 = Math.floor(fx), tx = sm(fx - x0);
        const a = lat[y0 * gw + x0]!, b = lat[y0 * gw + x0 + 1]!, c = lat[(y0 + 1) * gw + x0]!, d = lat[(y0 + 1) * gw + x0 + 1]!;
        const top = a + (b - a) * tx, bot = c + (d - c) * tx;
        out[y * W + x]! += ((top + (bot - top) * ty) - 0.5) * 2 * amp;
      }
    }
    norm += amp; amp *= 0.5; sc /= 2;
  }
  for (let i = 0; i < out.length; i++) out[i]! /= norm;
  return out;
}

function inside(x: number, y: number, pts: Pt[]): boolean {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!, [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function segDist(px: number, py: number, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}
function lineDist(x: number, y: number, line: Pt[]): number {
  let d = Infinity;
  for (let i = 0; i < line.length - 1; i++) d = Math.min(d, segDist(x, y, line[i]!, line[i + 1]!));
  return d;
}
// warp fields, computed once per tile and shared by every shape (see world())
let WX: Float32Array, WY: Float32Array, WX2: Float32Array, WY2: Float32Array;
/** a ragged shape: test the tile at a point pushed about by noise (two warp fields, alternating by shape) */
function inShape(x: number, y: number, p: Poly, seed: number): boolean {
  if (x < p.box[0] || y < p.box[1] || x > p.box[2] || y > p.box[3]) return false;
  const i = y * WORLD_W + x;
  const alt = seed % 2 === 1;
  return inside(x + 0.5 + (alt ? WX2 : WX)[i]! * p.amp, y + 0.5 + (alt ? WY2 : WY)[i]! * p.amp, p.pts);
}
const P = (amp: number, ...pts: Pt[]): Poly => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { pts, amp, box: [Math.min(...xs) - amp * 1.5, Math.min(...ys) - amp * 1.5, Math.max(...xs) + amp * 1.5, Math.max(...ys) + amp * 1.5] };
};

// ---- land ---------------------------------------------------------------------
const LAND: Poly[] = [
  // the island's northern lobe, Caldmoor: highland cut by fjords
  P(7, [62, 24], [84, 16], [108, 18], [124, 28], [126, 44], [116, 54], [98, 58], [80, 58], [64, 52], [56, 40]),
  // the March: the neck between the lobes
  P(4, [80, 54], [100, 54], [103, 66], [96, 70], [82, 70], [78, 62]),
  // Adalia, the southern lobe
  P(7, [54, 70], [80, 66], [104, 64], [126, 70], [140, 82], [138, 98], [124, 108], [100, 112], [76, 110], [56, 102], [46, 88]),
  // the mainland, from the West to Hroswald
  P(9, [60, 132], [84, 124], [104, 122], [124, 126], [150, 122], [176, 118], [196, 112], [214, 98], [232, 84], [256, 74], [282, 66], [312, 62], [360, 58],
    [360, 176], [340, 178], [320, 172], [300, 176], [286, 188], [270, 200], [252, 206], [232, 206], [214, 208], [196, 212], [176, 214], [156, 212],
    [136, 206], [118, 196], [104, 182], [96, 168], [90, 154], [76, 148]),
  // the Armance: a hooked fist of land into the western sea
  P(6, [78, 132], [62, 128], [44, 132], [30, 142], [24, 156], [30, 168], [44, 174], [58, 170], [66, 160], [58, 152], [50, 150], [48, 142], [62, 138], [78, 140]),
  // the lands beyond the Midsea, where the caravans come from
  P(8, [318, 186], [340, 182], [360, 182], [360, 240], [304, 240], [300, 220], [310, 204]),
  // the far south, across the Southern Sea
  P(6, [150, 236], [200, 232], [250, 234], [290, 240], [140, 240]),
  // the Ice Reach
  P(5, [0, 0], [360, 0], [360, 8], [300, 12], [220, 9], [150, 12], [90, 8], [30, 12], [0, 9]),
];
// Sauvemer's spit, a thread of sand between the sea and the salt
const SPIT: Pt[] = [[100, 121], [116, 117], [120, 118.5], [104, 123.5]];
// islands: [x, y, radius]
const ISLES: [number, number, number][] = [
  // the Thousand Isles, south-west
  [40, 196, 4], [52, 204, 3], [34, 212, 5], [62, 214, 3], [48, 222, 4], [72, 224, 2.5], [26, 226, 3], [60, 192, 2.5], [80, 206, 2.5], [20, 200, 2],
  // the Ember Isles: volcanoes in the western sea
  [16, 98, 5], [26, 110, 3.5], [12, 118, 3], [30, 92, 2.5],
  // the Sarenzan League, off the southern coast
  [206, 222, 4], [222, 226, 5], [240, 222, 3.5], [190, 226, 3],
  // Caldmoor's outer isles
  [48, 30, 3], [42, 44, 2.5], [132, 22, 3], [138, 34, 2.5],
  // floes and skerries in the Ice Reach
  [70, 13, 2], [190, 14, 2.5], [250, 15, 2], [330, 14, 3],
];
// water cut out of the land
const SEAS: Poly[] = [
  // the Midsea, an enclosed sea in the south-east
  P(6, [262, 168], [290, 160], [318, 166], [334, 176], [326, 196], [302, 206], [278, 202], [262, 188]),
];
const FJORDS: Pt[][] = [
  [[60, 34], [72, 36], [80, 38]], [[64, 48], [74, 46], [82, 46]], [[84, 18], [86, 28], [90, 34]],
  [[108, 20], [104, 28], [100, 32]], [[124, 34], [114, 36], [108, 40]], [[122, 48], [112, 48], [106, 46]],
];
const STRAITS: Pt[][] = [
  [[300, 205], [292, 214], [282, 222]], // the Midsea's mouth to the Southern Sea
];

// ---- relief -------------------------------------------------------------------
// ridges: [polyline, width, height]
const RIDGES: [Pt[], number, number][] = [
  [[[70, 28], [86, 24], [104, 26], [116, 36], [110, 48]], 9, 0.75], // the Caldmoor highlands
  [[[268, 70], [278, 90], [284, 112], [282, 136], [290, 158]], 10, 0.9], // the Iron Spine of Hroswald
  [[[40, 150], [50, 160], [44, 168]], 6, 0.42], // the Armance hills behind Lannec
  [[[134, 168], [150, 158], [168, 150], [188, 146], [206, 140]], 4, 0.4], // the escarpment
  [[[200, 196], [226, 192], [250, 194]], 7, 0.55], // the hills above the southern coast
  [[[226, 104], [242, 98], [252, 110]], 7, 0.36], // the Vervais uplands
  [[[330, 200], [346, 214]], 8, 0.5], // beyond the Midsea
  [[[16, 98], [16, 99]], 5, 0.95], [[[26, 110], [26, 111]], 3.5, 0.8], [[[12, 118], [12, 119]], 3, 0.7], // the Embers
];
const DOWNS: Poly[] = [P(5, [70, 76], [96, 72], [110, 80], [96, 90], [74, 88])]; // Adalia's chalk downs

// ---- regions that decide the land's cover --------------------------------------
const FARMS: Poly[] = [
  P(5, [66, 84], [100, 82], [118, 92], [104, 104], [74, 104]), // the south midlands round Wendham
  P(5, [140, 132], [176, 128], [190, 140], [150, 146]), // the road east past Vaudrey
  P(6, [180, 160], [214, 152], [224, 170], [194, 180]), // the plain of Cordelle
];
const VINES: Poly[] = [P(6, [150, 178], [200, 182], [214, 196], [170, 204], [138, 196])]; // the Midi
const SALT: Poly[] = [P(3, [98, 125], [122, 121], [130, 128], [120, 135], [102, 134])]; // Les Salines
const MARSH: Poly[] = [
  P(3, [122, 128], [134, 126], [138, 134], [126, 138]), // the marsh behind Sauvemer (Ormel)
  P(4, [100, 168], [112, 168], [116, 184], [104, 188]), // Quérec's southern marsh
  P(3, [128, 96], [138, 94], [138, 104], [130, 104]), // the Saltmarsh coast
  P(5, [150, 200], [178, 200], [178, 212], [150, 212]), // the delta
];
const DARKWOOD: Poly[] = [P(8, [258, 110], [300, 106], [312, 140], [300, 170], [266, 164], [256, 136])]; // Hroswald's forest
const WOODS: Poly[] = [
  P(4, [64, 76], [76, 74], [78, 84], [66, 86]), // the Ravell chase
  P(4, [112, 66], [126, 68], [124, 78], [112, 76]), // the woods by Carrow
  P(5, [196, 120], [212, 116], [214, 132], [198, 134]), // the woods of the Lisonne
  P(5, [96, 186], [112, 186], [114, 198], [100, 200]), // the southern West
];
const STEPPE: Poly[] = [P(8, [310, 66], [360, 62], [360, 170], [322, 172], [314, 140])]; // the Grass Sea past the Ostmark
const DESERT: Poly[] = [P(8, [320, 190], [360, 186], [360, 240], [312, 240], [306, 220])]; // the Glass Desert
const GLACIER: Poly[] = [P(5, [0, 0], [360, 0], [360, 7], [0, 7])];

// rivers: [polyline, width]
export const RIVERS: [Pt[], number][] = [
  [[[78, 63], [88, 62], [98, 61], [104, 60]], 1], // the Leven, across the March
  [[[110, 76], [118, 80], [126, 82], [134, 84]], 1.4], // Wendmere's tidal river
  [[[70, 96], [76, 100], [80, 108]], 1], // the Wend, to Saltcombe
  [[[148, 150], [146, 140], [142, 132], [140, 124]], 1.2], // the river of the Pont-aux-Moines
  [[[176, 150], [174, 138], [172, 126], [170, 118]], 1], // the Aube, crossed at Grisolles
  [[[204, 150], [202, 134], [200, 118], [200, 108]], 1.4], // the Lisonne
  [[[276, 120], [252, 140], [232, 156], [210, 166], [192, 172], [176, 186], [166, 198], [162, 210]], 2], // Cordelle's great river
  [[[160, 202], [154, 210]], 1], [[[166, 204], [170, 212]], 1], // the delta's channels
  [[[284, 90], [300, 96], [316, 98]], 1], // a river of the Ostmark
];
const LAKES: [number, number, number][] = [[288, 130, 4], [236, 116, 2.5], [84, 30, 2.5], [340, 120, 5]];

export interface World {
  w: number; h: number;
  elev: Float32Array; // -1 deep sea .. 1 peaks
  biome: Uint8Array;
  shade: Float32Array; // hillshade, about -1..1 (lit from the north-west)
}

let cached: World | undefined;

/** The world: deterministic, generated once and cached. */
export function world(): World {
  if (cached) return cached;
  const W = WORLD_W, H = WORLD_H, N = W * H;
  const land = new Uint8Array(N);
  const at = (x: number, y: number) => y * W + x;
  WX = fbmField(W, H, 11, 18); WY = fbmField(W, H, 62, 18); WX2 = fbmField(W, H, 113, 14); WY2 = fbmField(W, H, 164, 14);
  const F1 = fbmField(W, H, 1, 26), F2 = fbmField(W, H, 500, 10); // base relief, ridge roughness

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let l = false;
    for (let k = 0; k < LAND.length && !l; k++) l = inShape(x, y, LAND[k]!, 10 + k * 7);
    if (!l) l = inside(x + 0.5, y + 0.5, SPIT);
    if (!l) for (let k = 0; k < ISLES.length; k++) {
      const [cx, cy, r] = ISLES[k]!, dx = x - cx, dy = y - cy, rr = r + WX2[at(x, y)]! * 1.6;
      if (dx * dx + dy * dy < rr * rr) { l = true; break; }
    }
    if (l && SEAS.some((p, i) => inShape(x, y, p, 200 + i))) l = false;
    if (l && x < 130 && y < 60 && FJORDS.some((f) => lineDist(x, y, f) < 1.2 + WY2[at(x, y)]! * 0.6)) l = false;
    if (l && x > 270 && y > 195 && STRAITS.some((f) => lineDist(x, y, f) < 4)) l = false;
    land[at(x, y)] = l ? 1 : 0;
  }

  // distance to the coast, for sea depth and for land rising inland: a two-pass chamfer
  // transform (1 straight, 1.4 diagonal), so shoals round off instead of forming diamonds
  const dist = new Float32Array(N).fill(1e9);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y);
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx!, ny = y + dy!; return nx >= 0 && ny >= 0 && nx < W && ny < H && land[at(nx, ny)] !== land[i]; });
    if (edge) dist[i] = 0;
  }
  const relax = (i: number, nx: number, ny: number, c: number) => {
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
    const j = at(nx, ny);
    if (land[j] === land[i] && dist[j]! + c < dist[i]!) dist[i] = dist[j]! + c;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y);
    relax(i, x - 1, y, 1); relax(i, x, y - 1, 1); relax(i, x - 1, y - 1, 1.4); relax(i, x + 1, y - 1, 1.4);
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = at(x, y);
    relax(i, x + 1, y, 1); relax(i, x, y + 1, 1); relax(i, x + 1, y + 1, 1.4); relax(i, x - 1, y + 1, 1.4);
  }

  const elev = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y);
    if (!land[i]) { elev[i] = -Math.min(1, 0.12 + dist[i]! * 0.055 + F1[i]! * 0.16); continue; }
    let e = 0.06 + Math.min(0.16, dist[i]! * 0.012) + F1[i]! * 0.07;
    for (const [line, width, height] of RIDGES) {
      const d = lineDist(x, y, line) + F2[i]! * width * 0.5;
      if (d < width) e += height * (1 - d / width) ** 1.3 * (0.75 + 0.25 * WX2[i]!);
    }
    if (DOWNS.some((p, k) => inShape(x, y, p, 600 + k))) e += 0.14;
    elev[i] = Math.min(1, e);
  }

  const biome = new Uint8Array(N);
  const inAny = (ps: Poly[], s: number, x: number, y: number) => ps.some((p, k) => inShape(x, y, p, s + k * 3));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y), e = elev[i]!;
    if (!land[i]) {
      const floe = y < 26 && vnoise(x, y, 6, 77) * 0.7 + vnoise(x, y, 2, 78) * 0.3 > 0.66 - (26 - y) * 0.012;
      biome[i] = floe ? Biome.Floe : e > -0.2 ? Biome.Shallow : e > -0.5 ? Biome.Sea : Biome.Deep;
      continue;
    }
    const cold = y < 30 ? 2 : y < 52 ? 1 : 0; // the north is cold
    let b: number;
    if (inAny(GLACIER, 700, x, y) || (cold === 2 && e > 0.45)) b = Biome.Ice;
    else if (e > 0.78) b = Biome.Snow;
    else if (e > 0.56) b = Biome.Mountain;
    else if (inAny(SALT, 710, x, y)) b = Biome.Salt;
    else if (inAny(MARSH, 720, x, y)) b = Biome.Marsh;
    else if (inAny(DESERT, 730, x, y)) b = vnoise(x, y, 4, 731) > 0.55 ? Biome.Dunes : Biome.Desert;
    else if (inAny(STEPPE, 740, x, y)) b = vnoise(x, y, 6, 741) > 0.8 ? Biome.Grass : Biome.Steppe;
    else if (e > 0.36) b = Biome.Hills;
    else if (cold === 2) b = Biome.Tundra;
    else if (inAny(DARKWOOD, 750, x, y)) b = vnoise(x, y, 5, 751) > 0.86 ? Biome.Grass : Biome.DarkForest;
    else if (inAny(VINES, 760, x, y)) b = Biome.Vines;
    else if (inAny(FARMS, 770, x, y)) b = vnoise(x, y, 5, 771) > 0.84 ? Biome.Forest : Biome.Farm;
    else if (inAny(WOODS, 780, x, y)) b = cold ? Biome.Pine : Biome.Forest;
    else if (vnoise(x, y, 7, 790) > 0.66) b = cold ? Biome.Pine : Biome.Forest;
    else b = Biome.Grass;
    if (dist[i]! < 1 && e < 0.2 && b === Biome.Grass && vnoise(x, y, 4, 795) > 0.45) b = Biome.Beach;
    biome[i] = b;
  }
  // the Embers burn
  for (const [cx, cy, r] of ISLES.slice(10, 14)) for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    if (x >= 0 && y >= 0 && x < W && y < H && land[at(x, y)] && Math.hypot(x - cx, y - cy) < r * 0.35) biome[at(x, y)] = Biome.Lava;
  }
  // rivers and lakes
  for (const [line, width] of RIVERS) {
    for (let k = 0; k < line.length - 1; k++) {
      const [x0, y0] = line[k]!, [x1, y1] = line[k + 1]!;
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
      for (let t = 0; t <= n; t++) {
        const f = t / n;
        const cx = x0 + (x1 - x0) * f + fbm(t + k * 50, k, 820, 8) * 1.4, cy = y0 + (y1 - y0) * f + fbm(k, t + k * 50, 830, 8) * 1.4;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const x = Math.round(cx + dx), y = Math.round(cy + dy);
          if (x < 0 || y < 0 || x >= W || y >= H || !land[at(x, y)]) continue;
          if (Math.hypot(x - cx, y - cy) <= width * 0.75) biome[at(x, y)] = Biome.River;
        }
      }
    }
  }
  for (const [cx, cy, r] of LAKES) for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
    if (x >= 0 && y >= 0 && x < W && y < H && land[at(x, y)] && Math.hypot(x - cx, y - cy) < r + WY2[at(x, y)]! * 1.5) biome[at(x, y)] = Biome.Lake;
  }

  // hillshade, lit from the north-west
  const shade = new Float32Array(N);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = at(x, y);
    shade[i] = land[i] ? Math.max(-1, Math.min(1, (elev[at(x - 1, y - 1)]! - elev[at(x + 1, y + 1)]!) * 6)) : 0;
  }
  // cliffs: where the land drops steeply to the sea
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = at(x, y);
    if (land[i] && dist[i] === 0 && elev[i]! > 0.3 && biome[i] !== Biome.River) biome[i] = Biome.Cliff;
  }

  cached = { w: W, h: H, elev, biome, shade };
  return cached;
}

export function isWater(b: number): boolean {
  return b === Biome.Deep || b === Biome.Sea || b === Biome.Shallow || b === Biome.Floe;
}

/** Which realm a land tile belongs to, for the borders drawn on the map. */
export function realmAt(x: number, y: number): string {
  if (y <= 113 && x <= 146) return y < 61 ? 'caldmoor' : 'adalia';
  if (y >= 229) return 'far';
  if (x >= 300 && y >= 182) return 'far';
  if (x >= 314) return 'far';
  if (y >= 212 && x >= 180 && x <= 252) return 'sarenza';
  if (x < 146) return 'west';
  if (x >= 258) return 'hroswald';
  if (x >= 206 && y < 150) return 'vervais';
  return 'valdrenne';
}
