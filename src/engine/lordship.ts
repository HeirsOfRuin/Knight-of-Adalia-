// Lordship (Ch4+): the knights who hold land of him, what they owe, and what a great
// household costs. docs/ECONOMY.md, "Lordship". Deterministic from the run's seed, so
// it does not disturb the dice.
import type { ContentBundle } from '../content/schema';
import type { GameState, Vassal } from './state';
import { formatCoin } from './format';

/** Dues a year from each knight who holds of him: commuted castle-guard, suit of court, the customary aids. */
export const DUES_PER_FEE = 120; // 10s
/** A relief: what an heir pays his lord to take up his father's fee. */
export const RELIEF = 1200; // £5
/** A wardship, sold: the custody of a minor heir's lands and marriage. */
export const WARDSHIP = 4800; // £20

function hash(seed: number, a: string, b = 0): number {
  let h = (seed ^ 0x9e3779b9) | 0;
  for (let i = 0; i < a.length; i++) h = Math.imul(h ^ a.charCodeAt(i), 2654435761);
  h = Math.imul(h ^ b, 1597334677);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** The knight's name as it stands now: after his death, his heir's. */
export function vassalName(content: ContentBundle, v: Vassal): string {
  const d = content.registry.vassals[v.id];
  if (!d) return v.id;
  if (v.heir) return `the ${v.heir === 'minor' ? 'young ' : ''}lord of ${d.seat}`;
  // "Sir Thibaud de Marans" says where he holds; "Sir Josselin Salvert" needs telling
  return d.name.includes(d.seat.replace(/^(the|La|Le) /, '')) ? d.name : `${d.name} of ${d.seat}`;
}

/** Names in a list: "A, B and C", or the first few "and n others". */
export function nameList(names: string[], max = 4): string {
  if (names.length > max) return `${names.slice(0, max).join(', ')} and ${names.length - max} others`;
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** n more knights of a region do homage to him: the next unused names, in an order fixed by the seed. */
export function addVassals(state: GameState, content: ContentBundle, n: number, region: 'adalia' | 'west', changes: string[]): void {
  const have = new Set((state.vassals ?? []).map((v) => v.id));
  const free = Object.entries(content.registry.vassals)
    .filter(([id, d]) => d.region === region && !have.has(id))
    .map(([id]) => id)
    .sort((a, b) => hash(state.seed, a) - hash(state.seed, b))
    .slice(0, n);
  if (!free.length) return;
  const added: Vassal[] = free.map((id) => ({ id, since: state.time }));
  (state.vassals ??= []).push(...added);
  const names = added.map((v) => vassalName(content, v));
  changes.push(`${added.length === 1 ? 'A knight does' : `${numberLabel(added.length)} knights do`} homage to you for lands they hold of you: ${nameList(names, 6)}`);
}

function numberLabel(n: number): string {
  const w = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
  return w[n] ?? String(n);
}

/**
 * Michaelmas, after the rents: each knight who holds of him pays his dues, and in any year
 * one may die (his heir pays a relief, or, if a child, falls into the lord's wardship, which
 * a lord sells) or withhold his dues over a quarrel. Returns the pence received.
 */
export function feudalYear(state: GameState, content: ContentBundle, changes: string[]): number {
  const vs = state.vassals ?? [];
  if (!vs.length) return 0;
  const year = Math.floor(state.time / 4);
  let dues = 0;
  let incidents = 0;
  const notes: string[] = [];
  for (const v of vs) {
    const r = hash(state.seed, v.id, year);
    const who = vassalName(content, v);
    const seat = content.registry.vassals[v.id]?.seat ?? v.id;
    if (r < 0.025 && v.heir !== 'minor') {
      v.heir = 'grown';
      incidents += RELIEF;
      notes.push(`${who} dies; his son pays you ${formatCoin(RELIEF)} in relief to take up ${seat}`);
    } else if (r < 0.04 && v.heir !== 'minor') {
      v.heir = 'minor';
      incidents += WARDSHIP;
      notes.push(`${who} dies and leaves a son under age; you sell the wardship of ${seat} for ${formatCoin(WARDSHIP)}`);
    } else if (r > 0.975) {
      notes.push(`${who} withholds his dues this year, claiming he holds of the King and not of you; your court will hear it`);
      continue;
    } else if (v.heir === 'minor' && r > 0.5 && r < 0.6) {
      v.heir = 'grown'; // the ward comes of age and does homage in his own right
    }
    dues += DUES_PER_FEE;
  }
  state.res.coin = (state.res.coin ?? 0) + dues + incidents;
  changes.push(`Dues from the ${vs.length === 1 ? 'knight who holds' : `${vs.length} knights who hold`} of you: ${formatCoin(dues)}`, ...notes);
  return dues + incidents;
}

/** The share of the year's income a great household eats: a tenth for a baron or earl, a seventh for a king; none below. */
export function householdShare(state: GameState): number {
  if (state.flags.c5_reigns || state.flags.c5_crowned_self) return 1 / 7;
  return state.station === 'great_lord' || state.station === 'royal' ? 1 / 10 : 0;
}

/**
 * A great lord keeps a great household: stewards, receivers, clerks, livery for his
 * knights, his table, his chapel. A tenth of the year's income for a baron or earl,
 * a seventh for a king. Paid after the rents, before the men.
 */
export function householdCost(state: GameState, income: number, changes: string[]): void {
  const share = householdShare(state);
  if (!share) return;
  const king = !!(state.flags.c5_reigns || state.flags.c5_crowned_self);
  const cost = Math.min(Math.max(0, state.res.coin ?? 0), Math.round(income * share));
  if (cost <= 0) return;
  state.res.coin = (state.res.coin ?? 0) - cost;
  changes.push(`The household of a ${king ? 'king' : state.flags.c5_earl ? 'great earl' : 'great lord'}, for the year: ${formatCoin(cost)}`);
}

/** What men call him, from the grants that made him: for the status page. */
export function titleOf(state: GameState): string | undefined {
  const f = state.flags;
  if (f.c5_reigns || f.c5_crowned_self) return 'King of the West';
  if (f.c5_earl) return 'Earl of the March';
  if (f.c4_great_lord) return f.c4_baron_by_acclaim ? 'Baron of the March, by the acclaim of the West' : state.holdings?.honour_march ? 'Baron of the March' : 'A great lord, in all but name';
  if (f.c4_banneret) return f.c4_chamber_knight ? 'Knight banneret, of the King\'s chamber' : 'Knight banneret';
  return undefined;
}

/**
 * Saves made before lordship carried land and knights (2026-10) get what their rank would
 * have brought them, once, on load. Idempotent: it only adds what is missing.
 */
export function backfillLordship(state: GameState, content: ContentBundle): string[] {
  const f = state.flags, c = state.counters, h = (state.holdings ??= {});
  const given: string[] = [];
  const hold = (id: string, income: number) => { if (!h[id]) { h[id] = { income, temper: 0 }; given.push(content.registry.holdings[id]?.label ?? id); } };
  const knights = (n: number) => { const before = state.vassals?.length ?? 0; addVassals(state, content, n, 'west', []); if ((state.vassals?.length ?? 0) > before) given.push(`${(state.vassals?.length ?? 0) - before} knights who hold of you`); };
  const fresh = !state.vassals;
  // land bought or married in Chapter 3 was once only handed over at the start of Chapter 4
  if (state.chapter === 'ch3') {
    const home = { reeve: 'ashby', archer: 'hollin', burgess: 'wendham_rents', servant: 'underhill' }[state.background as string];
    const rent = { ashby: 2400, hollin: 2400, wendham_rents: 3000, underhill: 2400 }[home ?? ''] ?? 0;
    if (f.c3_holds_home && home && !h[home]) hold(home, f.c3_home_mortgaged ? Math.round(rent * 0.9) : rent);
    if (f.c3_holds_lisle) hold('lisle', 6000);
    if (f.c3_holds_wyck) hold('wyck', 3600);
    if (f.c3_holds_ashdown) hold('ashdown', 7200);
  }
  // holdings granted before the economy was repriced (2026-10-05) pay a fifth of what they should
  const grant = grantIncomes(content);
  let repriced = 0;
  for (const [id, x] of Object.entries(h)) {
    const base = grant[id];
    if (base && x.income > 0 && x.income * 3 <= base) { x.income *= 5; repriced++; }
  }
  if (repriced) given.push(`${repriced === 1 ? 'one holding' : `${repriced} holdings`} repriced to the present rents`);
  if (f.c4_chamber_knight) hold('chamber_fee', 4800);
  if (fresh && f.c4_banneret && h.la_garde && !f.c5_earl) knights(2);
  if (fresh && f.c4_great_lord) {
    if (f.c4_baron_by_acclaim) { hold('west_gift', 14400); knights(8); }
    else if ((f.c4_edwin_won && (c.court_prince ?? 0) >= 6) || (f.c4_carrow_won && (c.court_carrow ?? 0) >= 6)) { hold('honour_march', 38400); knights(8); }
    else knights(4);
  }
  if (f.c5_earl && !h.earldom_march) { hold('earldom_march', 144000); knights(12); }
  if (f.c5_reigns && (h.crown_revenues?.income ?? Infinity) < 100000) {
    h.crown_revenues!.income = f.c5r_tax_kept ? 240000 : f.c5r_council_purse ? 192000 : 144000;
    given.push('the crown revenues of a kingdom');
  }
  if (f.c5_reigns && state.seen.c5r_oaths !== undefined && fresh) knights((c.estates ?? 0) >= 8 ? 16 : (c.estates ?? 0) >= 5 ? 12 : 8);
  if (!Object.keys(h).length) delete state.holdings;
  return given;
}

let grantCache: { content: ContentBundle; incomes: Record<string, number> } | undefined;
/** The smallest income each holding is granted at anywhere in the story. */
function grantIncomes(content: ContentBundle): Record<string, number> {
  if (grantCache?.content === content) return grantCache.incomes;
  const incomes: Record<string, number> = {};
  const json = JSON.stringify([content.scenes]);
  for (const m of json.matchAll(/"hold":\{"id":"([a-z_]+)","income":(\d+)/g)) {
    const n = Number(m[2]);
    incomes[m[1]!] = Math.min(incomes[m[1]!] ?? Infinity, n);
  }
  grantCache = { content, incomes };
  return incomes;
}
