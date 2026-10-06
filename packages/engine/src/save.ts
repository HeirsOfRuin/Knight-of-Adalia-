// Save format with a version field and a migration chain. Each game makes its own codec
// with makeSaveCodec: its format name, current version and migrations.
import type { CoreContent as ContentBundle } from './schema';
import type { CoreState } from './state';
import { newNpcState } from './effects';
import { gameOf } from './game';

export interface SaveFile<S extends CoreState = CoreState> {
  format: string;
  saveVersion: number;
  contentHash: string;
  state: S;
}

export class SaveError extends Error {}

export interface LoadResult<S extends CoreState = CoreState> {
  state: S;
  warnings: string[];
}

export interface SaveCodecSpec<S extends CoreState> {
  /** the format name written into every save, e.g. knight-of-adalia-save */
  format: string;
  /** the game's name, for "not a ... save file" */
  title: string;
  version: number;
  /** fromVersion -> function producing the next version's save */
  migrations: Record<number, (save: SaveFile<S>) => SaveFile<S>>;
}

export function makeSaveCodec<S extends CoreState>(spec: SaveCodecSpec<S>) {
  function toSave(state: S, content: ContentBundle): SaveFile<S> {
    return { format: spec.format, saveVersion: spec.version, contentHash: content.hash, state };
  }

  function fromSave(raw: unknown, content: ContentBundle): LoadResult<S> {
    const warnings: string[] = [];
    if (!raw || typeof raw !== 'object' || (raw as SaveFile<S>).format !== spec.format) throw new SaveError(`not a ${spec.title} save file`);
    let save = raw as SaveFile<S>;
    if (typeof save.saveVersion !== 'number' || save.saveVersion > spec.version) throw new SaveError(`unsupported save version ${save.saveVersion}`);
    while (save.saveVersion < spec.version) {
      const m = spec.migrations[save.saveVersion];
      if (!m) throw new SaveError(`no migration from save version ${save.saveVersion}`);
      save = m(save);
    }
    const state = structuredClone(save.state);

    // Content may have changed since the save was written.
    for (const id of Object.keys(content.registry.npcs)) state.npcs[id] ??= newNpcState(content, id);
    state.aliases ??= {};
    if (!content.scenes[state.scene]) {
      const fallback = state.checkpoint && content.scenes[state.checkpoint] ? state.checkpoint : gameOf(content).startScene?.(state, content);
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
    if (save.contentHash !== content.hash) warnings.push('The game content has been updated since this save was made.');
    state.contentHash = content.hash;
    return { state, warnings };
  }

  return { toSave, fromSave };
}
