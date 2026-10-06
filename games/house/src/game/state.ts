// House of Adalia's state: the engine's CoreState plus the opening, where the West stands, and
// what the house inherited from a Knight of Adalia life.
import type { CoreState } from '@engine/state';
import type { DynastyExport } from '@dynasty/contract';
import type { Frame } from '../content/schema';

export type { Character, Sex } from '@engine/state';

/** The id of the founder in state.characters, as in Knight of Adalia. */
export const FOUNDER_ID = 'founder';

export interface Realm {
  /** where the West stands now */
  west: Frame;
  /** who rules it (registry sovereigns) */
  sovereign: string;
  /** how many times the West has changed frame or sovereign in play (the frame doc allows one per book) */
  changes: number;
}

export interface HouseState extends CoreState {
  opening: string;
  realm: Realm;
  /** the Knight of Adalia life this house continues, as exported; absent in a fresh start */
  inheritance?: DynastyExport;
}
