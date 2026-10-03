import { describe, it, expect } from 'vitest';
import { applyEffects } from '../../src/engine/effects';
import { getValue } from '../../src/engine/paths';
import { RngCursor, seedRng } from '../../src/engine/rng';
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

describe('estate', () => {
  const c = content();
  it('founds a manor, ticks rents and harvest at Michaelmas, and starves when the grain runs out', () => {
    const s = game('reeve');
    applyEffects(s, c, fx({ found_estate: { people: 200, food: 1, temper: 0, salt: 2 } }), ctx());
    expect(s.estate!.people).toBe(200);
    s.time = 0; // spring
    const coin = s.res.coin ?? 0;
    const x = ctx();
    applyEffects(s, c, fx({ advance: { seasons: 2 } }), x); // summer (food 0), then autumn (harvest, rent, eat)
    expect(s.res.coin).toBe(coin + 200 * 3 + 2 * 40);
    expect(s.estate!.food).toBe(0 + 5 - 1); // 200 people / 40
    expect(x.changes.join('|')).toMatch(/Michaelmas rents/);
    s.estate!.food = 0;
    const y = ctx();
    applyEffects(s, c, fx({ advance: { seasons: 1 } }), y);
    expect(s.estate!.people).toBe(192);
    expect(s.estate!.temper).toBe(-1);
  });
  it('pays the company and garrison a shilling a man at Michaelmas, and unpaid men desert', () => {
    const s = game('reeve');
    applyEffects(s, c, fx({ found_estate: { people: 0, food: 4 } }), ctx());
    s.time = 1; // summer
    s.res.men = 30;
    s.res.garrison = 10;
    s.res.coin = 40 * 12 + 5;
    const x = ctx();
    applyEffects(s, c, fx({ advance: { seasons: 1 } }), x);
    expect(s.res.coin).toBe(5);
    expect(x.changes.join('|')).toMatch(/Michaelmas pay for 40 men/);
    // a year later he can pay only 20 of 40: the unpaid wait a year
    s.res.coin = 20 * 12;
    const w = ctx();
    applyEffects(s, c, fx({ advance: { seasons: 4 } }), w);
    expect(s.res.coin).toBe(0);
    expect((s.res.men ?? 0) + (s.res.garrison ?? 0)).toBe(40);
    expect(w.changes.join('|')).toMatch(/will wait one year/);
    // short again the next year: half the unpaid (10) desert, in proportion
    s.res.coin = 20 * 12;
    const y = ctx();
    applyEffects(s, c, fx({ advance: { seasons: 4 } }), y);
    expect((s.res.men ?? 0) + (s.res.garrison ?? 0)).toBe(30);
    expect(s.res.garrison).toBe(7);
    expect(y.changes.join('|')).toMatch(/10 men unpaid two years running desert/);
    // the King's indenture pays the company while it runs
    s.flags.c4_on_indenture = true;
    const z = ctx();
    applyEffects(s, c, fx({ advance: { seasons: 4 } }), z);
    expect(z.changes.join('|')).not.toMatch(/pay/);
  });
  it('loses a share of the people, and estate paths read and clamp', () => {
    const s = game('reeve');
    applyEffects(s, c, fx({ found_estate: { people: 300, temper: 4 } }), ctx());
    applyEffects(s, c, fx({ lose_share: { 'estate.people': 33 } }, { add: { 'estate.temper': 5 } }), ctx());
    expect(s.estate!.people).toBe(201);
    expect(s.estate!.temper).toBe(5);
  });
});

describe('train', () => {
  const c = content();
  const fx = (...e: unknown[]) => e.map((x) => EffectSchema.parse(x));
  it('stops drill at the ceiling and puts the overflow into the body once', () => {
    const s = game();
    s.skills.arms = 3;
    s.attributes.endurance = 2;
    const cx = ctx();
    applyEffects(s, c, fx({ train: { arms: 2 } }), cx);
    expect(s.skills.arms).toBe(4);
    expect(s.attributes.endurance).toBe(3);
    applyEffects(s, c, fx({ train: { arms: 1 } }), cx);
    expect(s.skills.arms).toBe(4);
    expect(s.attributes.endurance).toBe(3); // once per attribute
    expect(cx.changes.some((m) => m.includes('take a master'))).toBe(true);
  });
  it('lets a mentor go higher, and learning on the job stays quiet', () => {
    const s = game();
    s.skills.arms = 4;
    applyEffects(s, c, fx({ train: { arms: 1, ceiling: 6 } }), ctx());
    expect(s.skills.arms).toBe(5);
    s.skills.command = 5;
    const cx = ctx();
    applyEffects(s, c, fx({ train: { command: 1, ceiling: 5, quiet: 1 } }), cx);
    expect(s.skills.command).toBe(5);
    expect(cx.changes).toEqual([]);
  });
});

