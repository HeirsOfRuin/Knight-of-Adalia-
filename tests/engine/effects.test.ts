import { describe, it, expect } from 'vitest';
import { applyEffects } from '../../src/engine/effects';
import { EffectSchema } from '../../src/content/schema';
import { content, game } from '../helpers';

const ctx = () => ({ scene: 's', choice: 'c', choiceText: 'did a thing', changes: [] as string[] });
const fx = (...e: unknown[]) => e.map((x) => EffectSchema.parse(x));

describe('effects', () => {
  const c = content();
  it('adds with clamps and records visible changes', () => {
    const s = game('reeve');
    const x = ctx();
    applyEffects(s, c, fx({ add: { 'skill.arms': 20, 'rep.commons': -50, 'res.coin': -1000, 'rep.piety': -3 } }), x);
    expect(s.skills.arms).toBe(10);
    expect(s.rep.commons).toBe(-10);
    expect(s.res.coin).toBe(0);
    expect(s.rep.piety).toBe(0); // personal axes floor at 0
    expect(x.changes).toContain('Coin −3s 4d');
  });
  it('sets and clears flags without journal noise', () => {
    const s = game();
    const x = ctx();
    applyEffects(s, c, fx({ set: 'flag.t_wrestled' }), x);
    expect(s.flags.t_wrestled).toBe(true);
    applyEffects(s, c, fx({ clear: 'flag.t_wrestled' }), x);
    expect(s.flags.t_wrestled).toBeUndefined();
    expect(x.changes).toHaveLength(0);
  });
  it('injuries apply mods, heal with time, and leave scars', () => {
    const s = game('archer');
    applyEffects(s, c, fx({ injury: 'cut_brow' }), ctx());
    expect(s.injuries.map((i) => i.id)).toEqual(['cut_brow']);
    const x = ctx();
    applyEffects(s, c, fx({ advance: { seasons: 1 } }), x);
    expect(s.injuries).toHaveLength(0);
    expect(s.traits).toContain('scarred_face');
    expect(x.changes.join('|')).toMatch(/healed/);
  });
  it('loyalty only touches men in the following', () => {
    const s = game('reeve');
    const x = ctx();
    applyEffects(s, c, fx({ join: 'jankin_rooke' }, { add: { 'rel.jankin_rooke.loyalty': 2, 'rel.perkin_dyer.loyalty': 2 } }), x);
    expect(s.npcs.jankin_rooke!.loyalty).toBe(2);
    expect(s.npcs.perkin_dyer?.loyalty ?? 0).toBe(0);
    expect(x.changes.join('|')).not.toMatch(/Perkin/);
  });
  it('queues events with their origin', () => {
    const s = game();
    applyEffects(s, c, fx({ queue: { event: 't_q_odo', delay: { seasons: 2 } } }), ctx());
    expect(s.queue[0]).toMatchObject({ event: 't_q_odo', dueAt: 2, origin: { scene: 's', choice: 'c', text: 'did a thing' } });
  });
  it('health never drops below 1 without a die effect', () => {
    const s = game();
    applyEffects(s, c, fx({ add: { health: -50 } }), ctx());
    expect(s.health).toBe(1);
    expect(s.ended).toBeUndefined();
    expect(applyEffects(s, c, fx({ die: 'x' }), ctx())).toBe(true);
    expect(s.ended?.ending).toBe('death');
  });
  it('station changes set track', () => {
    const s = game();
    applyEffects(s, c, fx({ station: 'retainer', track: 'levy' }), ctx());
    expect(s.station).toBe('retainer');
    expect(s.track).toBe('levy');
  });
});
