// Knight of Adalia's state: the engine's CoreState plus what this game alone keeps,
// the background, the suits of the women he courts, the manor, his children and holdings.
import type { CoreState } from '@engine/state';

export type { RngState, NpcState, ActiveInjury, QueuedEvent, JournalEntry, Character, Sex } from '@engine/state';

export type SuitStatus = 'hidden' | 'known' | 'courted' | 'available' | 'married' | 'lost';
export interface SuitState {
  status: SuitStatus;
  regard: number; // her own feeling, -10..10
  family: number; // guardian acceptance, -10..10
  discretion: number; // 0..10, low = exposed
  pledge: 'none' | 'token' | 'understanding';
}

export interface Heir {
  name: string; // '' until named
  sex: 'son' | 'daughter';
  born: number; // absolute season index
  alive: boolean;
  /** drawn at birth (Ch4 growth): bold, bookish, merry, grave */
  temperament?: string;
  /** set at the growth periods: home, page, church, arms, letters, court */
  upbringing?: string;
  /** his bond with the child, -5..5 */
  bond?: number;
  /** season index of the child's death */
  died?: number;
}

export interface Holding {
  income: number; // pence a year, paid at Michaelmas
  temper: number; // -5..5
}

/** The id of the hero in state.characters: the commoner who founds the house. */
export const HERO_ID = 'founder';

export interface GameState extends CoreState {
  background: string;
  role?: string;
  suits: Record<string, SuitState>;
  /** the manor he holds, from Ch3 (see estate.ts) */
  estate?: Record<string, number>;
  /** his children, eldest first (Ch3+) */
  heirs?: Heir[];
  /** other holdings beyond the first manor (Ch4+), by registry id */
  holdings?: Record<string, Holding>;
}
