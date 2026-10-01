// Calendar: time is an absolute season count from game start (spring of the
// configured regnal year). Age advances with it.
import type { ContentBundle } from '../content/schema';
import type { GameState } from './state';

export function seasonName(state: GameState, content: ContentBundle): string {
  return content.config.seasons[state.time % 4]!;
}

export function regnalYear(state: GameState, content: ContentBundle): number {
  return content.config.start_year + Math.floor(state.time / 4);
}

export function ageOf(state: GameState): number {
  return state.startAge + Math.floor(state.time / 4);
}

export function describeDate(state: GameState, content: ContentBundle): string {
  const s = seasonName(state, content);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}, year ${regnalYear(state, content)} of King ${content.config.regnal_king}`;
}

/** Advance time; heals injuries whose time has run out. Mutates the given (already cloned) state. */
export function advanceSeasons(state: GameState, content: ContentBundle, n: number, changes: string[]): void {
  if (n <= 0) return;
  state.time += n;
  const reg = content.registry.injuries;
  const healed = state.injuries.filter((i) => {
    const d = reg[i.id]?.heals_after;
    return d !== undefined && state.time - i.since >= d;
  });
  for (const h of healed) {
    state.injuries = state.injuries.filter((i) => i !== h);
    changes.push(`${reg[h.id]?.label ?? h.id} has healed`);
    const scar = reg[h.id]?.scar;
    if (scar && !state.traits.includes(scar)) {
      state.traits.push(scar);
      changes.push(`Gained: ${content.registry.traits[scar]?.label ?? scar}`);
    }
  }
}
