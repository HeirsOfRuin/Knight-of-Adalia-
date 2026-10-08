import { describe, it, expect } from 'vitest';
import { economyTick, yearLuck, yearBudget, HARVESTS, TRADES } from '../src/game/economy';
import type { HouseState } from '../src/game/state';
import { content, house } from './helpers';

// The year's luck (economy.ts): harvests and trade from the seed and the year, war, plague, raids and the granary.
const c = content();

/** A house at Michaelmas of a given year, with a fixed purse, run through one Michaelmas. */
function michaelmas(s: HouseState, year: number): { s: HouseState; lines: string[]; got: number } {
  const t: HouseState = JSON.parse(JSON.stringify(s));
  t.time = year * 4 + 2;
  t.res.coin = 1_000_000;
  const lines: string[] = [];
  economyTick(t, c, lines);
  const got = Number((lines[0]!.match(/: £(\d+)/) ?? [])[1] ?? 0);
  return { s: t, lines, got };
}

describe('the year\'s luck', () => {
  it('changes the Michaelmas income from year to year, around a fair year', () => {
    const s = house();
    const fair = yearBudget(s);
    const incomes = Array.from({ length: 40 }, (_, y) => michaelmas(s, y).got);
    expect(new Set(incomes).size).toBeGreaterThan(4);
    const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
    const fairPounds = (fair.rent + fair.holdings + fair.dues) / 240;
    expect(mean).toBeGreaterThan(fairPounds * 0.85);
    expect(mean).toBeLessThan(fairPounds * 1.15);
    // every band turns up, and the line names it
    const words = new Set(Array.from({ length: 200 }, (_, y) => yearLuck({ ...s, time: y * 4 + 2 }).harvest.id));
    expect(words.size).toBe(HARVESTS.length);
    expect(michaelmas(s, 3).lines[0]).toMatch(/^Michaelmas, (a|the) .*(harvest|failed) and (slack|steady|brisk) trade: /);
    expect(TRADES.map((t) => t.id)).toEqual(['slack', 'steady', 'brisk']);
  });

  it('is fixed by the seed: the same run has the same years, another run other years', () => {
    const a = Array.from({ length: 12 }, (_, y) => yearLuck({ ...house({ seed: 1 }), time: y * 4 + 2 }).harvest.id);
    const b = Array.from({ length: 12 }, (_, y) => yearLuck({ ...house({ seed: 1 }), time: y * 4 + 2 }).harvest.id);
    const d = Array.from({ length: 12 }, (_, y) => yearLuck({ ...house({ seed: 99 }), time: y * 4 + 2 }).harvest.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(d);
  });

  it('cuts the trade in a year of war, and raids a weak manor', () => {
    const s = house();
    s.holdings = { road_tolls: { name: 'The bridge tolls', income: 24000, temper: 0 } };
    const peace = Array.from({ length: 20 }, (_, y) => michaelmas(s, y).got).reduce((a, b) => a + b, 0);
    s.realm.war = 'Valdrenne';
    s.estate!.defence = 0;
    const years = Array.from({ length: 20 }, (_, y) => michaelmas(s, y));
    expect(years.reduce((a, r) => a + r.got, 0)).toBeLessThan(peace);
    expect(years.some((r) => r.lines.some((l) => /^Raiders came over the march/.test(l)))).toBe(true);
    expect(years[0]!.lines[0]).toMatch(/in a year of war/);
  });

  it('empties the village in a plague year, and a granary halves the hunger', () => {
    const s = house();
    s.flags.plague = true;
    const r = michaelmas(s, 1);
    expect(r.s.estate!.people).toBeLessThan(s.estate!.people);
    expect(r.lines.some((l) => /^The sickness in Kerval/.test(l))).toBe(true);
    // an empty barn in winter
    const hungry = (granary: boolean) => {
      const t: HouseState = JSON.parse(JSON.stringify(house()));
      t.estate!.food = 0; t.time = 3; if (granary) t.flags.inv_h_granary = true;
      const before = t.estate!.people;
      economyTick(t, c, []);
      return before - t.estate!.people;
    };
    expect(hungry(true)).toBeLessThan(hungry(false));
  });
});
