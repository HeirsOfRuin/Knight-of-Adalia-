// The game module: what a game on this engine supplies beyond its content. The engine owns
// the general rules (conditions, effects, text, checks, the calendar, the director, saves);
// a game adds its own state paths, effect ops, text variables, seasonal upkeep and the
// modifiers that depend on who its hero is. A content bundle names its module by id
// (content.game); the module registers itself when the game's code is loaded.
//
// Hooks receive the engine's CoreState and CoreContent; a game casts them to its own types.
import type { Audience, CoreContent, GameEffect } from './schema';
import type { CoreState } from './state';
import type { RngCursor } from './rng';

export type Value = number | string | boolean | undefined;

export interface EffectCtx {
  scene: string;
  choice: string;
  choiceText: string;
  changes: string[];
  /** needed for random casualties; absent in contexts that cannot draw */
  rng?: RngCursor;
}

/** Records one stakes item (see stakes.ts): a key, a label, a rank and the direction of the change. */
export type StakesPut = (key: string, label: string, rank: number, sign?: number) => void;

export const STAKES_RANK = { life: 0, battle: 1, station: 2, men: 3, renown: 4, rep: 5, rel: 6, family: 6, manor: 7, coin: 8, skill: 9, other: 10, remembered: 11 } as const;

export interface GameModule {
  id: string;

  // ---- state paths (conditions, effects, text) -------------------------------------
  /** path namespaces the game owns, e.g. estate, heir; the engine hands these to the hooks below */
  namespaces: readonly string[];
  /** value of a path in one of the game's namespaces (already dereferenced) */
  getValue(state: CoreState, content: CoreContent, path: string): Value;
  /** static check of such a path against the registry: an error message or null */
  checkPath(content: CoreContent, path: string): string | null;
  /** human label for such a path; undefined falls back to the engine's default */
  labelFor?(content: CoreContent, path: string): string | undefined;
  /** ordinal scale for identifier comparisons on such a path */
  ordinalFor?(content: CoreContent, path: string): string[] | undefined;
  /** the named values a path may be compared with (for paths with no ordinal scale) */
  namedValues?(content: CoreContent, path: string, value: string): string[] | undefined;
  /** requirement label for a comparison the game words itself (background == reeve) */
  comparisonLabel?(content: CoreContent, path: string, op: string, value: string | number | boolean): string | undefined;
  /** add: { path: delta } on such a path */
  addNumber?(state: CoreState, content: CoreContent, path: string, delta: number, changes: string[]): void;
  /** assign: { path: value } on such a path */
  assignValue?(state: CoreState, content: CoreContent, path: string, value: string | number | boolean): void;

  // ---- effects ------------------------------------------------------------------------
  /** the game's own effect ops, keyed by op name; a handler returns true if the hero died */
  effects: Record<string, (state: CoreState, content: CoreContent, effect: GameEffect, ctx: EffectCtx) => boolean | void>;
  /** what one of the game's effects puts at stake (stakes.ts) */
  stakesOf?(content: CoreContent, state: CoreState, effect: GameEffect, put: StakesPut): void;
  /** what an add on one of the game's paths puts at stake; sign is the direction of the change */
  stakesOfAdd?(content: CoreContent, path: string, sign: number, put: StakesPut): void;
  /** the stakes rank of a labelled counter (config.counter_labels) */
  counterRank?(counter: string): number | undefined;

  // ---- text ---------------------------------------------------------------------------
  /** {var} names the game renders itself; return undefined for a name that is not the game's */
  textVar?(name: string, state: CoreState, content: CoreContent): string | undefined;
  /** static check of a {var}: errors, or undefined for a name that is not the game's */
  checkTextVar?(name: string, content: CoreContent): string[] | undefined;
  /** which entry of scene.variants replaces a scene's text for this run */
  variantKey?(state: CoreState): string | undefined;

  // ---- characters ---------------------------------------------------------------------
  /** words that name a character in paths and text (heir, spouse, eldest): heir.age, {heir.name}, {heir.He} */
  characterSelectors?: readonly string[];
  /** the id of the character a selector names now, or undefined for nobody */
  selectCharacter?(state: CoreState, content: CoreContent, selector: string): string | undefined;
  /** the hero has died: true if play goes on (the game has queued what follows), false or absent to end the game */
  onHeroDeath?(state: CoreState, content: CoreContent, cause: string, ctx: EffectCtx): boolean;

  // ---- time, checks, places, cards ------------------------------------------------------
  /** upkeep each season as the calendar advances (rents, harvests, pay); rng is absent where nothing may be drawn */
  onSeason?(state: CoreState, content: CoreContent, changes: string[], rng?: RngCursor): void;
  /** the modifier a check's audience applies to this hero, with its label */
  audience?(state: CoreState, content: CoreContent, audience: Audience): { label: string; value: number } | undefined;
  /** a scene place reference (@home) resolved for this run: a place id, undefined for none, or the ref itself if unknown */
  resolvePlace?(ref: string, state: CoreState): string | undefined;
  /** chapter card rows after Station (household, lands) */
  cardRows?(content: CoreContent, state: CoreState): [string, string][];
  /** chapter card lines for what the years since `from` brought (births) */
  cardBorn?(content: CoreContent, state: CoreState, from: number): string[];
  /** chapter card names of the game's own dead since `from` (children) */
  cardDead?(content: CoreContent, state: CoreState, from: number): string[];

  /** whose reign dates are counted in, titled ("Queen Mahaut"), and the year of it; undefined uses config.reigns */
  reign?(state: CoreState, content: CoreContent): { ruler: string; year: number } | undefined;

  // ---- saves ----------------------------------------------------------------------------
  /** where a save resumes when its scene and checkpoint are both gone */
  startScene?(state: CoreState, content: CoreContent): string | undefined;
}

const games = new Map<string, GameModule>();

export function registerGame(game: GameModule): void {
  games.set(game.id, game);
}

/** The module for a content bundle. Throws if the game's code was never loaded. */
export function gameOf(content: CoreContent): GameModule {
  const g = games.get(content.game);
  if (!g) throw new Error(`game module "${content.game}" is not registered; load the game's module before its content`);
  return g;
}
