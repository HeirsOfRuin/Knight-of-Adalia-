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
}

export type SuitStatus = 'hidden' | 'known' | 'courted' | 'available' | 'married' | 'lost';
export interface SuitState {
  status: SuitStatus;
  regard: number; // her own feeling, -10..10
  family: number; // guardian acceptance, -10..10
  discretion: number; // 0..10, low = exposed
  pledge: 'none' | 'token' | 'understanding';
}

export interface ActiveInjury {
  id: string;
  since: number; // absolute season index
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

export interface GameState {
  version: 1;
  contentHash: string;
  seed: number;
  rng: RngState;
  name: string;
  background: string;
  role?: string;
  chapter: string;
  scene: string;
  /** continuation stack for interludes (pool and queued events) */
  returnStack: string[];
  /** absolute season count since game start; 0 = start season */
  time: number;
  startAge: number;
  attributes: Record<string, number>;
  skills: Record<string, number>;
  health: number; // 1..10
  traits: string[];
  injuries: ActiveInjury[];
  items: string[];
  station: string;
  track?: string;
  rep: Record<string, number>;
  res: Record<string, number>; // coin (pence), supplies, horses, renown
  favors: Record<string, number>; // + owed to him, - he owes
  flags: Record<string, true>;
  counters: Record<string, number>;
  npcs: Record<string, NpcState>;
  suits: Record<string, SuitState>;
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
