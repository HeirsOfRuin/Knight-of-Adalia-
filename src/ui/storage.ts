// Browser persistence. Every access is guarded: storage can be missing or throw.
import type { ContentBundle } from '../content/schema';
import type { GameState } from '../engine/state';
import { toSave, fromSave, type LoadResult } from '../engine/save';

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

export function exportSave(state: GameState, content: ContentBundle): void {
  const blob = new Blob([JSON.stringify(toSave(state, content), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `adalia-${state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${state.time}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importSave(file: File, content: ContentBundle): Promise<LoadResult> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  return fromSave(raw, content);
}
