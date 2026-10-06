// Save format with version field and migration chain.
import type { ContentBundle } from '../content/schema';
import { backfillLordship, nameList } from './lordship';
import type { GameState } from './state';
import { newNpcState } from './effects';

export const SAVE_FORMAT = 'knight-of-adalia-save';
export const SAVE_VERSION = 3;

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  saveVersion: number;
  contentHash: string;
  state: GameState;
}

export class SaveError extends Error {}

/** fromVersion -> function producing the next version's save. */
export const migrations: Record<number, (save: SaveFile) => SaveFile> = {
  // 2 split the force into company, garrison and village levy. Older saves made those choices without the men being counted.
  1: (s) => ({ ...s, saveVersion: 2, state: countOldForce(structuredClone(s.state)) }),
  // 3 remembers how many people the manor held when it was granted (estate.founded).
  2: (s) => ({ ...s, saveVersion: 3, state: rememberFounding(structuredClone(s.state)) }),
};

/** The founding populations given by found_estate in c3_arrival (content/scenes/ch3/01-mortality.yaml). */
function rememberFounding(state: GameState): GameState {
  if (state.estate && state.estate.founded === undefined) {
    state.estate.founded = state.flags.c2_granted_marsalin ? 300 : state.flags.c2_granted_kerval ? 250 : 200;
  }
  return state;
}

function countOldForce(state: GameState): GameState {
  const f = state.flags;
  const res = state.res;
  if (f.c2_paid_men) res.men = (res.men ?? 0) + 2;
  if (f.c3_hired_bandits && !f.c4_iron_core) res.garrison = (res.garrison ?? 0) + 60;
  const drill = state.journal.find((e) => e.scene === 'c3_truce_ends' && /^Train the villagers/.test(e.choice));
  if (drill && !f.c4_manor_company) res.levy = (res.levy ?? 0) + (drill.changes.some((c) => c.startsWith('Command')) || drill.changes.length === 0 ? 52 : 12);
  return state;
}

export function toSave(state: GameState, content: ContentBundle): SaveFile {
  return { format: SAVE_FORMAT, saveVersion: SAVE_VERSION, contentHash: content.hash, state };
}

export interface LoadResult {
  state: GameState;
  warnings: string[];
}

export function fromSave(raw: unknown, content: ContentBundle): LoadResult {
  const warnings: string[] = [];
  if (!raw || typeof raw !== 'object' || (raw as SaveFile).format !== SAVE_FORMAT) throw new SaveError('not a Knight of Adalia save file');
  let save = raw as SaveFile;
  if (typeof save.saveVersion !== 'number' || save.saveVersion > SAVE_VERSION) throw new SaveError(`unsupported save version ${save.saveVersion}`);
  while (save.saveVersion < SAVE_VERSION) {
    const m = migrations[save.saveVersion];
    if (!m) throw new SaveError(`no migration from save version ${save.saveVersion}`);
    save = m(save);
  }
  const state = structuredClone(save.state);

  // Content may have changed since the save was written.
  for (const id of Object.keys(content.registry.npcs)) state.npcs[id] ??= newNpcState(content, id);
  state.aliases ??= {};
  if (!content.scenes[state.scene]) {
    const fallback = state.checkpoint && content.scenes[state.checkpoint] ? state.checkpoint : content.backgrounds[state.background]?.start_scene;
    if (!fallback) throw new SaveError(`scene ${state.scene} no longer exists and no checkpoint is available`);
    warnings.push(`The scene you saved in no longer exists. Resumed from ${fallback}.`);
    // the calendar goes back with the story, or the replayed scenes would happen years late
    const at = state.seen[fallback];
    if (at !== undefined && at < state.time) state.time = at;
    state.scene = fallback;
    state.returnStack = [];
  }
  state.returnStack = state.returnStack.filter((s) => {
    const ok = !!content.scenes[s];
    if (!ok) warnings.push(`Dropped missing scene ${s} from the return stack.`);
    return ok;
  });
  state.queue = state.queue.filter((q) => !!content.scenes[q.event]);
  const lordship = backfillLordship(state, content);
  if (lordship.length) warnings.push(`Your rank now carries its lands and knights: ${nameList(lordship)}.`);
  if (save.contentHash !== content.hash) warnings.push('The game content has been updated since this save was made.');
  state.contentHash = content.hash;
  return { state, warnings };
}
