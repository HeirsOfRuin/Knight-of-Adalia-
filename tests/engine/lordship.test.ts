import { describe, it, expect } from 'vitest';
import { applyEffects } from '../../src/engine/effects';
import { estateTick } from '../../src/engine/estate';
import { DUES_PER_FEE, backfillLordship, feudalYear, titleOf } from '../../src/engine/lordship';
import { getValue } from '../../src/engine/paths';
import { EffectSchema } from '../../src/content/schema';
import { content, game } from '../helpers';

const ctx = () => ({ scene: 's', choice: 'c', choiceText: 'did a thing', changes: [] as string[] });
const fx = (...e: unknown[]) => e.map((x) => EffectSchema.parse(x));

describe('lordship', () => {
  const c = content();

  it('takes the next unused names of a region, never the same knight twice', () => {
    const s = game('reeve');
    const x = ctx();
    applyEffects(s, c, fx({ vassals: { add: 8, region: 'west' } }), x);
    applyEffects(s, c, fx({ vassals: { add: 12, region: 'west' } }), x);
    const ids = s.vassals!.map((v) => v.id);
    expect(ids).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
    expect(ids.every((id) => c.registry.vassals[id]?.region === 'west')).toBe(true);
    expect(getValue(s, c, 'vassals.count')).toBe(20);
    expect(x.changes[0]).toMatch(/^Eight knights do homage to you/);
  });

  it('the order depends on the seed', () => {
    const a = game('reeve'), b = game('reeve');
    b.seed = a.seed + 1;
    applyEffects(a, c, fx({ vassals: { add: 3, region: 'west' } }), ctx());
    applyEffects(b, c, fx({ vassals: { add: 3, region: 'west' } }), ctx());
    expect(a.vassals!.map((v) => v.id)).not.toEqual(b.vassals!.map((v) => v.id));
  });

  it('pays dues at Michaelmas, with the odd relief or wardship', () => {
    const s = game('reeve');
    applyEffects(s, c, fx({ vassals: { add: 10, region: 'west' } }), ctx());
    s.res.coin = 0;
    let total = 0;
    for (let y = 0; y < 30; y++) {
      s.time = y * 4 + 2;
      const changes: string[] = [];
      total += feudalYear(s, c, changes);
      expect(changes[0]).toMatch(/^Dues from the 10 knights who hold of you/);
    }
    expect(s.res.coin).toBe(total);
    // ten knights for thirty years: 10s a knight a year, and reliefs and wardships worth about as much again
    expect(total).toBeGreaterThan(30 * 10 * DUES_PER_FEE * 0.9);
    expect(total).toBeLessThan(30 * 10 * DUES_PER_FEE * 3);
  });

  it('a great lord pays for his household out of the year; a knight does not', () => {
    const s = game('reeve');
    applyEffects(s, c, fx({ found_estate: { people: 240, food: 8, temper: 1 } }), ctx());
    s.time = 2;
    s.res.coin = 0;
    const knight: string[] = [];
    estateTick(s, knight, c);
    expect(knight.some((l) => l.startsWith('The household'))).toBe(false);
    s.station = 'great_lord';
    s.time = 6;
    const baron: string[] = [];
    estateTick(s, baron, c);
    expect(baron.some((l) => l.startsWith('The household of a great lord'))).toBe(true);
  });

  it('names the title the grants made', () => {
    const s = game('reeve');
    expect(titleOf(s)).toBeUndefined();
    s.flags.c4_banneret = true;
    expect(titleOf(s)).toBe('Knight banneret');
    s.flags.c4_great_lord = true;
    s.holdings = { honour_march: { income: 38400, temper: 0 } };
    expect(titleOf(s)).toBe('Baron of the March');
    s.flags.c5_earl = true;
    expect(titleOf(s)).toBe('Earl of the March');
  });

  it('brings an old save up to its rank, once', () => {
    const s = game('reeve');
    Object.assign(s.flags, { c4_great_lord: true, c4_edwin_won: true });
    s.counters.court_prince = 8;
    expect(backfillLordship(s, c)).toEqual(['The honour of the March', '8 knights who hold of you']);
    expect(s.holdings?.honour_march?.income).toBe(38400);
    expect(backfillLordship(s, c)).toEqual([]);
    expect(s.vassals).toHaveLength(8);
  });
});
