// Browser persistence. Every access is guarded: storage can be missing or throw.
import type { ContentBundle } from '../content/schema';
import type { GameState } from '../engine/state';
import { toSave, fromSave, type LoadResult } from '../engine/save';
import { decodeSaveCode } from '../engine/savecode';

const AUTOSAVE_KEY = 'knight-of-adalia.autosave.v1';

export function randomSeed(): number {
  return (Math.random() * 2 ** 31) >>> 0;
}

export function writeAutosave(state: GameState, content: ContentBundle): boolean {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(toSave(state, content)));
    return true;
  } catch {
    return false;
  }
}

export function readAutosave(content: ContentBundle): LoadResult | undefined {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? fromSave(JSON.parse(raw), content) : undefined;
  } catch {
    return undefined;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    /* ignore */
  }
}

interface DownloadsApi { save(r: { filename: string; data: string }): Promise<unknown> }
type ClaudeHost = { use?: (name: string) => Promise<unknown> };

/** Inside the claude.ai artifact viewer, downloads go through its `downloads` capability. */
async function hostDownloads(): Promise<DownloadsApi | null> {
  const host = (globalThis as { claude?: ClaudeHost }).claude;
  if (!host?.use) return null;
  try {
    return (await host.use('downloads')) as DownloadsApi | null;
  } catch {
    return null;
  }
}

/** Returns a message for the player, or undefined when the browser handled it. */
export async function exportSave(state: GameState, content: ContentBundle): Promise<string | undefined> {
  const data = JSON.stringify(toSave(state, content));
  const filename = `adalia-${state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'save'}-${state.time}.json`;
  const host = await hostDownloads();
  if (host) {
    try {
      await host.save({ filename, data });
      return undefined;
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'declined') return 'Download cancelled.';
      return 'This page cannot save files here. Use Save as text instead.';
    }
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return undefined;
}

export async function importSave(file: File, content: ContentBundle): Promise<LoadResult> {
  return importSaveText(await file.text(), content);
}

export async function importSaveText(text: string, content: ContentBundle): Promise<LoadResult> {
  return fromSave(await decodeSaveCode(text), content);
}
