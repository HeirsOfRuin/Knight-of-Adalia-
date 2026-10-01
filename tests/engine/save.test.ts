import { describe, it, expect } from 'vitest';
import { toSave, fromSave, SaveError } from '../../src/engine/save';
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
});
