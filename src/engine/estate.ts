// Estate (Ch3+): the manor he holds. Plain numbers in state.estate, ticked once
// per season by the calendar. Content reads them as `estate.<field>` and changes
// them with `add: { estate.<field>: n }`; `found_estate` creates the record.
import type { GameState } from './state';
import { formatCoin } from './format';

export const ESTATE_FIELDS = ['people', 'food', 'temper', 'defence', 'church', 'salt', 'orchard'] as const;
export type EstateField = (typeof ESTATE_FIELDS)[number];

export const ESTATE_LABELS: Record<EstateField, string> = {
  people: 'People',
  food: 'Grain in store (seasons)',
  temper: 'Temper of the village',
  defence: 'Defences',
  church: 'Church and priest',
  salt: 'Salt works',
  orchard: 'Orchards and fields',
};

const RANGE: Record<EstateField, [number, number]> = {
  people: [0, 2000],
  food: [0, 12],
  temper: [-5, 5],
  defence: [0, 10],
  church: [0, 10],
  salt: [0, 10],
  orchard: [0, 10],
};

export function clampEstate(field: EstateField, v: number): number {
  const [lo, hi] = RANGE[field];
  return Math.min(hi, Math.max(lo, v));
}

export function temperWord(t: number): string {
  if (t <= -4) return 'close to rising';
  if (t <= -2) return 'sullen';
  if (t <= 0) return 'wary';
  if (t <= 2) return 'settling';
  return 'loyal';
}

/** A lord's own men (company and garrison) draw a shilling a man a year, paid at Michaelmas. */
export const PAY_PER_MAN = 12;

function paidByOthers(state: GameState): boolean {
  return !!(state.flags.c4_on_indenture || state.flags.c5_war_tax);
}

/**
 * Michaelmas pay, after the rents. The King's indenture pays the company while it runs
 * (flag.c4_on_indenture, Ch4 Act I), and the Estates' war tax pays the West's host in the
 * War of the West (flag.c5_war_tax). The levy and named followers are not paid this way.
 * Men will wait one Michaelmas for their pay. Unpaid two years running, half of the unpaid
 * (rounded up) desert, from the company and garrison in proportion.
 */
export function payMen(state: GameState, changes: string[]): void {
  if (paidByOthers(state)) return;
  const men = state.res.men ?? 0;
  const garrison = state.res.garrison ?? 0;
  const total = men + garrison;
  if (total <= 0) { delete state.counters.pay_arrears; return; }
  const coin = Math.max(0, state.res.coin ?? 0);
  const paid = Math.min(total, Math.floor(coin / PAY_PER_MAN));
  state.res.coin = coin - paid * PAY_PER_MAN;
  if (paid === total) {
    delete state.counters.pay_arrears;
    changes.push(`Michaelmas pay for ${total} men: ${formatCoin(paid * PAY_PER_MAN)}`);
    return;
  }
  if (!state.counters.pay_arrears) {
    state.counters.pay_arrears = 1;
    changes.push(`Michaelmas pay: ${paid} of ${total} men paid; the rest will wait one year, and no longer`);
    return;
  }
  const gone = Math.ceil((total - paid) / 2);
  const fromGarrison = Math.min(garrison, Math.round((gone * garrison) / total));
  state.res.garrison = garrison - fromGarrison;
  state.res.men = Math.max(0, men - (gone - fromGarrison));
  changes.push(`Michaelmas pay: ${paid} of ${total} men paid; ${gone} men unpaid two years running desert`);
}

/** What the next Michaelmas pay will cost, for the shops' text ({pay_due}). */
export function payDue(state: GameState): number {
  return paidByOthers(state) ? 0 : ((state.res.men ?? 0) + (state.res.garrison ?? 0)) * PAY_PER_MAN;
}

/**
 * The year's change in the manor's people, at Michaelmas. After the Mottle, land is cheap
 * and labour dear: a manor with empty holdings and a lord the village trusts fills up again
 * within a generation, by births and by families coming over the hill; a sullen one empties.
 *   births over deaths     +1% a year (fed: grain in store)
 *   newcomers              +1% at temper 1, +0.5% for each point above; a market adds 0.5%;
 *                          half that once the manor is back to its founding size
 *   empty holdings         up to +1.5% while below the founding size, if the village is not sullen
 *   leaving                -2% at temper -2 or worse
 */
export function growPeople(state: GameState, changes: string[]): void {
  const e = state.estate;
  if (!e) return;
  const people = e.people ?? 0;
  if (people <= 0) return;
  const temper = e.temper ?? 0;
  const founded = e.founded ?? people;
  let rate = (e.food ?? 0) >= 1 ? 0.01 : 0;
  // newcomers come for land: fewer once the old holdings are full again
  if (temper >= 1) rate += (0.01 + 0.005 * (temper - 1) + (state.flags.inv_market ? 0.005 : 0)) * (people > founded ? 0.5 : 1);
  if (temper >= 0 && founded > 0) rate += 0.015 * Math.max(0, 1 - people / founded);
  if (temper <= -2) rate -= 0.02;
  let delta = Math.round(people * rate);
  if (delta === 0 && rate !== 0) delta = rate > 0 ? 1 : -1;
  if (delta === 0) return;
  e.people = clampEstate('people', people + delta);
  changes.push(delta > 0 ? `The manor grows: ${delta} more people this year, born or come over the hill` : `${-delta} people leave the manor this year for better lords`);
}

/** One season on the manor. Season index: 0 spring, 1 summer, 2 autumn, 3 winter. */
export function estateTick(state: GameState, changes: string[]): void {
  const e = state.estate;
  if (!e) return;
  const season = state.time % 4;
  if (season === 2) {
    // Michaelmas: harvest in, rents due. Both scale with the people left to do the work.
    const harvest = Math.max(1, Math.round((e.people ?? 0) / 40) + Math.floor((e.orchard ?? 0) / 2));
    e.food = clampEstate('food', (e.food ?? 0) + harvest);
    let rent = (e.people ?? 0) * 3 + (e.salt ?? 0) * 40 + (e.orchard ?? 0) * 30;
    if ((e.temper ?? 0) <= -3) rent = Math.floor(rent / 2);
    state.res.coin = (state.res.coin ?? 0) + rent;
    changes.push(`Harvest in: ${harvest} seasons of grain`, `Michaelmas rents: ${formatCoin(rent)}`);
    // other holdings pay their year's income at the same time
    let other = 0;
    for (const h of Object.values(state.holdings ?? {})) other += h.temper <= -3 ? Math.floor(h.income / 2) : h.income;
    if (other > 0) {
      state.res.coin += other;
      changes.push(`Rents from your other holdings: ${formatCoin(other)}`);
    }
    growPeople(state, changes);
    payMen(state, changes);
  }
  // Every season eats one season of grain.
  e.food = (e.food ?? 0) - 1;
  if (e.food < 0) {
    e.food = 0;
    const lost = Math.ceil((e.people ?? 0) * 0.04);
    e.people = clampEstate('people', (e.people ?? 0) - lost);
    e.temper = clampEstate('temper', (e.temper ?? 0) - 1);
    changes.push(`Hunger on the manor: ${lost} dead or gone`);
  }
}
