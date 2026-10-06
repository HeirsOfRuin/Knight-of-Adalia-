import { describe, it, expect } from 'vitest';
import { realContent } from '../helpers';
import { loadPlans, playPlan } from '../../tools/bot-lib';
import { toDynasty, encodeDynasty, decodeDynasty, DYNASTY_PREFIX } from '../../src/game/dynasty';

describe('dynasty export', () => {
  const c = realContent();
  const king = loadPlans().find((p) => p.name === 'The King')!;
  const { state } = playPlan(c, king);

  it('carries the house a crowned life leaves behind', () => {
    const d = toDynasty(state, c);
    expect(d.kind).toBe('knight-of-adalia/dynasty');
    expect(d.ending.id).toBe('crowned');
    expect(d.realm.reigns).toBe(true);
    expect(d.realm.west).toBe('free');
    expect(d.realm.settlement).toBe('kingdom');
    expect(d.realm.sovereign).toBe('self');
    expect(d.heirs.length).toBeGreaterThan(0);
    expect(d.heirs.every((h) => typeof h.age === 'number' && h.name !== undefined)).toBe(true);
    expect(d.flags).toContain('c5_reigns');
    expect(d.founder.name).toBe(state.name);
    expect(d.people.every((p) => p.name && typeof p.alive === 'boolean')).toBe(true);
  });

  it('tells the settlements of the West apart', () => {
    const realm = (flags: string[]) => {
      const f: Record<string, true> = {};
      for (const x of flags) f[x] = true;
      return toDynasty({ ...state, flags: f }, c).realm;
    };
    expect(realm(['c5_west_free', 'c5_free_duchy', 'c5_war_held'])).toMatchObject({ west: 'free', settlement: 'duchy', sovereign: 'duchy', war: 'held' });
    expect(realm(['c5_west_free', 'c5_thibaut_king', 'c5_war_won'])).toMatchObject({ settlement: 'kingdom', sovereign: 'thibaut', war: 'won' });
    expect(realm(['c5_west_free', 'c5_mahaut_queen', 'c5_war_lost'])).toMatchObject({ west: 'lost', settlement: 'partitioned', sovereign: 'divided' });
    expect(realm(['c5_west_adalian', 'c5_war_held'])).toMatchObject({ west: 'adalian', settlement: 'adalian', sovereign: 'adalia' });
    // the v1 field reads an Adalian West that lost the war as adalian; the settlement does not
    expect(realm(['c5_west_adalian', 'c5_war_lost'])).toMatchObject({ west: 'adalian', settlement: 'partitioned', sovereign: 'divided', war: 'lost' });
    expect(realm([])).toMatchObject({ west: 'unsettled', settlement: 'unsettled' });
  });

  it('round-trips through its text code', async () => {
    const d = toDynasty(state, c);
    const code = await encodeDynasty(d);
    expect(code.startsWith(DYNASTY_PREFIX)).toBe(true);
    expect(await decodeDynasty(code)).toEqual(JSON.parse(JSON.stringify(d)));
    await expect(decodeDynasty('KOA1.abc')).rejects.toThrow();
  });
});
