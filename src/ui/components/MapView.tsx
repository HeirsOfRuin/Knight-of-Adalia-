import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { ContentBundle, PlaceDef } from '../../content/schema';
import type { GameState } from '../../engine/state';
import { hereNow, knownPlaces, resolvePlace, visits } from '../../engine/map';
import { describeDate } from '../../engine/calendar';

// Pixel art at 4 canvas pixels per tile, drawn once per map and scaled up without smoothing.
const T = 4;
const C: Record<string, string> = {
  '~': '#2c4a62', '-': '#3d6683', '.': '#93a764', ',': '#bdb36f', f: '#47703a', h: '#8e8a58',
  M: '#7a6e62', w: '#6b8868', r: '#4d7ea3', '=': '#e2ddc9', l: '#4d7ea3',
};
const SHADE: Record<string, string> = {
  '~': '#284459', '-': '#5a83a0', '.': '#86995b', ',': '#a99f5f', f: '#2f5227', h: '#a7a26d',
  M: '#e8e4dc', w: '#4f6f8c', r: '#6a98bb', '=': '#c9c3ab', l: '#6a98bb',
};
// 7x7 icons: # dark, o light
const ICONS: Record<PlaceDef['kind'], string[]> = {
  city: ['#.#.#.#', '#######', '#ooooo#', '#o#o#o#', '#ooooo#', '#o###o#', '#######'],
  town: ['...#...', '..###..', '.#ooo#.', '#ooooo#', '#o#o#o#', '#ooooo#', '#######'],
  castle: ['#.#.#..', '#####..', '#ooo#..', '#o#o#..', '#ooo#..', '#####..', '.......'],
  manor: ['...#...', '..#o#..', '.#ooo#.', '#ooooo#', '.#o#o#.', '.#o#o#.', '.#####.'],
  abbey: ['...#...', '..###..', '...#...', '.#####.', '.#ooo#.', '.#o#o#.', '.#####.'],
  port: ['...#...', '..###..', '...#...', '...#...', '#..#..#', '.#.#.#.', '..###..'],
  battle: ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'],
  region: [],
};
const HOLDING_PLACE: Record<string, string> = { wendham_rents: 'wendham', sauvemer_house: 'sauvemer', kerguen_dower: 'kerguen' };

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function drawTerrain(ctx: CanvasRenderingContext2D, rows: string[]) {
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const px = x * T, py = y * T, h = hash(x, y);
    ctx.fillStyle = C[ch] ?? '#f0f';
    ctx.fillRect(px, py, T, T);
    ctx.fillStyle = SHADE[ch] ?? '#f0f';
    switch (ch) {
      case '~': if (h > 0.9) ctx.fillRect(px + 1, py + 2, 2, 1); break; // a wave
      case '-': if (h > 0.85) ctx.fillRect(px, py + 1, 2, 1); break;
      case '.': if (h > 0.7) ctx.fillRect(px + Math.floor(h * 3), py + 2, 1, 1); break;
      case ',': ctx.fillRect(px, py + (y % 2 ? 1 : 3), T, 1); break; // furrows
      case 'f': ctx.fillRect(px + 1, py, 2, 2); ctx.fillRect(px + (h > 0.5 ? 0 : 2), py + 2, 2, 1); break; // trees
      case 'h': ctx.fillRect(px + 1, py + 1, 2, 1); break; // a ridge
      case 'M': ctx.fillStyle = '#5c5249'; ctx.fillRect(px + 2, py + 1, 2, 3); ctx.fillRect(px, py + 2, 1, 2); if (h > 0.55) { ctx.fillStyle = SHADE.M!; ctx.fillRect(px + 1, py, 2, 1); } break; // a peak, some with snow
      case 'w': if (h > 0.4) ctx.fillRect(px + Math.floor(h * 3), py + 1, 1, 2); break; // reeds and water
      case '=': ctx.fillRect(px, py, T, 1); ctx.fillRect(px, py, 1, T); break; // salt pans
      case 'r': case 'l': if (h > 0.6) ctx.fillRect(px + 1, py + 1, 2, 1); break;
    }
  }));
}

function drawIcon(ctx: CanvasRenderingContext2D, p: PlaceDef, colour: string) {
  const icon = ICONS[p.kind];
  const ox = p.x * T + T / 2 - 3, oy = p.y * T + T / 2 - 3;
  icon.forEach((line, dy) => [...line].forEach((ch, dx) => {
    if (ch === '.') return;
    ctx.fillStyle = ch === '#' ? (p.kind === 'battle' ? '#8f1d1d' : '#211c17') : colour;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  }));
}