describe('heirs and chance', () => {
  const c = content();
  const fx = (...e: unknown[]) => e.map((x) => EffectSchema.parse(x));
  it('records a birth, names the newest child, and reads the heirs paths', () => {
    const s = game();
    s.name = 'Wat';
    applyEffects(s, c, fx({ birth: 'son' }, { name_heir: '@self' }, { birth: 'daughter' }, { name_heir: 'Alison' }), ctx());
    expect(s.heirs!.map((h) => h.name)).toEqual(['Wat', 'Alison']);
    expect(getValue(s, c, 'heirs.count')).toBe(2);
    expect(getValue(s, c, 'heirs.last')).toBe('daughter');
    expect(getValue(s, c, 'heirs.names')).toBe('Wat and Alison');
    applyEffects(s, c, fx({ heir_dies: 'last' }), ctx());
    expect(getValue(s, c, 'heirs.count')).toBe(1);
    expect(getValue(s, c, 'heirs.born')).toBe(2);
  });
  it('takes a chance branch from the seeded cursor, and never without one', () => {
    const s = game();
    applyEffects(s, c, fx({ chance: 99, then: [{ set: 'flag.noble_marriage' }] }), ctx());
    expect(s.flags.noble_marriage).toBeUndefined();
    const rng = new RngCursor(seedRng(1));
    applyEffects(s, c, fx({ chance: 99, then: [{ set: 'flag.noble_marriage' }] }), { ...ctx(), rng });
    expect(s.flags.noble_marriage).toBe(true);
  });
});

describe('holdings and heirs growth', () => {
  const c = content();
  const fx = (...e: unknown[]) => e.map((x) => EffectSchema.parse(x));
  it('holds, changes, pays at Michaelmas, and releases another holding', () => {
    const s = game('reeve');
    applyEffects(s, c, fx({ found_estate: { people: 100, food: 4 } }, { hold: { id: 'lisle', income: 1200 } }, { add: { 'holding.lisle.temper': -4 } }), ctx());
    expect(getValue(s, c, 'holding.lisle.held')).toBe(true);
    expect(getValue(s, c, 'holdings.count')).toBe(1);
    const before = s.res.coin ?? 0;
    while (s.time % 4 !== 1) s.time += 1; // next season is Michaelmas
    applyEffects(s, c, fx({ advance: { seasons: 1 } }), ctx());
    expect((s.res.coin ?? 0) - before).toBe(300 + 600); // manor rent (100 people x 3) + Lisle halved for a sullen temper
    applyEffects(s, c, fx({ release: 'lisle' }), ctx());
    expect(getValue(s, c, 'holdings.count')).toBe(0);
  });
  it('sets temperament and upbringing by selector, and moves the bond', () => {
    const s = game();
    applyEffects(s, c, fx({ birth: 'son' }, { name_heir: 'Hugh' }, { birth: 'daughter' }, { name_heir: 'Kit' }), ctx());
    applyEffects(s, c, fx({ heir_set: { which: 'eldest', temperament: 'bold', upbringing: 'page' } }, { add: { 'heir.second.bond': 3 } }), ctx());
    expect(getValue(s, c, 'heir.eldest.temperament')).toBe('bold');
    expect(getValue(s, c, 'heir.eldest.upbringing')).toBe('page');
    expect(getValue(s, c, 'heir.second.bond')).toBe(3);
    expect(getValue(s, c, 'heir.second.name')).toBe('Kit');
    expect(getValue(s, c, 'heir.third.alive')).toBe(false);
  });
});
