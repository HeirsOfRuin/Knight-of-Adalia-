import { describe, it, expect } from 'vitest';
import { SceneSchema } from '../src/content/schema';
import { checkFrames, frameRule } from '../tools/frames';
import { validate } from '../tools/validate-lib';
import { content, house } from './helpers';

const scene = (extra: Record<string, unknown>) => SceneSchema.parse({ id: 't_scene', chapter: 'test', text: 'x', choices: [{ id: 'go', text: 'Go.', next: 'h_story_so_far' }], ...extra });
const issues = (extra: Record<string, unknown>) => checkFrames(content(), scene(extra), 'test').map((i) => i.message);

describe('the frame rule (FRAME.md §7)', () => {
  it('passes the shipped content', () => {
    expect(validate(content()).filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('rejects a frame-bound phrase in text every frame shows', () => {
    const m = issues({ text: 'You remember the crown of the West.' });
    expect(m).toHaveLength(1);
    expect(m[0]).toMatch(/only true in A free West, but this text can show in An Adalian West and A divided West/);
  });

  it('allows it under a guard, in its own variant, or in a scene written for its frame', () => {
    expect(issues({ text: '[if realm.west == free]The crown of the West.[/if]' })).toEqual([]);
    expect(issues({ text: 'Plain.', variants: { adalian: 'The Earl of the March.', partitioned: 'The new border.' } })).toEqual([]);
    expect(issues({ text: 'The crown of the West.', frames: ['free'] })).toEqual([]);
  });

  it('follows elif and else through the frames earlier branches claimed', () => {
    const src = '[if realm.west == adalian]The Earl of the March.[elif realm.west == partitioned]The new border.[else]The crown of the West.[/if]';
    expect(issues({ text: src })).toEqual([]);
    // an else after a branch that says nothing of the frame could show anywhere
    expect(issues({ text: '[if flag.x]a[else]The crown of the West.[/if]' })).toHaveLength(1);
    expect(issues({ text: '[if realm.west != free]The crown of the West.[/if]' })).toHaveLength(1);
  });

  it('checks variants, choices and outcomes too', () => {
    expect(issues({ text: 'Plain.', variants: { adalian: 'The crown of the West.' } })).toHaveLength(1);
    expect(issues({ text: 'Plain.', choices: [{ id: 'go', text: 'Ride for the new border.', next: 'h_story_so_far' }] })).toHaveLength(1);
    expect(issues({ text: 'Plain.', frames: ['free'], variants: { adalian: 'x' } })[0]).toMatch(/variant for adalian, but the scene is written only for free/);
  });

  it('stops a run that enters a scene written for another frame', () => {
    const c = structuredClone(content());
    c.scenes.h_open = { ...c.scenes.h_open!, frames: ['free'] };
    expect(frameRule(c, house({ frame: 'free' }))).toBeUndefined();
    expect(frameRule(c, house({ frame: 'adalian', sovereign: 'edwin' }))).toMatch(/written for free entered in a adalian West/);
  });
});
