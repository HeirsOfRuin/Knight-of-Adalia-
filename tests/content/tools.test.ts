import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validate } from '../../tools/validate-lib';
import { parseStyleGuide, lint } from '../../tools/lint-style';
import { playOnce, DEFAULT_POLICIES } from '../../tools/bot-lib';
import { CONTENT_DIR } from '../../tools/content-loader';
import { content, withScenes } from '../helpers';

describe('validator', () => {
  it('passes the shipped content with no errors', () => {
    const r = validate(content());
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
  it('marks structural checks pending until their chapter has content', () => {
    const r = validate(content());
    expect(r.structural.find((s) => s.name.includes('squire'))!.status).toBe('PENDING');
  });
});

describe('style lint', () => {
  const rules = parseStyleGuide(readFileSync(join(CONTENT_DIR, 'style-guide.md'), 'utf8'));
  it('shipped content is clean of banned phrases', () => {
    expect(lint(content(), rules).filter((h) => h.severity === 'error')).toEqual([]);
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
    const c = content();
    for (const bg of Object.keys(c.backgrounds)) {
      for (const p of DEFAULT_POLICIES) {
        const r = playOnce(c, bg, 3, p);
        expect(r.outcome, `${bg} ${r.policy}: ${r.detail}`).toBe('ending');
        expect(r.steps).toBeGreaterThan(2);
        expect(r.scenes.length).toBeGreaterThan(2);
      }
    }
  });
  it('detects a dead end', () => {
    const c = withScenes([{ id: 'x_dead', chapter: 'test', text: 'x', choices: [{ id: 'a', text: 'a', requires: 'skill.arms >= 9', next: 't_end' }] }]);
    c.backgrounds.reeve!.start_scene = 'x_dead';
    expect(playOnce(c, 'reeve', 1, { kind: 'random' }).outcome).toBe('dead_end');
  });
  it('scripted paths fail loudly when a choice is missing', () => {
    const r = playOnce(content(), 'archer', 1, { kind: 'script', choices: ['tally'] });
    expect(r.outcome).toBe('error');
    expect(r.detail).toMatch(/not available/);
  });
});
