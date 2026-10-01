// Save format with version field and migration chain.
import type { ContentBundle } from '../content/schema';
import type { GameState } from './state';
import { newNpcState } from './effects';

export const SAVE_FORMAT = 'knight-of-adalia-save';
export const SAVE_VERSION = 1;

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  saveVersion: number;
  contentHash: string;
  state: GameState;
}

export class SaveError extends Error {}

/** fromVersion -> function producing the next version's save. */
export const migrations: Record<number, (save: SaveFile) => SaveFile> = {
  // 1: (s) => ({ ...s, saveVersion: 2, state: { ...s.state, newField: default } }),
};

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
  if (!content.scenes[state.scene]) {
    const fallback = state.checkpoint && content.scenes[state.checkpoint] ? state.checkpoint : content.backgrounds[state.background]?.start_scene;
    if (!fallback) throw new SaveError(`scene ${state.scene} no longer exists and no checkpoint is available`);
    warnings.push(`The scene you saved in no longer exists. Resumed from ${fallback}.`);
    state.scene = fallback;
    state.returnStack = [];
  }
  state.returnStack = state.returnStack.filter((s) => {
    const ok = !!content.scenes[s];
    if (!ok) warnings.push(`Dropped missing scene ${s} from the return stack.`);
    return ok;
  });
  state.queue = state.queue.filter((q) => !!content.scenes[q.event]);
  if (save.contentHash !== content.hash) warnings.push('The game content has been updated since this save was made.');
  state.contentHash = content.hash;
  return { state, warnings };
}
