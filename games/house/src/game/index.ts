// House of Adalia's engine facade: a new house from an opening and a frame, or from a Knight of
// Adalia dynasty export (import.ts), and the engine's view and choose for its state.
// Importing this registers the game module.
import './module';
import type { ContentBundle, Frame } from '../content/schema';
import { FOUNDER_ID, HOUSE_ID, type HouseState } from './state';
import { bear, marry, nameChild, person } from './family';
import { RngCursor, seedRng } from '@engine/rng';
import { newNpcState } from '@engine/effects';
import { enterScene } from '@engine/director';
import { bornAtAge } from '@engine/character';
import { EngineError } from '@engine/index';
import type { Character, Sex } from '@engine/state';

export { EngineError, view, choose, visibleChoices, isAvailable } from '@engine/index';
export type { ChoiceView, SceneView, ChooseResult } from '@engine/index';
export { describeDate } from '@engine/calendar';
export { heroOf } from '@engine/character';
export type { HouseState } from './state';

export interface NewHouseOptions {
  opening: string;
  frame: Frame;
  /** who rules the West; defaults to the opening's first for the frame */
  sovereign?: string;
  seed: number;
  name: string;
  sex?: Sex;
}

/** Throws unless the opening can start in this frame under this sovereign (the nine combinations, FRAME.md §2). */
export function checkStart(content: ContentBundle, opening: string, frame: Frame, sovereign?: string): string {
  const op = content.openings[opening];
  if (!op) throw new EngineError(`unknown opening ${opening}`);
  if (!op.frames.includes(frame)) throw new EngineError(`${op.label} does not start in ${content.registry.frames[frame]?.label ?? frame}`);
  const allowed = op.sovereigns[frame] ?? [];
  const sov = sovereign ?? allowed[0];
  if (!sov || !allowed.includes(sov)) throw new EngineError(`${op.label} in ${frame}: sovereign must be one of ${allowed.join(', ')}`);
  return sov;
}

/** Every opening, frame and sovereign a house can start with. */
export function startsOf(content: ContentBundle): { opening: string; frame: Frame; sovereign: string }[] {
  return Object.values(content.openings).flatMap((op) => op.frames.flatMap((frame) => (op.sovereigns[frame] ?? []).map((sovereign) => ({ opening: op.id, frame, sovereign }))));
}

/** A fresh house: the founder from the opening's defaults. */
export function newGame(content: ContentBundle, opts: NewHouseOptions): HouseState {
  const op = content.openings[opts.opening];
  const sovereign = checkStart(content, opts.opening, opts.frame, opts.sovereign);
  const f = op!.founder;
  const founder: Character = {
    name: opts.name.trim() || 'Wat',
    sex: opts.sex ?? 'male',
    born: bornAtAge(f.age),
    alive: true,
    attributes: Object.fromEntries(content.config.attributes.map((a) => [a, f.attributes[a] ?? 2])),
    skills: Object.fromEntries(content.config.skills.map((s) => [s, f.skills[s] ?? 0])),
    health: 8,
    traits: [],
    injuries: [],
    items: [],
    station: f.station,
    house: HOUSE_ID,
  };
  return begin(content, opts.seed, op!.id, opts.frame, sovereign, founder, { coin: f.coin, supplies: 0, horses: 0, renown: f.renown, men: f.men }, {}, freshFamily);
}

/** A fresh founder's family, from the life table's founder_family: a spouse (living or not) and children. */
function freshFamily(s: HouseState, content: ContentBundle, rng: RngCursor): void {
  const ff = content.registry.life.founder_family;
  const founder = s.characters[FOUNDER_ID]!;
  const spouse = marry(s, content, FOUNDER_ID, 'valdrennish', undefined, rng);
  const sp = s.characters[spouse]!;
  sp.born = founder.born + (founder.sex === 'male' ? 4 * (4 + rng.int(6)) : -4 * (1 + rng.int(4)));
  const [lo, hi] = ff.children;
  const n = lo + rng.int(hi - lo + 1);
  const years = Array.from({ length: n }, () => ff.born[0] + rng.int(ff.born[1] - ff.born[0] + 1)).sort((a, b) => a - b);
  const [mother, father] = founder.sex === 'female' ? [FOUNDER_ID, spouse] : [spouse, FOUNDER_ID];
  for (const y of years) {
    const id = bear(s, content, mother, father, undefined, rng);
    s.characters[id]!.born = (y - content.config.start_year) * 4;
    nameChild(s, content, id, rng.int(3) === 0 ? 'grandparent' : 'culture', rng);
  }
  if (rng.int(100) >= ff.spouse_alive) { sp.alive = false; sp.died = -4 * (1 + rng.int(6)); }
}

/** Fills the rest of a state, builds the family, and enters the opening's first scene. */
export function begin(
  content: ContentBundle, seed: number, opening: string, frame: Frame, sovereign: string, founder: Character, res: Record<string, number>,
  extra: Partial<HouseState> = {}, family?: (s: HouseState, content: ContentBundle, rng: RngCursor) => void,
): HouseState {
  const op = content.openings[opening]!;
  const rng = new RngCursor(seedRng(seed));
  founder.house = HOUSE_ID;
  const state: HouseState = {
    version: 1,
    contentHash: content.hash,
    seed,
    rng: rng.state,
    characters: { [FOUNDER_ID]: founder },
    hero: FOUNDER_ID,
    opening,
    realm: { west: frame, sovereign, changes: 0 },
    family: { law: op.law, news: [], next: 1, generation: 1, since: 0, offered: {} },
    chronicle: [],
    chapter: content.scenes[op.start_scene]?.chapter ?? content.config.chapters[0]!,
    scene: op.start_scene,
    returnStack: [],
    time: 0,
    rep: Object.fromEntries(Object.keys(content.registry.factions).map((id) => [id, 0])),
    res,
    favors: {},
    flags: {},
    counters: {},
    npcs: Object.fromEntries(Object.keys(content.registry.npcs).map((id) => [id, newNpcState(content, id)])),
    aliases: {},
    queue: [],
    seen: {},
    journal: [],
    ...extra,
  };
  family?.(state, content, rng);
  const start = content.scenes[op.start_scene];
  if (!start) throw new EngineError(`opening ${opening}: unknown start scene ${op.start_scene}`);
  enterScene(state, content, start, [], rng);
  state.rng = rng.state;
  return state;
}
