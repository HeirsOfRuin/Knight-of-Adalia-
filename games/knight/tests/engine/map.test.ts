import { heroOf } from '@engine/character';
import { describe, it, expect } from 'vitest';
import { realContent, game } from '../helpers';
import { resolvePlace, visits, hereNow, knownPlaces, placeOfScene } from '@engine/map';
import type { JournalEntry } from '../../src/game/state';

const entry = (scene: string, at: number): JournalEntry => ({ at, scene, choice: 'x', changes: [] });

describe('the world map', () => {
  const c = realContent();

  it('resolves home, service, manor and town for this run', () => {
    const s = game('archer');
    expect(resolvePlace(c, '@home', s)).toBe('hollin');
    heroOf(s).track = 'levy';
    expect(resolvePlace(c, '@service', s)).toBe('brome');
    s.flags.c2_granted_kerval = true;
    expect(resolvePlace(c, '@manor', s)).toBe('kerval');
    expect(resolvePlace(c, '@town', s)).toBe('lannec');
    expect(resolvePlace(c, 'grisolles', s)).toBe('grisolles');
  });

  it('keeps one stay per run of scenes at a place, and knows where he is now', () => {
    const s = game('reeve');
    s.journal = [entry('c2_vaudrey', 10), entry('c2_corbie', 10), entry('c2_looms', 11), entry('c2_grisolles_eve', 12), entry('c2_grisolles', 12)];
    s.scene = 'c2_grisolles_rout';
    s.time = 12;
    expect(visits(c, s).map((v) => v.place)).toEqual(['vaudrey', 'lisonne', 'grisolles']);
    expect(hereNow(c, s)).toBe('grisolles');
    // a scene with no place (at sea) leaves him where he was
    s.scene = 'c2_crossing';
    expect(placeOfScene(c, s, 'c2_crossing')).toBeUndefined();
    expect(hereNow(c, s)).toBe('grisolles');
  });

  it('knows a place once its condition holds or once he has been there', () => {
    const s = game('reeve');
    s.journal = [];
    s.scene = 'p_reeve_open';
    const k = knownPlaces(c, s);
    expect(k.wendmere).toBeDefined();
    expect(k.grisolles).toBeUndefined();
    s.seen.c2_grisolles_eve = 12;
    expect(knownPlaces(c, s).grisolles).toBeDefined();
  });

  it('places most of the story', () => {
    const spine = Object.values(c.scenes).filter((s) => s.chapter !== 'test' && s.kind !== 'ending');
    const placed = spine.filter((s) => c.map?.scenes[s.id]);
    expect(placed.length / spine.length).toBeGreaterThan(0.85);
  });
});
