// The house's lands and purse, after Knight of Adalia's estate and lordship (games/knight/src/game/estate.ts,
// lordship.ts; docs/ECONOMY.md): the manor, the other holdings, the knights who hold of the house, the great household,
// and the men's pay, all settled at Michaelmas. The same rules and prices, so a carried-over life means what it meant.
// Deterministic: draws nothing from the run's dice (vassal incidents hash the seed and year, as Knight of Adalia does).
import { formatCoin, capitalise } from '@engine/format';
import type { ContentBundle } from '../content/schema';
import type { HouseState, Estate } from './state';

export const ESTATE_LABELS: Record<Exclude<keyof Estate, 'name' | 'founded'>, string> = {
  people: 'People',
  food: 'Grain in store (seasons)',
  temper: 'Temper of the village',
  defence: 'Defences',
  church: 'Church and priest',
  salt: 'Salt works',
  orchard: 'Orchards and fields',
};

const RANGE: Record<string, [number, number]> = { people: [0, 2000], food: [0, 12], temper: [-5, 5], defence: [0, 10], church: [0, 10], salt: [0, 10], orchard: [0, 10] };
const clamp = (f: string, v: number) => Math.min(RANGE[f]![1], Math.max(RANGE[f]![0], v));

export function temperWord(t: number): string {
  if (t <= -4) return 'close to rising';
  if (t <= -2) return 'sullen';
  if (t <= 0) return 'wary';
  if (t <= 2) return 'settling';
  return 'loyal';
}

/** A man's fee for a year, paid at Michaelmas: 6s (company and garrison; the levy and named followers are not paid this way). */
export const PAY_PER_MAN = 72;
/** Dues a year from each knight who holds of the house: commuted castle-guard, suit of court, the customary aids. */
export const DUES_PER_FEE = 120;
/** A relief: what an heir pays to take up his father's fee. */
export const RELIEF = 1200;
/** A wardship, sold: the custody of a minor heir's lands and marriage. */
export const WARDSHIP = 4800;
/** A castle's repair, a year, for each point of the manor's defences: £20-£60 for a castle (PLAN.md §4.6). */
export const REPAIR_PER_DEFENCE = 1200;
/** The Sarenzan rate, a year (PLAN.md §4.3). */
export const INTEREST = 0.1;

