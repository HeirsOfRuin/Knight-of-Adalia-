import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validate } from '../../tools/validate-lib';
import { parseStyleGuide, lint } from '../../tools/lint-style';
import { playOnce, DEFAULT_POLICIES, loadPlans, playPlan } from '../../tools/bot-lib';
import { CONTENT_DIR } from '../../tools/content-loader';
import { realContent, withScenes } from '../helpers';

describe('validator', () => {
  it('passes the shipped content with no errors', () => {
    const r = validate(realContent());
    expect(r.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(r.structural.filter((s) => s.status === 'FAIL')).toEqual([]);
  });
  it('catches broken links, undeclared flags, unguarded death and no-option scenes', () => {
    const c = withScenes([
      { id: 'x_bad', chapter: 'test', text: '[if flag.nope]x[/if]', choices: [
        { id: 'a', text: 'a', requires: 'skill.arms >= 3', next: 'nowhere' },
        { id: 'b', text: 'b', requires: 'skill.arms >= 3', effects: [{ set: 'flag.undeclared' }, { die: 'x' }], next: 't_end' },
      ] },
    ]);
    const msgs = validate(c).issues.filter((i) => i.where.includes('x_bad')).map((i) => i.message).join('\n');
    expect(msgs).toMatch(/unknown scene "nowhere"/);
    expect(msgs).toMatch(/undeclared flag "undeclared"/);
    expect(msgs).toMatch(/"die" outside a lethal choice/);
    expect(msgs).toMatch(/no unconditional choice/);
    expect(msgs).toMatch(/unknown flag/);
  });
  it('flags lethal choices without a warning', () => {
    const c = withScenes([{ id: 'x_lethal', chapter: 'test', text: 'x', choices: [
      { id: 'a', text: 'a', lethal: true, check: { attr: 'strength', difficulty: 3 }, success: { next: 't_end' }, failure: { effects: [{ die: 'x' }] } },
    ] }]);
    expect(validate(c).issues.some((i) => i.message.includes('without a warn'))).toBe(true);
  });
  it('runs structural checks for every chapter, with every ending reachable', () => {
    const r = validate(realContent());
    expect(r.structural.filter((s) => s.name.includes('squire')).every((s) => s.status === 'PASS')).toBe(true);
    expect(r.structural.filter((s) => s.name.includes('ending reachable')).every((s) => s.status === 'PASS')).toBe(true);
  });
});

describe('style lint', () => {
  const rules = parseStyleGuide(readFileSync(join(CONTENT_DIR, 'style-guide.md'), 'utf8'));
  it('shipped content is clean of banned phrases', () => {
    expect(lint(realContent(), rules).filter((h) => h.severity === 'error')).toEqual([]);
  });
  it('catches banned phrases and ignores template syntax', () => {
    const c = withScenes([{ id: 'x_style', chapter: 'test', text: 'Okay, he thought. [if flag.t_wrestled]Fine.[/if] It made sense, a testament to grit.', choices: [{ id: 'a', text: 'a', next: 't_end' }] }]);
    const hits = lint(c, rules).filter((h) => h.where.includes('x_style') && h.severity === 'error').map((h) => h.rule);
    expect(hits).toEqual(expect.arrayContaining(['okay', 'a testament to']));
    expect(lint(c, rules).some((h) => h.where.includes('x_style') && h.rule === 'make sense')).toBe(false);
  });
});

describe('bot', () => {
  it('every policy reaches an ending from every background, and actually advances', () => {
    const c = realContent();
    for (const bg of Object.keys(c.backgrounds)) {
      for (const p of DEFAULT_POLICIES) {
        const r = playOnce(c, bg, 3, p);
        expect(r.outcome, `${bg} ${r.policy}: ${r.detail}`).toBe('ending');
        // prologue + chapter 1 is 30+ choices; a death can cut it short, but never before the prologue is played
        expect(r.steps).toBeGreaterThan(r.ending === 'death' ? 6 : 25);
        expect(r.scenes.length).toBeGreaterThan(6);
      }
    }
  });
  it('detects a dead end', () => {
    const c = withScenes([{ id: 'x_dead', chapter: 'test', text: 'x', choices: [{ id: 'a', text: 'a', requires: 'skill.arms >= 9', next: 't_end' }] }]);
    c.backgrounds.reeve!.start_scene = 'x_dead';
    expect(playOnce(c, 'reeve', 1, { kind: 'random' }).outcome).toBe('dead_end');
  });
  it('scripted paths fail loudly when a choice is missing', () => {
    const r = playOnce(realContent(), 'archer', 1, { kind: 'script', choices: ['tally'] });
    expect(r.outcome).toBe('error');
    expect(r.detail).toMatch(/not available/);
  });
});

describe('scripted plans', () => {
  const c = realContent();
  const plans = loadPlans();
  it('there are at least three distinct routes, covering every background', () => {
    expect(plans.length).toBeGreaterThanOrEqual(3);
    expect(new Set(plans.map((p) => p.background)).size).toBe(Object.keys(c.backgrounds).length);
  });
  for (const plan of plans) {
    it(`plan "${plan.name}" plays to its ending with its consequences intact`, () => {
      const r = playPlan(c, plan);
      expect(r.problems).toEqual([]);
      expect(r.path.length).toBeGreaterThan(25);
    });
  }
  it('the plans end in genuinely different states', () => {
    const finals = plans.map((p) => {
      const s = playPlan(c, p).state;
      return `${s.station}/${s.track}/${s.aliases.master}`;
    });
    expect(new Set(finals).size).toBe(plans.length);
  });
});