/** The world map. `mini`: a small map for a chapter card, showing only where he is. */
export function MapView({ content, state, mini = false }: { content: ContentBundle; state: GameState; mini?: boolean }) {
  const rows = content.map?.rows ?? [];
  const W = (rows[0]?.length ?? 0) * T, H = rows.length * T;
  const canvas = useRef<HTMLCanvasElement>(null);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [picked, setPicked] = useState<string | undefined>();
  const known = useMemo(() => knownPlaces(content, state), [content, state]);
  const trail = useMemo(() => visits(content, state), [content, state]);
  const here = hereNow(content, state);
  const mine = useMemo(() => {
    const s = new Set<string>();
    const manor = resolvePlace('@manor', state);
    if (manor && state.estate) s.add(manor);
    for (const id of Object.keys(state.holdings ?? {})) { const p = HOLDING_PLACE[id] ?? id; if (content.registry.places[p]) s.add(p); }
    return s;
  }, [content, state]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    drawTerrain(ctx, rows);
    // his road: a dotted line through every place he has stayed, in order
    ctx.fillStyle = '#7a2e1d';
    for (let i = 1; i < trail.length; i++) {
      const a = content.registry.places[trail[i - 1]!.place], b = content.registry.places[trail[i]!.place];
      if (!a || !b) continue;
      const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 2;
      for (let k = 0; k <= n; k += 2) {
        const x = (a.x + ((b.x - a.x) * k) / n) * T + T / 2, y = (a.y + ((b.y - a.y) * k) / n) * T + T / 2;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }
    for (const [id, p] of Object.entries(known)) if (p.kind !== 'region') drawIcon(ctx, p, mine.has(id) ? '#e0b84a' : '#f3ecda');
  }, [rows, known, trail, mine, content, full]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full]);

  // labels that fit: most important first (here, his lands, cities and regions, places he has been), no overlaps
  const inner = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState(0);
  useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setPx(el.clientWidth));
    ro.observe(el);
    setPx(el.clientWidth);
    return () => ro.disconnect();
  }, [full, zoom]);
  const shown = useMemo(() => {
    const scale = px / W || 1;
    const rank = (id: string, p: PlaceDef) => (id === picked ? 0 : id === here ? 1 : mine.has(id) ? 2 : p.kind === 'region' ? 3 : p.kind === 'city' ? 4 : trail.some((v) => v.place === id) ? 5 : 6);
    const boxes: [number, number, number, number][] = [];
    const out = new Set<string>();
    for (const [id, p] of Object.entries(known).sort((a, b) => rank(a[0], a[1]) - rank(b[0], b[1]))) {
      if (rank(id, p) === 6 && !full) continue;
      if (mini && id !== here) continue;
      const w = p.name.length * (p.kind === 'region' ? 7.5 : 6.4) + 6, h = 14;
      const cx = (p.x * T + T / 2) * scale, cy = (p.y * T + T / 2) * scale;
      const box: [number, number, number, number] = p.kind === 'region' ? [cx - w / 2, cy - h / 2, w, h] : [cx - 8, cy - h / 2, w + 12, h];
      if (id !== picked && (box[0] < 0 || box[0] + box[2] > px + 4)) continue; // would run off the map
      if (id !== picked && boxes.some((b) => box[0] < b[0] + b[2] && b[0] < box[0] + box[2] && box[1] < b[1] + b[3] && b[1] < box[1] + box[3])) continue;
      boxes.push(box);
      out.add(id);
    }
    return out;
  }, [px, W, known, picked, here, mine, trail, full]);

  if (!rows.length) return null;
  const pct = (v: number, of: number) => `${(100 * v) / of}%`;
  const visitsAt = (id: string) => trail.filter((v) => v.place === id);
  const sel = picked ? content.registry.places[picked] : undefined;
  const map = (
    <div class={`worldmap ${full ? 'full' : ''} ${mini ? 'mini' : ''}`}>
      <div class="worldmap-scroll">
        <div class="worldmap-inner" ref={inner} style={{ width: full ? `${zoom * 100}%` : '100%' }}>
          <canvas ref={canvas} width={W} height={H} class="worldmap-canvas" aria-label="Map of the world" />
          {Object.entries(known).map(([id, p]) => (
            <button key={id} type="button" class={`place ${p.kind} ${id === picked ? 'on' : ''}`}
              style={{ left: pct(p.x * T + T / 2, W), top: pct(p.y * T + T / 2, H) }}
              onClick={() => !mini && setPicked(id === picked ? undefined : id)} aria-label={p.name} tabIndex={mini ? -1 : 0}>
              {shown.has(id) && <span class="place-label">{p.name}</span>}
            </button>
          ))}
          {here && content.registry.places[here] && (
            <span class="here" style={{ left: pct(content.registry.places[here]!.x * T + T / 2, W), top: pct(content.registry.places[here]!.y * T + T / 2, H) }} aria-hidden="true" />
          )}
        </div>
      </div>
      {!mini && <div class="worldmap-bar">
        {full && <button class="btn" onClick={() => setZoom(Math.max(1, zoom - 1))} disabled={zoom <= 1} aria-label="Zoom out">−</button>}
        {full && <button class="btn" onClick={() => setZoom(Math.min(4, zoom + 1))} disabled={zoom >= 4} aria-label="Zoom in">+</button>}
        <button class="btn" onClick={() => setFull(!full)}>{full ? 'Close the map' : 'Open the map'}</button>
      </div>}
      {sel && (
        <div class="place-info">
          <h3>{sel.name}</h3>
          <p>{sel.text}</p>
          {mine.has(picked!) && <p class="muted">Yours.</p>}
          {visitsAt(picked!).length > 0 && (
            <ul class="place-visits">
              {visitsAt(picked!).map((v, i) => <li key={i}>{describeDate({ ...state, time: v.at }, content)}{v.title && !v.title.includes('[') && !v.title.includes('{') ? `: ${v.title}` : ''}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
  return full && typeof document !== 'undefined'
    ? createPortal(<div class="worldmap-overlay" role="dialog" aria-label="The map"><h2 class="worldmap-title">The Map</h2>{map}</div>, document.body)
    : map;
}
