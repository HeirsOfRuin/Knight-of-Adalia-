import { describe, it, expect } from 'vitest';
import { realContent } from '../helpers';
import type { Effect } from '../../src/content/schema';

// docs/ECONOMY.md: a price shown on a choice is what it costs, and a purchase needs the coin.
const cost = (effs: Effect[] = []): number => {
  let p = 0;
  for (const e of effs as any[]) {
    if (typeof e.add?.['res.coin'] === 'number' && e.add['res.coin'] < 0) p -= e.add['res.coin'];
    if (e.then) p = Math.max(p, cost(e.then));
    if (e.else) p = Math.max(p, cost(e.else));
  }
  return p;
};
const shown = (text: string): number | undefined => {
  const m = /\((?:£(\d+)(?: (\d+)s)?|(\d+)s|a hundred marks)(?=[,)])/.exec(text);
  if (!m) return undefined;
  if (m[0].includes('marks')) return 16000;
  return m[1] ? Number(m[1]) * 240 + Number(m[2] ?? 0) * 12 : Number(m[3]) * 12;
};

describe('the economy adds up', () => {
  const c = realContent();
  const priced = Object.values(c.scenes).flatMap((s) => s.choices.map((ch) => ({ s, ch, price: shown(ch.text) }))).filter((x) => x.price !== undefined);

  it('there are priced choices to check', () => expect(priced.length).toBeGreaterThan(40));

  it('every price shown on a choice is what it costs, and the choice requires that much coin', () => {
    const bad: string[] = [];
    for (const { s, ch, price } of priced) {
      const paid = cost(ch.effects);
      const req = JSON.stringify(ch.requires ?? []).match(/res\.coin >= (\d+)/);
      if (paid !== price) bad.push(`${s.id}/${ch.id}: shows ${price}d, costs ${paid}d`);
      if (!req || Number(req[1]) < price!) bad.push(`${s.id}/${ch.id}: shows ${price}d, requires ${req?.[1] ?? 'nothing'}`);
    }
    expect(bad).toEqual([]);
  });
});
