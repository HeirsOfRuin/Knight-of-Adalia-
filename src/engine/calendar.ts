// Calendar: time is an absolute season count from game start (spring of the
// configured regnal year). Age advances with it.
import type { ContentBundle } from '../content/schema';
import type { GameState } from './state';
import { estateTick } from './estate';

export function seasonName(state: GameState, content: ContentBundle): string {
  return content.config.seasons[state.time % 4]!;
}

export function regnalYear(state: GameState, content: ContentBundle): number {
  return content.config.start_year + Math.floor(state.time / 4);
}

export function ageOf(state: GameState): number {
  return state.startAge + Math.floor(state.time / 4);
}

/** The reign a date falls in, and the year of that reign (internal years stay continuous). */
/** A reign tied to a scene (the old king's death) begins the year after that scene is played; until then it has not begun. */
/** The player's own reign (king: '@self') begins in the year its scene is played, not the year after. */
function reignStart(state: GameState, content: ContentBundle, r: { king: string; from_year: number; from_scene?: string }): number {
  if (!r.from_scene) return r.from_year;
  const at = state.seen[r.from_scene];
  return at === undefined ? Infinity : content.config.start_year + Math.floor(at / 4) + (r.king === '@self' ? 0 : 1);
}

/** Season count of a regnal date (years counted continuously from the game's first king). */
export function timeOf(content: ContentBundle, year: number, season: string): number {
  return (year - content.config.start_year) * 4 + Math.max(0, content.config.seasons.indexOf(season));
}

export function reignOf(state: GameState, content: ContentBundle): { king: string; year: number } {
  const y = regnalYear(state, content);
  const r = [...content.config.reigns].map((x) => ({ ...x, from_year: reignStart(state, content, x) })).reverse().find((x) => y >= x.from_year);
  return r ? { king: r.king === '@self' ? state.name : r.king, year: y - r.from_year + 1 } : { king: content.config.regnal_king, year: y };
}

export function describeDate(state: GameState, content: ContentBundle): string {
  const s = seasonName(state, content);
  const r = reignOf(state, content);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}, year ${r.year} of King ${r.king}`;
}

/** Advance time; heals injuries whose time has run out. Mutates the given (already cloned) state. */
export function advanceSeasons(state: GameState, content: ContentBundle, n: number, changes: string[]): void {
  if (n <= 0) return;
  for (let i = 0; i < n; i++) {
    state.time += 1;
    estateTick(state, changes);
  }
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
