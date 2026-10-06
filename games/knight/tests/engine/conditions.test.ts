import { heroOf } from '@engine/character';
import { describe, it, expect } from 'vitest';
import { test as cond, unmetLabel, validateCond, parseExpr } from '@engine/conditions';
import { content, game } from '../helpers';

describe('conditions', () => {
  const c = content();
  it('parses comparisons and bare flags', () => {
    expect(parseExpr('skill.diplomacy >= 4')).toMatchObject({ t: 'cmp', path: 'skill.diplomacy', op: '>=', value: 4 });
    expect(parseExpr('!flag.x')).toMatchObject({ t: 'truthy', neg: true, path: 'flag.x' });
    expect(() => parseExpr('skill.arms >=')).toThrow();
  });
  it('evaluates stats, backgrounds and ordinals', () => {
    const s = game('reeve');
    expect(cond('skill.learning >= 2', s, c)).toBe(true);
    expect(cond('skill.learning >= 3', s, c)).toBe(false);
    expect(cond('background == reeve', s, c)).toBe(true);
    expect(cond('station >= squire', s, c)).toBe(false);
    heroOf(s).station = 'knight';
    expect(cond('station >= squire', s, c)).toBe(true);
    expect(cond('calendar.season == spring', s, c)).toBe(true);
  });
  it('combines all/any/not', () => {
    const s = game('archer');
    expect(cond({ any: ['background == reeve', 'background == archer'] }, s, c)).toBe(true);
    expect(cond(['background == archer', 'skill.archery >= 9'], s, c)).toBe(false);
    expect(cond({ not: 'trait.literate_vernacular' }, s, c)).toBe(true);
  });
  it('uses effective skills (items count)', () => {
    const s = game('archer');
    expect(cond('skill.archery >= 4', s, c)).toBe(true); // 3 + yew bow
  });
  it('labels unmet requirements only', () => {
    const s = game('archer');
    expect(unmetLabel(['skill.archery >= 1', 'skill.diplomacy >= 4', 'res.coin >= 30'], s, c)).toBe('Diplomacy 4, Coin 2s 6d');
  });
  it('validates paths and values', () => {
    expect(validateCond('flag.nope', c)).toHaveLength(1);
    expect(validateCond('station >= duke', c)[0]).toMatch(/unknown value/);
    expect(validateCond('background == reeve', c)).toHaveLength(0);
    expect(validateCond('skill.flying >= 1', c)[0]).toMatch(/unknown skill/);
  });
});
