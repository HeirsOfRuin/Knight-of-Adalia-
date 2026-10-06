import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { ContentBundle, PlaceDef } from '../../content/schema';
import type { GameState } from '../../game/state';
import { hereNow, knownPlaces, resolvePlace, visits } from '@engine/map';
import { describeDate } from '@engine/calendar';
import { world, type World } from '@engine/worldgen';
import { paintWorld, S } from '../worldart';

// 7x7 icons: # dark, o light
const ICONS: Partial<Record<PlaceDef['kind'], string[]>> = {
  city: ['#.#.#.#', '#######', '#ooooo#', '#o#o#o#', '#ooooo#', '#o###o#', '#######'],
  town: ['...#...', '..###..', '.#ooo#.', '#ooooo#', '#o#o#o#', '#ooooo#', '#######'],
  castle: ['#.#.#..', '#####..', '#ooo#..', '#o#o#..', '#ooo#..', '#####..', '.......'],
  manor: ['...#...', '..#o#..', '.#ooo#.', '#ooooo#', '.#o#o#.', '.#o#o#.', '.#####.'],
  abbey: ['...#...', '..###..', '...#...', '.#####.', '.#ooo#.', '.#o#o#.', '.#####.'],
  port: ['...#...', '..###..', '...#...', '...#...', '#..#..#', '.#.#.#.', '..###..'],
  battle: ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'],
};
const HOLDING_PLACE: Record<string, string> = { wendham_rents: 'wendham', sauvemer_house: 'sauvemer', kerguen_dower: 'kerguen' };

let painted: HTMLCanvasElement | undefined;
function terrain(w: World): HTMLCanvasElement { return (painted ??= paintWorld(w)); }

function drawIcon(ctx: CanvasRenderingContext2D, p: PlaceDef, light: string) {
  const icon = ICONS[p.kind];
  if (!icon) return;
  const ox = p.x * S + Math.floor(S / 2) - 3, oy = p.y * S + Math.floor(S / 2) - 3;
  icon.forEach((line, dy) => [...line].forEach((ch, dx) => {
    if (ch === '.') return;
    ctx.fillStyle = ch === '#' ? (p.kind === 'battle' ? '#a3241c' : '#1d1813') : light;
    ctx.fillRect(ox + dx, oy + dy, 1, 1);
  }));
}

