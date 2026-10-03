import { describe, it, expect } from 'vitest';
import { toSave, fromSave, SaveError } from '../../src/engine/save';
import { estateRecovery } from '../../src/engine/paths';
import { choose } from '../../src/engine/index';
import { content, game } from '../helpers';

describe('save', () => {
  const c = content();
  it('round-trips through JSON', () => {
    const s = choose(c, game('servant'), 'give_up').state;
    const { state, warnings } = fromSave(JSON.parse(JSON.stringify(toSave(s, c))), c);
    expect(state).toEqual(s);
    expect(warnings).toEqual([]);
  });
  it('rejects foreign files and future versions', () => {
    expect(() => fromSave({ hello: 1 }, c)).toThrow(SaveError);
    expect(() => fromSave({ ...toSave(game(), c), saveVersion: 99 }, c)).toThrow(/unsupported/);
  });
  it('falls back to the checkpoint when the saved scene is gone', () => {
    const s = game();
    s.scene = 'removed_scene';
    s.returnStack = ['also_removed'];
    const { state, warnings } = fromSave(toSave(s, c), c);
    expect(state.scene).toBe('t_market');
    expect(state.returnStack).toEqual([]);
    expect(warnings.length).toBeGreaterThan(0);
  });
  it('fills in NPCs added to content after the save', () => {
    const s = game();
    delete s.npcs.odo_groom;
    expect(fromSave(toSave(s, c), c).state.npcs.odo_groom).toBeDefined();
  });

  it('counts men hired before the force was split (version 1 saves)', () => {
    const s = game();
    s.flags.c2_paid_men = true;
    s.flags.c3_hired_bandits = true;
    s.journal.push({ at: 0, scene: 'c3_truce_ends', sceneTitle: '', choice: 'Train the villagers, settlers and all, with bows and bills.', changes: ['Defences +2', 'Command +1'] } as never);
    const { state } = fromSave({ ...toSave(s, c), saveVersion: 1 }, c);
    expect(state.res.men).toBe((s.res.men ?? 0) + 2);
    expect(state.res.garrison).toBe(60);
    expect(state.res.levy).toBe(52);
  });

  it('remembers the founding population for older saves, so comparisons with the past are relative', () => {
    const s = game();
    s.flags.c2_granted_marsalin = true;
    s.estate = { people: 228 };
    const { state } = fromSave({ ...toSave(s, c), saveVersion: 2 }, c);
    expect(state.estate?.founded).toBe(300);
    expect(estateRecovery(state)).toBe(76);
  });
});
