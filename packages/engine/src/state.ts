// GameState: plain JSON-serialisable data. Engine functions never mutate an
// input state; they clone, change the clone, and return it.

export type RngState = [number, number, number, number];

export interface NpcState {
  met: boolean;
  alive: boolean;
  affection: number; // -10..10
  respect: number; // -10..10
  loyalty: number; // -10..10, meaningful for followers and liege
  grudges: string[];
  /** serves in his retinue */
  follower?: boolean;
  /** season index of his death (recorded from v3 saves on; older deaths have none) */
  diedAt?: number;
}

export interface ActiveInjury {
  id: string;
  since: number; // absolute season index
}

export type Sex = 'male' | 'female';

/**
 * A person the player can play: the hero now, and in a game of generations the heirs who
 * succeed. The hero is state.characters[state.hero]; paths with no character named (attr.wits,
 * health, station) read the hero.
 */
export interface Character {
  name: string;
  sex: Sex;
  /** absolute season index of birth; before game start it is negative (age = whole years since) */
  born: number;
  alive: boolean;
  /** season index of death */
  died?: number;
  attributes: Record<string, number>;
  skills: Record<string, number>;
  health: number; // 1..10
  traits: string[];
  injuries: ActiveInjury[];
  items: string[];
  station: string;
  track?: string;
  // ---- family (games of generations; Knight of Adalia leaves these unset) ----
  /** character ids */
  father?: string;
  mother?: string;
  spouse?: string;
  /** false for a bastard not legitimated */
  legitimate?: boolean;
  /** bold, bookish, merry, grave */
  temperament?: string;
  upbringing?: string;
  /** with the head of the family, -5..5 */
  bond?: number;
  /** the house the character belongs to (a game's own ids) */
  house?: string;
  /** gave up the headship alive (stepped down) */
  retired?: boolean;
}

export interface QueuedEvent {
  event: string;
  dueAt: number; // absolute season index
  earliestChapter?: string;
  origin: { scene: string; choice: string; at: number; text: string };
}

export interface JournalEntry {
  at: number; // absolute season index
  scene: string;
  sceneTitle?: string;
  choice: string;
  outcome?: string;
  changes: string[];
  cause?: { scene: string; choice: string; at: number; text: string };
}

/** The state every game on this engine keeps. A game's own state extends it (src/game/state.ts). */
export interface CoreState {
  version: 1;
  contentHash: string;
  seed: number;
  rng: RngState;
  /** everyone the player can play, by id */
  characters: Record<string, Character>;
  /** the id of the character the player plays now */
  hero: string;
  chapter: string;
  scene: string;
  /** continuation stack for interludes (pool and queued events) */
  returnStack: string[];
  /** absolute season count since game start; 0 = start season */
  time: number;
  rep: Record<string, number>;
  res: Record<string, number>; // coin (pence), supplies, horses, renown
  favors: Record<string, number>; // + owed to him, - he owes
  flags: Record<string, true>;
  counters: Record<string, number>;
  npcs: Record<string, NpcState>;
  /** alias -> npc id, e.g. master -> hamon_darrell */
  aliases: Record<string, string>;
  queue: QueuedEvent[];
  /** scene id -> last time played (for once/cooldown) */
  seen: Record<string, number>;
  journal: JournalEntry[];
  /** text of the most recent outcome, shown above the next scene */
  lastOutcome?: { text?: string; changes: string[]; check?: { band: string; result: string } };
  ended?: { ending: string; cause?: string };
  /** set while a queued event plays: the earlier choice that caused it */
  activeCause?: QueuedEvent['origin'];
  /** last checkpoint scene entered; save fallback if content changes */
  checkpoint?: string;
}
