// Dynasty export: the house a finished life leaves behind (docs/DESIGN.md, "Dynasty export").
// The contract itself, and its text code, are in packages/dynasty/src/contract.ts.
import { heroOf } from '@engine/character';
import type { ContentBundle } from '../content/schema';
import { vassalName } from './lordship';
import type { GameState } from './state';
import { ageOf, reignOf, regnalYear, seasonName } from '@engine/calendar';
import { forceOf } from '@engine/paths';
import { DYNASTY_VERSION, type DynastyExport } from '@dynasty/contract';

export { DYNASTY_PREFIX, DYNASTY_VERSION, encodeDynasty, decodeDynasty, type DynastyExport, type DynastyHeir } from '@dynasty/contract';

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

function westSettlement(state: GameState): DynastyExport['realm']['settlement'] {
  const f = state.flags;
  if (f.c5_war_lost && (f.c5_west_free || f.c5_west_adalian)) return 'partitioned';
  if (f.c5_west_free) return f.c5_free_duchy ? 'duchy' : 'kingdom';
  if (f.c5_west_adalian) return 'adalian';
  return 'unsettled';
}

function westSovereign(state: GameState): DynastyExport['realm']['sovereign'] {
  const f = state.flags;
  const settlement = westSettlement(state);
  if (settlement === 'partitioned') return 'divided';
  if (settlement === 'adalian') return 'adalia';
  if (settlement === 'duchy') return 'duchy';
  if (settlement === 'kingdom') return f.c5_crowned_self ? 'self' : f.c5_mahaut_queen ? 'mahaut' : f.c5_thibaut_king ? 'thibaut' : 'unsettled';
  return 'unsettled';
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
      name: heroOf(state).name,
      background: state.background,
      role: state.role,
      age: ageOf(state),
      station: heroOf(state).station,
      renown: state.res.renown ?? 0,
      attributes: { ...heroOf(state).attributes },
      skills: { ...heroOf(state).skills },
      traits: [...heroOf(state).traits],
      items: [...heroOf(state).items],
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
      settlement: westSettlement(state),
      sovereign: westSovereign(state),
      war: f.c5_war_won ? 'won' : f.c5_war_held ? 'held' : f.c5_war_lost ? 'lost' : undefined,
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

