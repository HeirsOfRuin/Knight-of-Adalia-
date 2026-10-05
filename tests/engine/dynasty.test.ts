import { describe, it, expect } from 'vitest';
import { realContent } from '../helpers';
import { loadPlans, playPlan } from '../../tools/bot-lib';
import { toDynasty, encodeDynasty, decodeDynasty, DYNASTY_PREFIX } from '../../src/engine/dynasty';

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
    expect(d.heirs.length).toBeGreaterThan(0);
    expect(d.heirs.every((h) => typeof h.age === 'number' && h.name !== undefined)).toBe(true);
    expect(d.flags).toContain('c5_reigns');
    expect(d.founder.name).toBe(state.name);
    expect(d.people.every((p) => p.name && typeof p.alive === 'boolean')).toBe(true);
  });

  it('round-trips through its text code', async () => {
    const d = toDynasty(state, c);
    const code = await encodeDynasty(d);
    expect(code.startsWith(DYNASTY_PREFIX)).toBe(true);
    expect(await decodeDynasty(code)).toEqual(JSON.parse(JSON.stringify(d)));
    await expect(decodeDynasty('KOA1.abc')).rejects.toThrow();
  });
});
