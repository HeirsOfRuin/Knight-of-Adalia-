// Knight of Adalia's engine facade: its own newGame (a hero from a background), and the
// engine's view and choose for its state. Importing this registers the game module.
import './module';
import type { ContentBundle } from '../content/schema';
import type { GameState } from './state';
import { RngCursor, seedRng } from '@engine/rng';
import { newNpcState } from '@engine/effects';
import { enterScene } from '@engine/director';
import { EngineError } from '@engine/index';
import { bornAtAge } from '@engine/character';
import { HERO_ID } from './state';

export { EngineError, view, choose, visibleChoices, isAvailable, mergeChanges } from '@engine/index';
export type { ChoiceView, SceneView, ChooseOptions, ChooseResult } from '@engine/index';
export { describeDate } from '@engine/calendar';
export { formatCoin } from '@engine/format';
export type { GameState } from './state';
export { heroOf } from '@engine/character';

export interface NewGameOptions {
  background: string;
  seed: number;
  name: string;
  role?: string;
}

export function newGame(content: ContentBundle, opts: NewGameOptions): GameState {
  const bg = content.backgrounds[opts.background];
  if (!bg) throw new EngineError(`unknown background ${opts.background}`);
  const rng = new RngCursor(seedRng(opts.seed));
  const roleIds = Object.keys(bg.roles ?? {});
  const role = roleIds.length ? (opts.role && roleIds.includes(opts.role) ? opts.role : roleIds[rng.int(roleIds.length)]) : undefined;
  const roleDef = role ? bg.roles![role] : undefined;

  const attributes = Object.fromEntries(content.config.attributes.map((a) => [a, bg.attributes[a] ?? 1]));
  const skills = Object.fromEntries(content.config.skills.map((s) => [s, (bg.skills[s] ?? 0) + (roleDef?.skills[s] ?? 0)]));
  const flags: Record<string, true> = {};
  for (const f of [...bg.flags, ...(roleDef?.flags ?? [])]) flags[f] = true;
  for (const group of bg.random_flags) flags[group[rng.int(group.length)]!] = true;

  const npcs = Object.fromEntries(Object.keys(content.registry.npcs).map((id) => [id, newNpcState(content, id)]));
  for (const [id, r] of Object.entries(bg.relationships)) {
    const n = (npcs[id] ??= newNpcState(content, id));
    n.affection = r.affection;
    n.respect = r.respect;
    n.met = true;
  }
  const rep = Object.fromEntries(Object.keys(content.registry.factions).map((f) => [f, bg.rep[f] ?? 0]));

  const state: GameState = {
    version: 1,
    contentHash: content.hash,
    seed: opts.seed,
    rng: rng.state,
    characters: {
      [HERO_ID]: {
        name: opts.name.trim() || 'Wat',
        sex: 'male',
        born: bornAtAge(bg.start_age),
        alive: true,
        attributes,
        skills,
        health: 10,
        traits: [...bg.traits],
        injuries: [],
        items: [...bg.items],
        station: content.config.stations[0]!,
      },
    },
    hero: HERO_ID,
    background: bg.id,
    role,
    chapter: content.scenes[bg.start_scene]?.chapter ?? content.config.chapters[0]!,
    scene: bg.start_scene,
    returnStack: [],
    time: 0,
    rep,
    res: { coin: bg.coin, supplies: 0, horses: 0, renown: 0 },
    favors: {},
    flags,
    counters: {},
    npcs,
    aliases: { ...bg.aliases },
    suits: {},
    queue: [],
    seen: {},
    journal: [],
  };
  const start = content.scenes[bg.start_scene];
  if (!start) throw new EngineError(`background ${bg.id}: unknown start scene ${bg.start_scene}`);
  enterScene(state, content, start, [], rng);
  state.rng = rng.state;
  return state;
}

