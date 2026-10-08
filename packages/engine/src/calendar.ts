// Calendar: time is an absolute season count from game start (spring of the
// configured regnal year). Age advances with it.
import { heroOf, ageOfCharacter } from './character';
import type { CoreContent as ContentBundle } from './schema';
import type { CoreState as GameState } from './state';
import { gameOf } from './game';
import type { RngCursor } from './rng';

export function seasonName(state: GameState, content: ContentBundle): string {
  return content.config.seasons[state.time % 4]!;
}

export function regnalYear(state: GameState, content: ContentBundle): number {
  return content.config.start_year + Math.floor(state.time / 4);
}

/** The hero's age in whole years. */
export function ageOf(state: GameState): number {
  return ageOfCharacter(state, heroOf(state));
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
  return r ? { king: r.king === '@self' ? heroOf(state).name : r.king, year: y - r.from_year + 1 } : { king: content.config.regnal_king, year: y };
}

/** Whose reign the date is counted in, with the ruler's title ("King Edwin"), and the year of it. A game may date by its own sovereign (GameModule.reign). */
export function reignTitle(state: GameState, content: ContentBundle): { ruler: string; year: number } {
  const own = gameOf(content).reign?.(state, content);
  if (own) return own;
  const r = reignOf(state, content);
  return { ruler: `King ${r.king}`, year: r.year };
}

export function describeDate(state: GameState, content: ContentBundle): string {
  const own = gameOf(content).date?.(state, content);
  if (own !== undefined) return own;
  const s = seasonName(state, content);
  const r = reignTitle(state, content);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}, year ${r.year} of ${r.ruler}`;
}

/** Advance time; heals injuries whose time has run out. Mutates the given (already cloned) state. */
export function advanceSeasons(state: GameState, content: ContentBundle, n: number, changes: string[], rng?: RngCursor): void {
  if (n <= 0) return;
  const onSeason = gameOf(content).onSeason;
  for (let i = 0; i < n; i++) {
    state.time += 1;
    onSeason?.(state, content, changes, rng);
  }
  const reg = content.registry.injuries;
  const healed = heroOf(state).injuries.filter((i) => {
    const d = reg[i.id]?.heals_after;
    return d !== undefined && state.time - i.since >= d;
  });
  for (const h of healed) {
    heroOf(state).injuries = heroOf(state).injuries.filter((i) => i !== h);
    changes.push(`${reg[h.id]?.label ?? h.id} has healed`);
    const scar = reg[h.id]?.scar;
    if (scar && !heroOf(state).traits.includes(scar)) {
      heroOf(state).traits.push(scar);
      changes.push(`Gained: ${content.registry.traits[scar]?.label ?? scar}`);
    }
  }
}