function hash(seed: number, a: string, b = 0): number {
  let h = (seed ^ 0x9e3779b9) | 0;
  for (let i = 0; i < a.length; i++) h = Math.imul(h ^ a.charCodeAt(i), 2654435761);
  h = Math.imul(h ^ b, 1597334677);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** The manor's rents: about 20d a head, the salt works and orchards; halved when the village is close to rising. */
export function manorRent(s: HouseState): number {
  const e = s.estate;
  if (!e) return 0;
  const rent = e.people * 20 + e.salt * 200 + e.orchard * 150;
  return e.temper <= -3 ? Math.floor(rent / 2) : rent;
}

/** The other holdings' year; a holding close to rising pays half. */
export function holdingsIncome(s: HouseState): number {
  let n = 0;
  for (const h of Object.values(s.holdings ?? {})) n += h.temper <= -3 ? Math.floor(h.income / 2) : h.income;
  return n;
}

/** The share of the year's income a great household eats: a seventh for a crowned head, a tenth for a great lord, none below. */
export function householdShare(s: HouseState): number {
  if (s.characters[s.hero]?.station === 'royal' && s.realm.sovereign === 'self') return 1 / 7;
  const st = s.characters[s.hero]?.station;
  return st === 'great_lord' || st === 'royal' ? 1 / 10 : 0;
}

/** What the next Michaelmas pay will cost. */
export const payDue = (s: HouseState) => ((s.res.men ?? 0) + (s.res.garrison ?? 0)) * PAY_PER_MAN;

/** The West's knights (Knight of Adalia's registry/vassals.yaml), for a fresh start's knights in a fixed order. */
export const WEST_KNIGHTS: [string, string, string][] = [
  ['aubrac', "Sir Gautier d'Aubrac", 'Aubrac'], ['coatmen', 'Sir Alain de Coatmen', 'Coatmen'], ['saint_aubin', 'Sir Renaud de Saint-Aubin', 'Saint-Aubin'],
  ['salvert', 'Sir Josselin Salvert', 'the Salvert dyke'], ['morlaix', 'Sir Hervé de Morlaix', 'Morlaix-sur-Sel'], ['la_roche', 'Sir Bertrand de la Roche', 'La Roche-aux-Moines'],
  ['quintin', 'Sir Mériadec de Quintin', 'Quintin'], ['ploerec', 'Sir Guéthenoc de Ploërec', 'Ploërec'], ['vaucelles', 'Sir Anseau de Vaucelles', 'Vaucelles'],
  ['marans', 'Sir Thibaud de Marans', 'Marans'], ['lesneven', 'Sir Derrien de Lesneven', 'Lesneven'], ['grandpre', 'Sir Enguerran de Grandpré', 'Grandpré'],
  ['belair', 'Sir Aymeric Belair', 'the Belair saltings'], ['rostren', 'Sir Tanguy de Rostren', 'Rostren'], ['montcalm', 'Sir Hugues de Montcalm', 'Montcalm'],
  ['kerouac', 'Sir Even de Kerouac', 'Kerouac'],
];

/** A fresh start's lands, from its opening (schema.ts OpeningSchema founder.lands). */
export function settleLands(s: HouseState, lands: { manor?: Omit<Estate, 'food' | 'founded'>; holdings: { id: string; name: string; income: number }[]; knights: number }): void {
  if (lands.manor) s.estate = { ...lands.manor, food: 4, founded: lands.manor.people };
  if (lands.holdings.length) s.holdings = Object.fromEntries(lands.holdings.map((h) => [h.id, { name: h.name, income: h.income, temper: 0 }]));
  if (lands.knights > 0) s.vassals = WEST_KNIGHTS.slice(0, lands.knights).map(([id, name, seat]) => ({ id, name, seat }));
}

/** The year's knights' dues and incidents: a death (relief, or a wardship sold), or dues withheld. */
function feudalYear(s: HouseState, notes: string[]): number {
  const vs = s.vassals ?? [];
  if (!vs.length) return 0;
  const year = Math.floor(s.time / 4);
  let total = 0;
  for (const v of vs) {
    const r = hash(s.seed, v.id, year);
    if (r < 0.025 && v.heir !== 'minor') {
      notes.push(`${capitalise(v.name)} dies; his son pays ${formatCoin(RELIEF)} in relief`);
      v.name = `the new lord of ${v.seat}`; v.heir = 'grown'; total += RELIEF;
    } else if (r < 0.04 && v.heir !== 'minor') {
      notes.push(`${capitalise(v.name)} dies and leaves a son under age; the wardship of ${v.seat} is sold for ${formatCoin(WARDSHIP)}`);
      v.name = `the young lord of ${v.seat}`; v.heir = 'minor'; total += WARDSHIP;
    } else if (r > 0.975) {
      notes.push(`${capitalise(v.name)} withholds his dues this year, over a quarrel the house's court will have to hear`);
      continue;
    } else if (v.heir === 'minor' && r > 0.5 && r < 0.6) {
      v.heir = 'grown'; v.name = `the lord of ${v.seat}`;
    }
    total += DUES_PER_FEE;
  }
  return total;
}

/** The manor's people over the year (Knight of Adalia's growPeople): land is cheap and labour dear since the Mottle. */
function growPeople(e: Estate, notes: string[]): void {
  if (e.people <= 0) return;
  let rate = e.food >= 1 ? 0.01 : 0;
  if (e.temper >= 1) rate += (0.01 + 0.005 * (e.temper - 1)) * (e.people > e.founded ? 0.5 : 1);
  if (e.temper >= 0 && e.founded > 0) rate += 0.015 * Math.max(0, 1 - e.people / e.founded);
  if (e.temper <= -2) rate -= 0.02;
  let d = Math.round(e.people * rate);
  if (d === 0 && rate !== 0) d = rate > 0 ? 1 : -1;
  if (!d) return;
  e.people = clamp('people', e.people + d);
  if (d < 0) notes.push(`${-d} people leave ${e.name} this year for better lords`);
}

/** Men's pay: they wait one Michaelmas; unpaid two years running, half the unpaid desert. */
function payMen(s: HouseState, notes: string[]): number {
  const men = s.res.men ?? 0, garrison = s.res.garrison ?? 0, total = men + garrison;
  if (total <= 0) { delete s.counters.pay_arrears; return 0; }
  const coin = Math.max(0, s.res.coin ?? 0);
  const paid = Math.min(total, Math.floor(coin / PAY_PER_MAN));
  s.res.coin = coin - paid * PAY_PER_MAN;
  if (paid === total) { delete s.counters.pay_arrears; return paid * PAY_PER_MAN; }
  if (!s.counters.pay_arrears) {
    s.counters.pay_arrears = 1;
    notes.push(`Only ${paid} of ${total} men could be paid; the rest will wait one year, and no longer`);
    return paid * PAY_PER_MAN;
  }
  const gone = Math.ceil((total - paid) / 2);
  const fromGarrison = Math.min(garrison, Math.round((gone * garrison) / total));
  s.res.garrison = garrison - fromGarrison;
  s.res.men = Math.max(0, men - (gone - fromGarrison));
  notes.push(`${gone} men unpaid two years running desert`);
  return paid * PAY_PER_MAN;
}

/** The year's repairs and interest. */
export const repairsDue = (s: HouseState) => (s.estate?.defence ?? 0) * REPAIR_PER_DEFENCE;
export const interestDue = (s: HouseState) => Math.round((s.debt ?? 0) * INTEREST);

/** The year's account, without changing anything: for the status page and the balance report. */
export function yearBudget(s: HouseState): { rent: number; holdings: number; dues: number; household: number; pay: number; repairs: number; interest: number; net: number } {
  const rent = manorRent(s), holdings = holdingsIncome(s), dues = (s.vassals?.length ?? 0) * DUES_PER_FEE;
  const household = Math.round((rent + holdings + dues) * householdShare(s)), pay = payDue(s), repairs = repairsDue(s), interest = interestDue(s);
  return { rent, holdings, dues, household, pay, repairs, interest, net: rent + holdings + dues - household - pay - repairs - interest };
}

/** The walls: repaired if the purse allows, else the defences slip a point. */
function repair(s: HouseState, notes: string[]): number {
  const e = s.estate;
  const due = repairsDue(s);
  if (!e || !due) return 0;
  if ((s.res.coin ?? 0) >= due) { s.res.coin! -= due; return due; }
  e.defence = clamp('defence', e.defence - 1);
  notes.push(`No money for the repairs at ${e.name}: the defences slip`);
  return 0;
}

/** The Lanzi's interest: paid if the purse allows, else added to what is owed. */
function interest(s: HouseState, notes: string[]): number {
  const due = interestDue(s);
  if (!due) return 0;
  if ((s.res.coin ?? 0) >= due) { s.res.coin! -= due; return due; }
  s.debt = (s.debt ?? 0) + due;
  notes.push(`The Lanzi's interest unpaid: ${formatCoin(due)} added to the debt, now ${formatCoin(s.debt)}`);
  return 0;
}

/** One season on the house's lands. At Michaelmas: harvest, rents, dues, the household, the men's pay; one line for the year. */
export function economyTick(s: HouseState, _content: ContentBundle, changes: string[]): void {
  const e = s.estate;
  const notes: string[] = [];
  if (s.time % 4 === 2 && (e || s.holdings || s.vassals || s.debt || (s.res.men ?? 0) + (s.res.garrison ?? 0) > 0)) {
    if (e) e.food = clamp('food', e.food + Math.max(1, Math.round(e.people / 40) + Math.floor(e.orchard / 2)));
    const rent = manorRent(s), other = holdingsIncome(s), dues = feudalYear(s, notes);
    const income = rent + other + dues;
    s.res.coin = (s.res.coin ?? 0) + income;
    const household = Math.min(Math.max(0, s.res.coin), Math.round(income * householdShare(s)));
    s.res.coin -= household;
    if (e) growPeople(e, notes);
    const pay = payMen(s, notes);
    const fixed = repair(s, notes);
    const paid = interest(s, notes);
    const out = [household ? `the household ${formatCoin(household)}` : '', pay ? `the men's pay ${formatCoin(pay)}` : '', fixed ? `repairs ${formatCoin(fixed)}` : '', paid ? `the Lanzi's interest ${formatCoin(paid)}` : ''].filter(Boolean);
    const list = out.length > 1 ? `${out.slice(0, -1).join(', ')} and ${out.at(-1)}` : out[0];
    changes.push(`Michaelmas: ${formatCoin(income)} came in${list ? `; ${list} went out` : ''}`, ...notes);
  }
  // every season eats one season of grain; an empty barn costs people and temper
  if (e) {
    e.food -= 1;
    if (e.food < 0) {
      e.food = 0;
      const lost = Math.ceil(e.people * 0.04);
      e.people = clamp('people', e.people - lost);
      e.temper = clamp('temper', e.temper - 1);
      changes.push(`Hunger at ${e.name}: ${lost} dead or gone`);
    }
  }
}
