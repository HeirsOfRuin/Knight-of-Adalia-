// Dynasty export: the house a finished life leaves behind, as the input contract for a
// sequel that continues the family (docs/DESIGN.md, "Dynasty export"). Plain data with
// registry ids and display names both, so a reader needs no Knight of Adalia content.
// Encoded as "KOAD1." + base64url of the deflated JSON.
import type { ContentBundle } from '../content/schema';
import { vassalName } from './lordship';
import type { GameState } from './state';
import { ageOf, reignOf, regnalYear, seasonName } from './calendar';
import { forceOf } from './paths';
import { encodeCode, decodeCode } from './savecode';

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
    /** where the West stands: free (a kingdom or duchy), adalian, or lost */
    west: 'free' | 'adalian' | 'lost' | 'unsettled';
    /** he reigns over it (the crowned ending) */
    reigns: boolean;
    /** 0+ how settled his kingdom is, when he reigns */
    stability?: number;
  };
  lands: {
    manor?: { name: string; people: number; temper: number; defence: number; church: number; salt: number; orchard: number };
    holdings: { id: string; name: string; income: number; temper: number }[];
    /** knights who hold of him (registry/vassals.yaml); optional so older v1 codes still read */
    vassals?: { id: string; name: string; heir: boolean }[];
  };
  wealth: { coin: number; men: number; garrison: number; levy: number };
  /** named people he met: relations as they stand */
  people: { id: string; name: string; alive: boolean; affection: number; respect: number; loyalty: number; follower: boolean }[];
  counters: Record<string, number>;
  /** every story flag set during the life (registry ids) */
  flags: string[];
}

function heirMatch(state: GameState, index: number): string | undefined {
  const f = state.flags;
  if (index === 0) {
    if (f.c5r_peace_marriage) return 'valdrenne';
    if (f.c5k_marriage) return 'royal';
    if (f.c4_daughter_chose) return 'chosen';
    if (f.c4_daughter_matched) return 'arranged';
  }
  if (index === 1) {
    if (f.c5_betrothed_penhoet) return 'penhoet';
    if (f.c5_betrothed_brese) return 'brese';
    if (f.c5_betrothed_lanzi) return 'lanzi';
  }
  return undefined;
}

export function toDynasty(state: GameState, content: ContentBundle): DynastyExport {
  const reg = content.registry;
  const reign = reignOf(state, content);
  const f = state.flags;
  const living = (state.heirs ?? []).filter((h) => h.alive);
  const sp = state.aliases.spouse;
  const force = forceOf(state);
  const grant = f.c2_granted_marsalin ? 'Marsalin' : f.c2_granted_kerval ? 'Kerval' : f.c2_granted_ormel ? 'Ormel' : 'The manor';
  const e = state.estate;
  return {
    kind: 'knight-of-adalia/dynasty',
    version: DYNASTY_VERSION,
    contentHash: content.hash,
    date: { year: regnalYear(state, content), season: seasonName(state, content), king: reign.king, reignYear: reign.year },
    ending: { id: state.ended?.ending ?? 'unfinished', label: reg.endings[state.ended?.ending ?? '']?.label ?? 'Unfinished' },
    founder: {
      name: state.name,
      background: state.background,
      role: state.role,
      age: ageOf(state),
      station: state.station,
      renown: state.res.renown ?? 0,
      attributes: { ...state.attributes },
      skills: { ...state.skills },
      traits: [...state.traits],
      items: [...state.items],
      reputation: { ...state.rep },
    },
    spouse: f.c3_married && sp && sp !== 'none' ? { id: sp, name: reg.npcs[sp]?.name ?? sp, alive: state.npcs[sp]?.alive !== false } : undefined,
    heirs: (state.heirs ?? []).map((h) => {
      const idx = living.indexOf(h);
      return {
        name: h.name,
        sex: h.sex,
        age: Math.floor((state.time - h.born) / 4),
        alive: h.alive,
        temperament: h.temperament,
        upbringing: h.upbringing,
        bond: h.bond ?? 0,
        match: idx >= 0 ? heirMatch(state, idx) : undefined,
        crowned: idx === 0 && !!f.c5r_heir_crowned ? true : undefined,
      };
    }),
    realm: {
      west: f.c5_west_free ? (f.c5_war_lost ? 'lost' : 'free') : f.c5_west_adalian ? 'adalian' : 'unsettled',
      reigns: !!f.c5_reigns,
      stability: f.c5_reigns ? state.counters.reign ?? 0 : undefined,
    },
    lands: {
      manor: e
        ? { name: grant, people: e.people ?? 0, temper: e.temper ?? 0, defence: e.defence ?? 0, church: e.church ?? 0, salt: e.salt ?? 0, orchard: e.orchard ?? 0 }
        : undefined,
      holdings: Object.entries(state.holdings ?? {}).map(([id, h]) => ({ id, name: reg.holdings[id]?.label ?? id, income: h.income, temper: h.temper })),
      vassals: (state.vassals ?? []).map((v) => ({ id: v.id, name: vassalName(content, v), heir: !!v.heir })),
    },
    wealth: { coin: state.res.coin ?? 0, men: force.men, garrison: force.garrison, levy: force.levy },
    people: Object.entries(state.npcs)
      .filter(([, n]) => n.met)
      .map(([id, n]) => ({ id, name: reg.npcs[id]?.name ?? id, alive: n.alive, affection: n.affection, respect: n.respect, loyalty: n.loyalty, follower: !!n.follower && n.alive })),
    counters: { ...state.counters },
    flags: Object.keys(state.flags).sort(),
  };
}

export function encodeDynasty(d: DynastyExport): Promise<string> {
  return encodeCode(DYNASTY_PREFIX, d);
}

export async function decodeDynasty(text: string): Promise<DynastyExport> {
  const d = (await decodeCode(DYNASTY_PREFIX, text)) as DynastyExport;
  if (d?.kind !== 'knight-of-adalia/dynasty') throw new Error('Not a Knight of Adalia dynasty code');
  return d;
}
