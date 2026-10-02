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
