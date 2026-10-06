import { heroOf } from '@engine/character';
import { describe, it, expect } from 'vitest';
import { computeOdds, bandFor, resolveCheck } from '@engine/checks';
import { computePrejudice, audienceModifier } from '../../src/game/station';
import { RngCursor, seedRng } from '@engine/rng';
import { CheckSchema } from '../../src/content/schema';
import { content, game } from '../helpers';

describe('checks', () => {
  const c = content();
  it('maps probability to bands', () => {
    expect(bandFor(0.3)).toBe('Risky');
    expect(bandFor(0.5)).toBe('Even');
    expect(bandFor(0.8)).toBe('Favorable');
  });
  it('clamps odds to 5%..95%', () => {
    const s = game('archer');
    expect(computeOdds(CheckSchema.parse({ attr: 'strength', difficulty: 40 }), s, c).success).toBe(0.05);
    expect(computeOdds(CheckSchema.parse({ attr: 'strength', difficulty: -40 }), s, c).success).toBe(0.95);
  });
  it('applies new-man prejudice in front of nobles and knights', () => {
    const s = game('burgess');
    expect(computePrejudice(s, c, 'knights')).toBe(5);
    expect(audienceModifier(s, c, 'knights')).toBe(-3);
    expect(audienceModifier(s, c, 'nobles')).toBe(-2);
    expect(audienceModifier(s, c, 'commons')).toBeGreaterThan(0);
    const before = computeOdds(CheckSchema.parse({ attr: 'presence', difficulty: 3, audience: 'knights' }), s, c).success;
    const after = computeOdds(CheckSchema.parse({ attr: 'presence', difficulty: 3 }), s, c).success;
    expect(before).toBeLessThan(after);
  });
  it('prejudice shrinks with station and renown but never below 1', () => {
    const s = game('reeve');
    heroOf(s).station = 'royal';
    s.res.renown = 100;
    s.flags.noble_marriage = true;
    expect(computePrejudice(s, c)).toBe(1);
  });
  it('forced results still consume one draw', () => {
    const odds = computeOdds(CheckSchema.parse({ attr: 'wits', difficulty: 0 }), game(), c);
    const a = new RngCursor(seedRng(1));
    const b = new RngCursor(seedRng(1));
    resolveCheck(odds, a, 'failure');
    resolveCheck(odds, b);
    expect(a.state).toEqual(b.state);
  });
  it('resolution frequency matches the displayed odds', () => {
    const odds = computeOdds(CheckSchema.parse({ attr: 'wits', difficulty: 3 }), game('reeve'), c);
    const r = new RngCursor(seedRng(11));
    let wins = 0;
    for (let i = 0; i < 20000; i++) if (resolveCheck(odds, r) === 'success') wins++;
    expect(Math.abs(wins / 20000 - odds.success)).toBeLessThan(0.015);
  });
});
