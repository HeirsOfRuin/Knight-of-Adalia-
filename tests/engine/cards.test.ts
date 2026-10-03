import { describe, it, expect } from 'vitest';
import { realContent, game } from '../helpers';
import { view } from '../../src/engine/index';
import { applyEffects } from '../../src/engine/effects';
import type { JournalEntry } from '../../src/engine/state';

const entry = (scene: string, at: number): JournalEntry => ({ at, scene, choice: 'x', changes: [] });

describe('chapter cards', () => {
  const c = realContent();
  const ctx = () => ({ scene: 't', choice: 't', choiceText: 't', changes: [] as string[] });

  it('a chapter opens with its card; a scene within the chapter has none', () => {
    const s = game();
    s.scene = 'c4_council';
    s.journal = [entry('c3_end', 100)];
    s.time = 101;
    expect(view(c, s).card?.subtitle).toBe('The Second War');
    s.scene = 'c4_home';
    s.journal.push(entry('c4_council', 101));
    expect(view(c, s).card).toBeUndefined();
  });

  it('an act opener carries its own card', () => {
    const s = game();
    s.scene = 'c4_stewards';
    s.journal = [entry('c4_act1_end', 110)];
    expect(view(c, s).card?.subtitle).toBe('Many Places');
  });

  it('tells the years, births and deaths since the last card', () => {
    const s = game();
    s.journal = [entry('c2_end', 60), entry('c3_arrival', 61), entry('c3_end', 84)];
    s.time = 61;
    applyEffects(s, c, [{ birth: 'son' }, { name_heir: 'Hamon' }], ctx());
    s.time = 70;
    applyEffects(s, c, [{ kill: 'davy_ludd' }], ctx());
    s.npcs.davy_ludd!.met = true;
    s.time = 85;
    s.scene = 'c4_council';
    const card = view(c, s).card!;
    expect(card.since[0]).toBe('Six years have passed.');
    expect(card.since).toContain('Born: Hamon, son.');
    expect(card.since.join(' ')).toContain('Dead: Davy');
    expect(card.rows.find(([k]) => k === 'Children')?.[1]).toBe('Hamon (6)');
  });
});
