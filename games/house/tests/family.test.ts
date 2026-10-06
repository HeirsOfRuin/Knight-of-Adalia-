import { describe, it, expect } from 'vitest';
import { RngCursor, seedRng } from '@engine/rng';
import { applyEffects } from '@engine/effects';
import { renderText } from '@engine/text';
import { validateCond } from '@engine/conditions';
import { getValue, checkPath } from '@engine/paths';
import { choose, view, heroOf } from '../src/game/index';
import { heirOf, person, livingChildren, yearTick, SUCCESSION_SCENE, NEWS_SCENE } from '../src/game/family';
import { HOUSE_ID, FOUNDER_ID, type HouseState } from '../src/game/state';
import { lifeContent, lifeRuns } from '../tools/life-lib';
import { toDynasty } from '../../knight/src/game/dynasty';
import { loadPlans, playPlan } from '../../knight/tools/bot-lib';
import { loadContent as loadKnight } from '../../knight/tools/content-loader';
import { fromDynasty } from '../src/game/import';
import { house } from './helpers';

const c = lifeContent();
const ctx = () => ({ scene: 't', choice: 'c', choiceText: 'x', changes: [] as string[], rng: new RngCursor(seedRng(5)) });

/** A bare house: the founder (male) and a wife, with the children given (sex, age, alive). */
function family(kids: [('male' | 'female'), number, boolean?][]): HouseState {
  const s = house({}, c);
  for (const id of Object.keys(s.characters)) if (id !== FOUNDER_ID) delete s.characters[id];
  const f = s.characters[FOUNDER_ID]!;
  s.characters.w = { ...person(c, 'Wife', 'female', f.born + 20, 'out'), spouse: FOUNDER_ID };
  f.spouse = 'w';
  kids.forEach(([sex, age, alive = true], i) => {
    s.characters[`k${i}`] = { ...person(c, `Kid${i}`, sex, -age * 4, HOUSE_ID), father: FOUNDER_ID, mother: 'w', alive };
  });
  return s;
}

describe('the heir under each law (PLAN.md §4.2)', () => {
  it('prefers sons, then daughters, under male preference; only sons under the male line', () => {
    const s = family([['female', 20], ['male', 18], ['male', 15]]);
    expect(heirOf(s, 'male_preference', FOUNDER_ID)).toBe('k1');
    expect(heirOf(s, 'male_line', FOUNDER_ID)).toBe('k1');
    s.characters.k1!.alive = false;
    s.characters.k2!.alive = false;
    expect(heirOf(s, 'male_preference', FOUNDER_ID)).toBe('k0');
    expect(heirOf(s, 'male_line', FOUNDER_ID)).toBeUndefined();
  });
  it('passes through a dead son to his own children before his younger brother', () => {
    const s = family([['male', 30, false], ['male', 25]]);
    s.characters.g = { ...person(c, 'Grandson', 'male', -6 * 4, HOUSE_ID), father: 'k0' };
    expect(heirOf(s, 'male_preference', FOUNDER_ID)).toBe('g');
  });
  it('climbs to the dead head’s siblings through the parent of the house, not a consort', () => {
    // the head is the founder's daughter, an heiress; her husband married in; she has no children
    const s = family([['female', 30], ['female', 28]]);
    s.characters.h = { ...person(c, 'Husband', 'male', -32 * 4, 'out'), spouse: 'k0' };
    s.characters.k0!.spouse = 'h';
    s.characters[FOUNDER_ID]!.alive = false;
    s.hero = 'k0';
    expect(heirOf(s, 'male_preference', 'k0')).toBe('k1');
  });
  it('skips bastards unless legitimated', () => {
    const s = family([['male', 20], ['female', 18]]);
    s.characters.k0!.legitimate = false;
    expect(heirOf(s, 'male_preference', FOUNDER_ID)).toBe('k1');
    expect(getValue(s, c, 'bastard.name')).toBe('Kid0');
    applyEffects(s, c, [{ legitimate: 'bastard' } as never], ctx());
    expect(heirOf(s, 'male_preference', FOUNDER_ID)).toBe('k0');
    expect(getValue(s, c, 'bastard.exists')).toBe(false);
  });
});

