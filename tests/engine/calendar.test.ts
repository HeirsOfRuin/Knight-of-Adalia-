import { describe, it, expect } from 'vitest';
import { content, game } from '../helpers';
import { reignOf, timeOf } from '../../src/engine/calendar';
import { numberWords, ordinalWords } from '../../src/engine/format';
import { applyEffects } from '../../src/engine/effects';
import { renderText } from '../../src/engine/text';
import { toSave, fromSave } from '../../src/engine/save';

describe('calendar', () => {
  const c = content();
  const ctx = () => ({ scene: 't', choice: 't', choiceText: 't', changes: [] as string[] });

  it('writes years and ages in words', () => {
    expect(numberWords(41)).toBe('forty-one');
    expect(numberWords(30)).toBe('thirty');
    expect(ordinalWords(32)).toBe('thirty-second');
    expect(ordinalWords(2)).toBe('second');
    expect(ordinalWords(39)).toBe('thirty-ninth');
    expect(ordinalWords(20)).toBe('twentieth');
  });

  it('catch_up moves the calendar forward to a date, never back', () => {
    const s = game();
    s.time = timeOf(c, 30, 'spring');
    applyEffects(s, c, [{ catch_up: { year: 32, season: 'autumn' } }], ctx());
    expect(s.time).toBe(timeOf(c, 32, 'autumn'));
    applyEffects(s, c, [{ catch_up: { year: 31, season: 'spring' } }], ctx());
    expect(s.time).toBe(timeOf(c, 32, 'autumn'));
  });

  it("Edwin's reign starts the year after Aldred dies in the story, not on a fixed year", () => {
    const s = game();
    s.time = timeOf(c, 43, 'spring');
    expect(reignOf(s, c).king).toBe('Aldred');
    s.seen.c4_king_dies = timeOf(c, 41, 'winter');
    expect(reignOf(s, c)).toEqual({ king: 'Edwin', year: 2 });
    expect(renderText('In the {season} of the {reign_year} year of King {king}', s, c)).toBe('In the spring of the second year of King Edwin');
  });

  it('a save resumed at a checkpoint goes back to the date of that checkpoint', () => {
    const s = game();
    s.seen[s.scene] = 10;
    s.checkpoint = s.scene;
    s.time = 18;
    const raw = toSave(s, c) as unknown as { state: { scene: string } };
    raw.state.scene = 'a_scene_that_was_renamed';
    expect(fromSave(raw, c).state.time).toBe(10);
  });
});
