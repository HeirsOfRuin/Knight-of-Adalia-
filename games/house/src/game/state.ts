// House of Adalia's state: the engine's CoreState plus the opening, where the West stands, and
// what the house inherited from a Knight of Adalia life.
import type { CoreState } from '@engine/state';
import type { DynastyExport } from '@dynasty/contract';
import type { Frame, HouseLaw } from '../content/schema';

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
  /** the regnal year the sovereign's reign is dated from, when it began in play (a new king of the house) */
  from?: number;
}

/** The house's own id in Character.house; a married-in spouse keeps the house they were born to. */
export const HOUSE_ID = 'player';

/** Something the year brought, told in the next news scene (h_q_news). */
export interface News {
  kind: 'death' | 'birth' | 'match' | 'majority';
  /** the character it is about */
  who: string;
  /** a death's cause; a birth whose mother died in it */
  cause?: string;
  childbed?: boolean;
  at: number;
}

export interface ChronicleEntry {
  /** the head's character id */
  who: string;
  name: string;
  /** regnal years */
  from: number;
  to: number;
  lines: string[];
}

export interface Family {
  /** the law the headship passes by */
  law: HouseLaw;
  /** the heir the head has named by will, if any */
  will?: string;
  /** who governs for a head under age */
  regent?: string;
  /** news waiting to be told; current is the one being told now */
  news: News[];
  current?: News;
  /** the next generated character id (c<n>) */
  next: number;
  /** 1 for the founder; one more at each succession */
  generation: number;
  /** season index the head took the headship */
  since: number;
  /** season index a member of the house was last offered a match, by id */
  offered: Record<string, number>;
  extinct?: boolean;
  /** how the last head who stepped down went: the handover's manner (cloister, or one at home) */
  manner?: string;
}

/** The house's own manor (Knight of Adalia's estate): people, grain in seasons, temper -5..5, improvements 0..10. */
export interface Estate {
  name: string;
  people: number;
  food: number;
  temper: number;
  defence: number;
  church: number;
  salt: number;
  orchard: number;
  /** people when the house came to it: growth slows once it is full again */
  founded: number;
}

/** Another holding: its income in pence a year, paid at Michaelmas, and its temper. */
export interface Holding { name: string; income: number; temper: number }

/** A knight who holds land of the house; heir: his son holds now, as a minor (in wardship) or grown. */
export interface Vassal { id: string; name: string; seat: string; heir?: 'minor' | 'grown' }

export interface HouseState extends CoreState {
  opening: string;
  realm: Realm;
  family: Family;
  chronicle: ChronicleEntry[];
  /** the Knight of Adalia life this house continues, as exported; absent in a fresh start */
  inheritance?: DynastyExport;
  /** the lands and the knights (economy.ts); absent for a house with none */
  estate?: Estate;
  holdings?: Record<string, Holding>;
  vassals?: Vassal[];
  /** the rival houses (houses.ts, registry/houses.yaml); filled in on first read for older saves */
  houses?: Record<string, { standing: number; temper: number; claim: number }>;
}
