// Paints the generated world (src/engine/worldgen.ts) as pixel art: S canvas pixels a tile,
// biome colours lit by the hillshade, small patterns (trees, peaks, furrows, vines, dunes,
// salt pans, reeds, waves, floes), foam on the coast and dotted borders between realms.
import { Biome, isWater, tileHash, type World } from '../engine/worldgen';

export const S = 3;

const B = Biome;
// base colour per biome
const BASE: Record<number, [number, number, number]> = {
  [B.Deep]: [27, 52, 76], [B.Sea]: [36, 72, 102], [B.Shallow]: [54, 104, 138], [B.Floe]: [214, 226, 230],
  [B.Beach]: [216, 196, 142], [B.Grass]: [138, 164, 88], [B.Farm]: [190, 176, 100], [B.Vines]: [178, 150, 92],
  [B.Forest]: [74, 118, 58], [B.Pine]: [56, 98, 72], [B.DarkForest]: [38, 70, 44], [B.Hills]: [150, 142, 90],
  [B.Mountain]: [128, 114, 100], [B.Snow]: [236, 236, 230], [B.Tundra]: [158, 166, 142], [B.Ice]: [226, 236, 240],
  [B.Steppe]: [184, 176, 112], [B.Desert]: [218, 184, 118], [B.Dunes]: [206, 164, 98], [B.Salt]: [238, 232, 218],
  [B.Marsh]: [102, 134, 100], [B.River]: [62, 118, 158], [B.Lake]: [62, 118, 158], [B.Lava]: [214, 88, 42], [B.Cliff]: [104, 92, 80],
};
// pattern colour per biome
const MARK: Record<number, [number, number, number]> = {
  [B.Deep]: [34, 62, 88], [B.Sea]: [60, 98, 128], [B.Shallow]: [96, 146, 176], [B.Floe]: [170, 196, 206],
  [B.Beach]: [236, 222, 176], [B.Grass]: [120, 148, 74], [B.Farm]: [160, 146, 74], [B.Vines]: [112, 70, 98],
  [B.Forest]: [44, 82, 36], [B.Pine]: [32, 68, 50], [B.DarkForest]: [22, 44, 28], [B.Hills]: [178, 170, 116],
  [B.Mountain]: [86, 76, 68], [B.Snow]: [196, 200, 204], [B.Tundra]: [132, 140, 120], [B.Ice]: [196, 214, 222],
  [B.Steppe]: [204, 196, 128], [B.Desert]: [236, 206, 142], [B.Dunes]: [176, 134, 74], [B.Salt]: [226, 196, 190],
  [B.Marsh]: [70, 110, 120], [B.River]: [92, 146, 184], [B.Lake]: [92, 146, 184], [B.Lava]: [92, 40, 28], [B.Cliff]: [72, 62, 54],
};

