// The dynasty export: the house a finished Knight of Adalia life leaves behind, as the input
// contract for House of Adalia. Plain data with registry ids and display names both, so a reader
// needs no Knight of Adalia content. Encoded as "KOAD1." + base64url of the deflated JSON.
// Written by games/knight/src/game/dynasty.ts, read by games/house/src/game/import.ts.
//
// Changing it: add a field freely. Rename or remove one only with a version bump, and keep a reader for version 1.
import { encodeCode, decodeCode } from '@engine/savecode';

export const DYNASTY_PREFIX = 'KOAD1.';
export const DYNASTY_VERSION = 1;

export interface DynastyHeir {
  name: string;
  sex: 'son' | 'daughter';
  age: number;
  alive: boolean;
  temperament?: string;
  upbringing?: string;
  /** his bond with the child, -5..5 */
  bond: number;
  /** a match made or promised for the child, if any: penhoet, brese, lanzi, valdrenne, royal, chosen, arranged */
  match?: string;
  /** crowned in his father's lifetime */
  crowned?: boolean;
}

export interface DynastyExport {
  kind: 'knight-of-adalia/dynasty';
  version: typeof DYNASTY_VERSION;
  contentHash: string;
  /** the end of the founder's story: the date and how it ended */
  date: { year: number; season: string; king: string; reignYear: number };
  ending: { id: string; label: string };
  founder: {
    name: string;
    background: string;
    role?: string;
    age: number;
    station: string;
    renown: number;
    attributes: Record<string, number>;
    skills: Record<string, number>;
    traits: string[];
    items: string[];
    reputation: Record<string, number>;
  };
  spouse?: { id: string; name: string; alive: boolean };
  heirs: DynastyHeir[];
  realm: {
    /** where the West stands: free (a kingdom or duchy), adalian, or lost. Kept for v1 readers; an Adalian West
     * that lost the war still reads adalian here, so a sequel reads `settlement` instead. */
    west: 'free' | 'adalian' | 'lost' | 'unsettled';
    /** the settlement the war left: a crowned West, a free duchy, Adalia's, or divided between the kings
     * (Valdrenne in the Armance, Adalia in the Salt) after a lost war, whichever side he fought on */
    settlement: 'kingdom' | 'duchy' | 'adalian' | 'partitioned' | 'unsettled';
    /** who rules the West: himself, Queen Mahaut, King Thibaut, the Estates' duchy, the King of Adalia, or the two kings */
    sovereign: 'self' | 'mahaut' | 'thibaut' | 'duchy' | 'adalia' | 'divided' | 'unsettled';
    /** how the War of the West ended */
    war?: 'won' | 'held' | 'lost';
    /** he reigns over it (the crowned ending) */
    reigns: boolean;
    /** 0+ how settled his kingdom is, when he reigns */
    stability?: number;
  };
  lands: {
    manor?: { name: string; people: number; temper: number; defence: number; church: number; salt: number; orchard: number };
    holdings: { id: string; name: string; income: number; temper: number }[];
  };
  wealth: { coin: number; men: number; garrison: number; levy: number };
  /** named people he met: relations as they stand */
  people: { id: string; name: string; alive: boolean; affection: number; respect: number; loyalty: number; follower: boolean }[];
  counters: Record<string, number>;
  /** every story flag set during the life (registry ids) */
  flags: string[];
}

export function encodeDynasty(d: DynastyExport): Promise<string> {
  return encodeCode(DYNASTY_PREFIX, d);
}

export async function decodeDynasty(text: string): Promise<DynastyExport> {
  const d = (await decodeCode(DYNASTY_PREFIX, text)) as DynastyExport;
  if (d?.kind !== 'knight-of-adalia/dynasty') throw new Error('Not a Knight of Adalia dynasty code');
  return d;
}
