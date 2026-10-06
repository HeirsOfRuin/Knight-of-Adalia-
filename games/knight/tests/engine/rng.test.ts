import { describe, it, expect } from 'vitest';
import { seedRng, rngNext, RngCursor } from '@engine/rng';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = new RngCursor(seedRng(7));
    const b = new RngCursor(seedRng(7));
    for (let i = 0; i < 100; i++) expect(a.float()).toBe(b.float());
  });
  it('differs across seeds', () => {
    expect(rngNext(seedRng(1))[0]).not.toBe(rngNext(seedRng(2))[0]);
  });
  it('stays in [0,1) and is roughly uniform', () => {
    const r = new RngCursor(seedRng(99));
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      const v = r.float();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 10000).toBeGreaterThan(0.48);
    expect(sum / 10000).toBeLessThan(0.52);
  });
  it('state survives JSON round trip', () => {
    const r = new RngCursor(seedRng(5));
    r.float();
    const copy = new RngCursor(JSON.parse(JSON.stringify(r.state)));
    expect(copy.float()).toBe(r.float());
  });
  it('pickWeighted respects zero weights', () => {
    const r = new RngCursor(seedRng(3));
    for (let i = 0; i < 50; i++) expect(r.pickWeighted(['a', 'b'], (x) => (x === 'a' ? 0 : 1))).toBe('b');
  });
});