/** The world map. `mini`: a small view for a chapter card, centred on where he is. */
export function MapView({ content, state, mini = false }: { content: ContentBundle; state: GameState; mini?: boolean }) {
  const [wd, setWd] = useState<World | undefined>(undefined);
  useEffect(() => {
    // generating the world takes a moment the first time: let the panel paint first
    const t = setTimeout(() => setWd(world()), 0);
    return () => clearTimeout(t);
  }, []);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(mini ? 2.2 : 3);
  const [picked, setPicked] = useState<string | undefined>();
  const [px, setPx] = useState(0);
  const known = useMemo(() => knownPlaces(content, state), [content, state]);
  const trail = useMemo(() => visits(content, state), [content, state]);
  const here = hereNow(content, state);
  const mine = useMemo(() => {
    const s = new Set<string>();
    const manor = resolvePlace(content, '@manor', state);
    if (manor && state.estate) s.add(manor);
    for (const id of Object.keys(state.holdings ?? {})) { const p = HOLDING_PLACE[id] ?? id; if (content.registry.places[p]) s.add(p); }
    return s;
  }, [content, state]);
  const W = (wd?.w ?? 360) * S, H = (wd?.h ?? 240) * S;
  // never let the map come up short of its frame (a tall phone screen): zoom at least to fill it
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const sc = scroller.current;
    if (!sc || !sc.clientWidth) return;
    setFit((sc.clientHeight / sc.clientWidth) * (W / H));
  }, [full, wd, W, H]);
  const z = Math.max(zoom, fit);

  // terrain, then his road and the places he knows
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !wd) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(terrain(wd), 0, 0);
    ctx.fillStyle = '#b8321f';
    for (let i = 1; i < trail.length; i++) {
      const a = content.registry.places[trail[i - 1]!.place], b = content.registry.places[trail[i]!.place];
      if (!a || !b) continue;
      const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * S;
      for (let k = 0; k <= n; k += 3) ctx.fillRect(Math.round((a.x + ((b.x - a.x) * k) / n) * S + 1), Math.round((a.y + ((b.y - a.y) * k) / n) * S + 1), 1, 1);
    }
    for (const [id, p] of Object.entries(known)) drawIcon(ctx, p, mine.has(id) ? '#f0c24e' : '#f6efdc');
  }, [wd, known, trail, mine, content, full]);

  // keep the label layout in step with the drawn size
  useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setPx(el.clientWidth));
    ro.observe(el);
    setPx(el.clientWidth);
    return () => ro.disconnect();
  }, [full, z, wd]);

  // centre on where he is when the map opens or the zoom changes
  useLayoutEffect(() => {
    const sc = scroller.current, p = here ? content.registry.places[here] : undefined;
    if (!sc || !p || !wd || !px) return;
    const scale = px / W;
    sc.scrollLeft = (p.x * S) * scale - sc.clientWidth / 2;
    sc.scrollTop = (p.y * S) * scale - sc.clientHeight / 2;
  }, [here, wd, full, z, px > 0]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full]);

  // drag to pan with a mouse (touch pans natively)
  const drag = useRef<{ x: number; y: number; l: number; t: number } | undefined>(undefined);
  const onDown = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || !scroller.current) return; drag.current = { x: e.clientX, y: e.clientY, l: scroller.current.scrollLeft, t: scroller.current.scrollTop }; };
  const onMove = (e: PointerEvent) => { const d = drag.current, sc = scroller.current; if (!d || !sc) return; sc.scrollLeft = d.l - (e.clientX - d.x); sc.scrollTop = d.t - (e.clientY - d.y); };
  const onUp = () => { drag.current = undefined; };

  // labels that fit, most important first: no overlaps, none running off the map
  const shown = useMemo(() => {
    const scale = px / W || 1;
    const rank = (id: string, p: PlaceDef) => (id === picked ? 0 : id === here ? 1 : mine.has(id) ? 2 : p.kind === 'sea' || p.kind === 'region' ? 3 : p.kind === 'city' ? 4 : trail.some((v) => v.place === id) ? 5 : 6);
    const boxes: [number, number, number, number][] = [];
    const out = new Set<string>();
    for (const [id, p] of Object.entries(known).sort((a, b) => rank(a[0], a[1]) - rank(b[0], b[1]))) {
      if (mini && id !== here) continue;
      const big = p.kind === 'sea' || p.kind === 'region';
      const w = p.name.length * (big ? 8 : 6.6) + 6, h = big ? 16 : 14;
      const cx = (p.x * S + S / 2) * scale, cy = (p.y * S + S / 2) * scale;
      const box: [number, number, number, number] = big ? [cx - w / 2, cy - h / 2, w, h] : [cx - 8, cy - h / 2, w + 12, h];
      if (id !== picked && (box[0] < 0 || box[0] + box[2] > px + 4)) continue;
      if (id !== picked && boxes.some((b) => box[0] < b[0] + b[2] && b[0] < box[0] + box[2] && box[1] < b[1] + b[3] && b[1] < box[1] + box[3])) continue;
      boxes.push(box);
      out.add(id);
    }
    return out;
  }, [px, W, known, picked, here, mine, trail, mini]);

  const pct = (v: number, of: number) => `${(100 * v) / of}%`;
  const visitsAt = (id: string) => trail.filter((v) => v.place === id);
  const sel = picked ? content.registry.places[picked] : undefined;
  const hp = here ? content.registry.places[here] : undefined;
  const map = (
    <div class={`worldmap ${full ? 'full' : ''} ${mini ? 'mini' : ''}`}>
      <div class="worldmap-scroll" ref={scroller} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
        {!wd && <p class="worldmap-wait">Drawing the map&hellip;</p>}
        <div class="worldmap-inner" ref={inner} style={{ width: `${z * 100}%`, display: wd ? 'block' : 'none' }}>
          <canvas ref={canvas} width={W} height={H} class="worldmap-canvas" aria-label="Map of the world" />
          {Object.entries(known).map(([id, p]) => (
            <button key={id} type="button" class={`place ${p.kind} ${id === picked ? 'on' : ''}`}
              style={{ left: pct(p.x * S + S / 2, W), top: pct(p.y * S + S / 2, H) }}
              onClick={() => !mini && setPicked(id === picked ? undefined : id)} aria-label={p.name} tabIndex={mini ? -1 : 0}>
              {shown.has(id) && <span class="place-label">{p.name}</span>}
            </button>
          ))}
          {hp && <span class="here" style={{ left: pct(hp.x * S + S / 2, W), top: pct(hp.y * S + S / 2, H) }} aria-hidden="true" />}
        </div>
      </div>
      {!mini && (
        <div class="worldmap-bar">
          <button class="btn" onClick={() => setZoom(Math.max(1, Math.min(zoom, Math.ceil(z)) - 1))} disabled={zoom <= Math.max(1, Math.ceil(fit))} aria-label="Zoom out">&minus;</button>
          <button class="btn" onClick={() => setZoom(Math.min(6, zoom + 1))} disabled={zoom >= 6} aria-label="Zoom in">+</button>
          <button class="btn" onClick={() => { setFull(!full); setZoom(full ? 3 : 2); }}>{full ? 'Close the map' : 'Open the map'}</button>
        </div>
      )}
      {sel && !mini && (
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
    ? createPortal(<div class="worldmap-overlay" role="dialog" aria-label="The map"><h2 class="worldmap-title">The Known World</h2>{map}</div>, document.body)
    : map;
}
