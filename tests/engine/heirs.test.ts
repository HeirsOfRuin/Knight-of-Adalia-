import { describe, it, expect } from 'vitest';
import { pickHeirs } from '../../src/engine/heirs';
import { getValue } from '../../src/engine/paths';
import { content, game } from '../helpers';

const kid = (name: string, sex: 'son' | 'daughter', born: number, extra: object = {}) => ({ name, sex, born, alive: true, bond: 0, ...extra });

describe('heirs', () => {
  const c = content();

  it('the heir is the eldest son, before an elder sister', () => {
    const s = game('reeve');
    s.heirs = [kid('Ysolde', 'daughter', 10), kid('Piers', 'son', 18), kid('Jehan', 'son', 40)];
    expect(pickHeirs(s, 'eldest')[0]!.name).toBe('Ysolde');
    expect(pickHeirs(s, 'heir')[0]!.name).toBe('Piers');
    expect(getValue(s, c, 'heirs.eldest_is_heir')).toBe(false);
    expect(getValue(s, c, 'heirs.second_is_heir')).toBe(true);
  });

  it('with no son, the eldest daughter inherits; a dead son does not count', () => {
    const s = game('reeve');
    s.heirs = [kid('Mabel', 'daughter', 10), { ...kid('Hugh', 'son', 14), alive: false }, kid('Joan', 'daughter', 20)];
    expect(pickHeirs(s, 'heir')[0]!.name).toBe('Mabel');
    expect(getValue(s, c, 'heirs.eldest_is_heir')).toBe(true);
  });

  it("Mahaut's children: by the mother recorded at birth, or born after the wedding at the Estates", () => {
    const s = game('reeve');
    s.flags.c5_married_mahaut = true;
    s.seen.c5_estates = 30;
    s.heirs = [kid('Piers', 'son', 18), kid('Jehan', 'son', 40)];
    expect(pickHeirs(s, 'armance')[0]!.name).toBe('Jehan');
    expect(getValue(s, c, 'heirs.heir_is_armance')).toBe(false);
    s.heirs = [kid('Jehanne', 'daughter', 12, { mother: 'mahaut_armance' })];
    expect(getValue(s, c, 'heirs.heir_is_armance')).toBe(true);
  });
});