describe('the succession', () => {
  const play = (s: HouseState, id: string) => choose(c, s, id).state;

  it('queues on the head’s death, hands over to the heir, and writes the chronicle', () => {
    let s = family([['male', 20], ['female', 17]]);
    applyEffects(s, c, [{ death: { who: 'head', cause: 'a fall' } } as never], ctx());
    expect(s.queue.map((q) => q.event)).toContain(SUCCESSION_SCENE);
    s = play(s, 'wait'); // the next transition plays the succession first
    expect(s.scene).toBe(SUCCESSION_SCENE);
    expect(view(c, s).text).toMatch(/Hal is dead of a fall.*The heir under the law of the house is Kid0\./s);
    s = play(s, 'the_law');
    expect(s.hero).toBe('k0');
    expect(s.family.generation).toBe(2);
    expect(s.chronicle).toHaveLength(1);
    expect(s.chronicle[0]!.name).toBe('Hal');
    expect(['t_years', 'h_q_news']).toContain(s.scene); // the year that passed may have brought news
    expect(s.lastOutcome?.text).toMatch(/^Hal, head of the house from year 50 to year 51\./);
    expect(s.journal.slice(0, -1).every((e) => e.changes.length === 0 && e.outcome === undefined)).toBe(true);
  });

  it('gives a minor heir a regent: the mother', () => {
    let s = family([['male', 9]]);
    applyEffects(s, c, [{ death: { who: 'head', cause: 'a fever' } } as never], ctx());
    s = play(play(s, 'wait'), 'the_law');
    expect(s.hero).toBe('k0');
    expect(s.family.regent).toBe('w');
    expect(getValue(s, c, 'family.regency')).toBe(true);
  });

  it('ends the house when no one is left', () => {
    let s = family([['male', 9, false]]);
    applyEffects(s, c, [{ death: { who: 'head', cause: 'a fever' } } as never], ctx());
    s = play(play(s, 'wait'), 'the_law');
    expect(s.ended?.ending).toBe('extinct');
  });

  it('lets the player hold to a will against the law', () => {
    let s = family([['male', 22], ['male', 20]]);
    applyEffects(s, c, [{ designate: 'second' } as never], ctx());
    expect(getValue(s, c, 'family.contested')).toBe(true);
    applyEffects(s, c, [{ death: { who: 'head', cause: 'a wound' } } as never], ctx());
    s = play(s, 'wait');
    expect(view(c, s).choices.map((x) => x.id)).toEqual(['the_law', 'the_will']);
    s = play(s, 'the_will');
    expect(s.hero).toBe('k1');
    expect(s.counters.contested).toBe(1);
  });

  it('lets a head step down alive', () => {
    let s = family([['male', 22]]);
    applyEffects(s, c, [{ step_down: 'the cloister' } as never], ctx());
    s = play(play(s, 'wait'), 'the_law');
    expect(s.hero).toBe('k0');
    expect(s.characters[FOUNDER_ID]!.alive).toBe(true);
    expect(s.chronicle[0]!.lines).toContain('He gave up the headship alive and went into the Church.');
  });

  it('keeps play going when a lethal choice kills the head', () => {
    const s = family([['male', 22]]);
    expect(applyEffects(s, c, [{ die: 'at the bridge' }], ctx())).toBe(false); // the house goes on
    expect(s.ended).toBeUndefined();
    expect(s.queue.find((q) => q.event === SUCCESSION_SCENE)?.origin.text).toBe('at the bridge');
  });
});

describe('the year', () => {
  it('brings births, named in the news scene, and matches at the age for them', () => {
    let s = family([['male', 16]]);
    s.characters.w!.born = -24 * 4; // a wife of twenty-four
    let births = 0;
    for (let y = 0; y < 30 && births === 0; y++) { yearTick(s, c, new RngCursor(seedRng(100 + y))); births = s.family.news.filter((n) => n.kind === 'birth').length; }
    expect(births).toBeGreaterThan(0);
    expect(s.queue.some((q) => q.event === NEWS_SCENE)).toBe(true);
  });

  it('tells each piece of news in its own scene', () => {
    let s = family([['male', 16]]);
    s.time = 6; // two seasons before Michaelmas of year 51... at autumn the tick runs
    s.family.news.push({ kind: 'match', who: 'k0', at: s.time });
    s.queue.push({ event: NEWS_SCENE, dueAt: 0, origin: { scene: 't_years', choice: 'x', at: 0, text: '' } });
    s = choose(c, s, 'wait').state;
    expect(s.scene).toBe(NEWS_SCENE);
    expect(view(c, s).text).toMatch(/Kid0 is .*, and of an age to marry/);
    s = choose(c, s, 'match_west').state;
    expect(s.characters[s.characters.k0!.spouse!]!.house).not.toBe(HOUSE_ID);
  });

  it('plays seventy-five empty years from every start without a failure', () => {
    const rs = lifeRuns(c, 1);
    expect(rs.filter((r) => r.run.outcome !== 'ending')).toEqual([]);
    expect(rs.every((r) => r.generations >= 2)).toBe(true);
  }, 60_000);
});

describe('characters in paths and text', () => {
  it('reads selectors and renders their pronouns', () => {
    const s = family([['female', 19], ['male', 12]]);
    expect(validateCond('heir.age >= 16', c)).toEqual([]);
    expect(validateCond('eldest.sex == female', c)).toEqual([]);
    expect(checkPath(c, 'heir.bogus')).toMatch(/unknown character field/);
    expect(getValue(s, c, 'heir.name')).toBe('Kid1');
    expect(getValue(s, c, 'eldest.name')).toBe('Kid0');
    expect(getValue(s, c, 'family.children')).toBe(2);
    expect(renderText('{eldest.He} rides; {heir.he} reads. {spouse.His} hand.', s, c)).toBe('She rides; he reads. Her hand.');
    expect(livingChildren(s)).toEqual(['k0', 'k1']);
  });
});

describe('the founder’s family', () => {
  it('generates a spouse and children for a fresh start', () => {
    const s = house();
    expect(heroOf(s).spouse).toBeDefined();
    expect(livingChildren(s).length).toBeGreaterThanOrEqual(2);
    expect(livingChildren(s).every((id) => s.characters[id]!.name)).toBe(true);
  });
  it('brings the wife and children of an imported life', () => {
    const knight = loadKnight();
    const d = toDynasty(playPlan(knight, loadPlans().find((p) => p.name === 'The King')!).state, knight);
    const s = fromDynasty(c, d, { seed: 1 });
    const kids = livingChildren(s).map((id) => s.characters[id]!);
    expect(kids.map((k) => k.name)).toEqual(d.heirs.filter((h) => h.alive).map((h) => h.name));
    expect(kids[0]!.temperament).toBe(d.heirs.find((h) => h.alive)!.temperament);
    if (d.spouse) expect(s.characters[heroOf(s).spouse!]!.name).toBe(d.spouse.name);
  });
});
