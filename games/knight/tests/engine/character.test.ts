import { describe, it, expect } from 'vitest';
import { heroOf, ageOfCharacter } from '@engine/character';
import { getValue, checkPath } from '@engine/paths';
import { validateCond, test as cond } from '@engine/conditions';
import { renderText, validateText } from '@engine/text';
import { applyEffects } from '@engine/effects';
import { ageOf } from '@engine/calendar';
import { toSave, fromSave } from '../../src/game/save';
import { choose } from '../../src/game/index';
import { HERO_ID } from '../../src/game/state';
import { content, game } from '../helpers';

const ctx = () => ({ scene: 't', choice: 'c', choiceText: 'x', changes: [] as string[] });

describe('the hero as a character', () => {
  const c = content();

  it('keeps the hero in state.characters, with an age from the calendar', () => {
    const s = game('reeve');
    expect(s.hero).toBe(HERO_ID);
    expect(heroOf(s).name).toBe('Hal');
    expect(heroOf(s).sex).toBe('male');
    expect(ageOf(s)).toBe(c.backgrounds.reeve!.start_age);
    s.time = 9; // two years and a season later
    expect(ageOfCharacter(s, heroOf(s))).toBe(c.backgrounds.reeve!.start_age + 2);
  });

  it('reads bare paths and hero. paths alike', () => {
    const s = game('archer');
    for (const p of ['attr.wits', 'skill.archery', 'health', 'age', 'station', 'track', 'armour', 'injured']) {
      expect(getValue(s, c, `hero.${p}`)).toEqual(getValue(s, c, p));
      expect(checkPath(c, `hero.${p}`)).toBe(checkPath(c, p));
    }
    expect(getValue(s, c, 'hero.sex')).toBe('male');
    expect(getValue(s, c, 'hero.name')).toBe('Hal');
    expect(getValue(s, c, 'hero.alive')).toBe(true);
    expect(checkPath(c, 'hero.sex')).toBeNull();
    expect(checkPath(c, 'hero.bogus')).toMatch(/unknown hero field/);
    expect(checkPath(c, 'hero.attr.bogus')).toMatch(/unknown attribute/);
    expect(validateCond('hero.sex == female', c)).toEqual([]);
    expect(validateCond('hero.sex == other', c)).toEqual(['"hero.sex == other": unknown value "other"']);
    expect(validateCond('hero.station >= commoner', c)).toEqual([]);
    expect(cond('hero.station >= commoner', s, c)).toBe(true);
    expect(cond('hero.station >= knight', s, c)).toBe(false);
  });

  it('changes the hero through add on either path', () => {
    const s = game('reeve');
    const before = heroOf(s).skills.diplomacy ?? 0;
    applyEffects(s, c, [{ add: { 'hero.skill.diplomacy': 1 } }, { add: { 'skill.diplomacy': 1 } }], ctx());
    expect(heroOf(s).skills.diplomacy).toBe(before + 2);
  });

  it('renders pronouns for the hero, capitalised when written so', () => {
    const s = game('reeve');
    expect(renderText('{He} lifts {his} cup; the {man} {himself}, {lord} of {him}.', s, c)).toBe('He lifts his cup; the man himself, lord of him.');
    heroOf(s).sex = 'female';
    expect(renderText('{He} lifts {his} cup; the {man} {himself}, {lord} of {him}. {His} {son}.', s, c)).toBe('She lifts her cup; the woman herself, lady of her. Her daughter.');
    expect(validateText('{He} {his} {Himself}', c).errors).toEqual([]);
    expect(validateText('{Name}', c).errors).toEqual(['only pronouns are capitalised: {Name}']);
  });

  it('marks the hero dead when the story kills him', () => {
    const s = game('reeve');
    s.time = 5;
    expect(applyEffects(s, c, [{ die: 'of a test' }], ctx())).toBe(true);
    expect(heroOf(s).alive).toBe(false);
    expect(heroOf(s).died).toBe(5);
    expect(s.ended?.ending).toBe('death');
  });

  it('moves the hero of a version 3 save into state.characters', () => {
    const s = choose(c, game('servant'), 'give_up').state;
    const h = heroOf(s);
    // the same state as a version 3 save kept it: the hero's fields on the state itself
    const { characters: _c, hero: _h, ...rest } = structuredClone(s);
    const old = { ...rest, name: h.name, startAge: -h.born / 4, attributes: h.attributes, skills: h.skills, health: h.health, traits: h.traits, injuries: h.injuries, items: h.items, station: h.station, ...(h.track ? { track: h.track } : {}) };
    const { state } = fromSave(JSON.parse(JSON.stringify({ ...toSave(s, c), saveVersion: 3, state: old })), c);
    expect(state).toEqual(s);
  });
});