export function paintWorld(w: World): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = w.w * S; cv.height = w.h * S;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(cv.width, cv.height);
  const d = img.data;
  const put = (px: number, py: number, c: [number, number, number], k = 1) => {
    const o = (py * cv.width + px) * 4;
    d[o] = Math.max(0, Math.min(255, c[0] * k)); d[o + 1] = Math.max(0, Math.min(255, c[1] * k)); d[o + 2] = Math.max(0, Math.min(255, c[2] * k)); d[o + 3] = 255;
  };
  for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) {
    const i = y * w.w + x, b = w.biome[i]!, h = tileHash(x, y);
    const water = isWater(b);
    // light: hillshade on land; on water, depth
    const k = water ? 1 + (w.elev[i]! + 0.5) * 0.25 : 1 + w.shade[i]! * 0.22 + (h - 0.5) * 0.06;
    const base = BASE[b]!, mark = MARK[b]!;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) put(x * S + px, y * S + py, base, k);
    const X = x * S, Y = y * S, m = (dx: number, dy: number, kk = 1) => put(X + dx, Y + dy, mark, kk * k);
    switch (b) {
      case B.Deep: case B.Sea: if (h > 0.93) { m(0, 1); m(1, 1); } break; // a wave
      case B.Shallow: if (h > 0.8) m(Math.floor(h * 3), 2); break;
      case B.Floe: if (h > 0.4) { m(0, 0); m(1, 0); } else put(X + 2, Y + 2, BASE[B.Shallow]!, 1); break;
      case B.Grass: if (h > 0.72) m(Math.floor(h * 3), 1); break;
      case B.Farm: for (let px = 0; px < S; px++) m(px, y % 2 ? 0 : 2); break; // furrows
      case B.Vines: if (x % 2 === 0) { m(1, 0); m(1, 2); } break; // rows of vines
      case B.Forest: m(1, 0); m(0, 1); m(1, 1); m(2, 1); put(X + 1, Y + 2, [70, 52, 36], k); break; // a round tree
      case B.Pine: m(1, 0); m(0, 1); m(1, 1); m(2, 1); m(1, 2); break; // a pine
      case B.DarkForest: m(0, 0); m(1, 0); m(1, 1); m(2, 1); m(0, 2); if (h > 0.7) put(X + 2, Y, BASE[B.Pine]!, k); break;
      case B.Hills: m(1, 0); m(0, 1); m(2, 1); break; // a rounded crest
      case B.Mountain: put(X + 1, Y, [210, 204, 196], k); m(2, 1); m(2, 2); m(1, 2); break; // a lit face and a shadowed one
      case B.Snow: m(2, 1); m(2, 2); break;
      case B.Tundra: if (h > 0.6) m(0, 2); break;
      case B.Ice: if (h > 0.75) m(1, 1); break;
      case B.Steppe: if (h > 0.5) { m(0, 1); m(2, 2); } break; // tufts
      case B.Desert: if (h > 0.85) m(1, 1); break;
      case B.Dunes: m(0, 1); m(1, 0); m(2, 1); break; // a dune crest
      case B.Salt: if ((x + y) % 3 === 0) { m(0, 0); m(1, 0); m(2, 0); } if (x % 3 === 0) { m(0, 1); m(0, 2); } break; // pans
      case B.Marsh: m(Math.floor(h * 3), 0); m(Math.floor(h * 3), 1); if (h > 0.5) put(X + 2, Y + 2, BASE[B.River]!, 1); break; // reeds and water
      case B.River: case B.Lake: if (h > 0.6) m(1, 1); break;
      case B.Lava: m(1, 1, 1.4); m(0, 0); m(2, 2); break;
      case B.Cliff: m(0, 2); m(1, 2); m(2, 2); break;
    }
    // foam where the sea meets the land
    if (water && b !== B.Floe) {
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => { const j = (y + dy!) * w.w + x + dx!; return x + dx! >= 0 && x + dx! < w.w && y + dy! >= 0 && y + dy! < w.h && !isWater(w.biome[j]!); });
      if (nb) { const [dx, dy] = nb; const fx = dx === 1 ? S - 1 : 0, fy = dy === 1 ? S - 1 : 0; for (let t = 0; t < S; t++) put(X + (dx ? fx : t), Y + (dy ? fy : t), [196, 216, 222], 1); }
    }
  }
  // borders between realms: a dotted line through the tiles where two realms meet, on land
  for (let y = 0; y < w.h; y++) for (let x = 0; x < w.w; x++) {
    const i = y * w.w + x;
    if (isWater(w.biome[i]!)) continue;
    const r = w.realm[i]!;
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx!, ny = y + dy!;
      if (nx < 0 || ny < 0 || nx >= w.w || ny >= w.h) return false;
      const j = ny * w.w + nx;
      return !isWater(w.biome[j]!) && w.realm[j]! > r;
    });
    // dashes two tiles long, in a dark purple that will not be taken for his road
    if (edge && ((x + y) >> 1) % 2 === 0) for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) put(x * S + ox, y * S + oy, [74, 22, 58]);
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
