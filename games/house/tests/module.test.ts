import { describe, it, expect } from 'vitest';
import { view, choose, startsOf, checkStart, heroOf } from '../src/game/index';
import { applyEffects } from '@engine/effects';
import { renderText } from '@engine/text';
import { validateCond, test as cond } from '@engine/conditions';
import { toSave, fromSave } from '../src/game/save';
import { content, house } from './helpers';

const ctx = () => ({ scene: 't', choice: 'c', choiceText: 'x', changes: [] as string[] });

describe('House of Adalia: starts', () => {
  const c = content();
  it('offers the nine opening and frame combinations, by sovereign', () => {
    const starts = startsOf(c);
    expect(new Set(starts.map((s) => `${s.opening}/${s.frame}`)).size).toBe(9);
    expect(starts).toHaveLength(17);
  });
  it('refuses a start the frame does not allow', () => {
    expect(() => checkStart(c, 'exile', 'free')).toThrow(/does not start in A free West/);
    expect(() => checkStart(c, 'crowned', 'adalian')).toThrow(/does not start/);
    expect(() => checkStart(c, 'kingmaker', 'free', 'self')).toThrow(/sovereign must be one of mahaut, thibaut/);
    expect(checkStart(c, 'diminished', 'partitioned')).toBe('amaury');
  });
});

describe('House of Adalia: the West in each frame', () => {
  const c = content();
  it('dates by the Church\'s year and the sovereign of the West', () => {
    expect(view(c, house({ sovereign: 'mahaut' })).date).toBe('Spring 912, the ninth year of Queen Mahaut');
    expect(view(c, house({ frame: 'adalian' })).date).toBe('Spring 912, the eleventh year of King Edwin');
    expect(view(c, house({ opening: 'diminished', frame: 'partitioned', sovereign: 'amaury' })).date).toBe('Spring 912, the eighteenth year of King Amaury');
    expect(view(c, house({ opening: 'crowned', sovereign: 'self' })).date).toBe('Spring 912, the sixth year of King Hal');
    expect(view(c, house({ opening: 'crowned', sovereign: 'self', sex: 'female' })).date).toBe('Spring 912, the sixth year of Queen Hal');
  });
  it('shows each frame its own text', () => {
    expect(view(c, house({ sovereign: 'thibaut' })).text).toMatch(/The crown of the West is eight years old, and King Thibaut wears it/);
    expect(view(c, house({ frame: 'adalian' })).text).toMatch(/The West is Adalia's/);
    expect(view(c, house({ opening: 'ruin', frame: 'partitioned', sovereign: 'edwin_salt' })).text).toMatch(/King Edwin's again.*struck from the rolls/s);
  });
  it('renders the realm variables and reads the realm paths', () => {
    const s = house({ frame: 'adalian' });
    expect(renderText('{realm.sovereign} at {realm.capital}; {realm.assembly}; {realm.law}; {realm.frame}; {realm.west}', s, c)).toBe("King Edwin at Wendmere; the Moot; the law of Adalia; An Adalian West; adalian");
    expect(validateCond('realm.west == adalian', c)).toEqual([]);
    expect(validateCond('realm.west == france', c)).toEqual(['"realm.west == france": unknown value "france"']);
    expect(validateCond('realm.sovereign == mahaut', c)).toEqual([]);
    expect(validateCond('inherited.c5_liberties', c)).toEqual([]);
    expect(cond('realm.west == adalian', s, c)).toBe(true);
    expect(cond('imported', s, c)).toBe(false);
  });
  it('changes hands with the west effect', () => {
    const s = house({ frame: 'adalian' });
    const x = ctx();
    applyEffects(s, c, [{ west: { frame: 'free', sovereign: 'mahaut' } }], x);
    expect(s.realm).toEqual({ west: 'free', sovereign: 'mahaut', changes: 1, from: 50 });
    expect(x.changes).toEqual(['The West: A free West, under Queen Mahaut']);
    expect(() => applyEffects(s, c, [{ west: { frame: 'adalian', sovereign: 'mahaut' } }], ctx())).toThrow(/does not rule a adalian West/);
    expect(() => applyEffects(s, c, [{ west: { frame: 'partitioned' } }], ctx())).toThrow(/needs a sovereign/);
  });
  it('plays to the end of the framework and round-trips a save', () => {
    // the framework scene: every opening but the Founder, whose prologue is written (prologue.test.ts)
    const s = choose(c, house({ opening: 'kingmaker' }), 'go_on').state;
    expect(s.ended?.ending).toBe('story_so_far');
    expect(heroOf(s).name).toBe('Hal');
    expect(fromSave(JSON.parse(JSON.stringify(toSave(s, c))), c).state).toEqual(s);
  });
});
