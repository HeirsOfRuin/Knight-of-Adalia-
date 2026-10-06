import { describe, it, expect } from 'vitest';
import { toDynasty } from '../../knight/src/game/dynasty';
import { loadPlans, playPlan } from '../../knight/tools/bot-lib';
import { loadContent as loadKnight } from '../../knight/tools/content-loader';
import { fromDynasty, frameOf, sovereignOf } from '../src/game/import';
import { view, heroOf } from '../src/game/index';
import type { DynastyExport } from '@dynasty/contract';
import { content } from './helpers';

describe('a house from a Knight of Adalia life', () => {
  const knight = loadKnight();
  const king = toDynasty(playPlan(knight, loadPlans().find((p) => p.name === 'The King')!).state, knight);
  const c = content();
  const as = (patch: { ending?: string; settlement?: DynastyExport['realm']['settlement']; sovereign?: DynastyExport['realm']['sovereign']; manor?: string }): DynastyExport => ({
    ...king,
    ending: patch.ending ? { id: patch.ending, label: patch.ending } : king.ending,
    realm: { ...king.realm, settlement: patch.settlement ?? king.realm.settlement, sovereign: patch.sovereign ?? king.realm.sovereign },
    lands: { ...king.lands, manor: patch.manor ? { ...king.lands.manor!, name: patch.manor } : king.lands.manor },
  });

  it('continues a crowned life as the Crowned opening, in a free West under the founder', () => {
    const s = fromDynasty(c, king, { seed: 1 });
    expect(s.opening).toBe('crowned');
    expect(s.realm).toEqual({ west: 'free', sovereign: 'self', changes: 0 });
    expect(heroOf(s).name).toBe(king.founder.name);
    expect(Math.floor((s.time - heroOf(s).born) / 4)).toBe(king.founder.age + (50 - king.date.year));
    expect(s.inheritance?.flags).toContain('c5_reigns');
    expect(view(c, s).text).toMatch(/you have worn it since the oaths at Lannec/);
  });

  it('maps every settlement to its frame and sovereign', () => {
    expect([frameOf(as({ settlement: 'duchy' })), sovereignOf(as({ sovereign: 'duchy' }))]).toEqual(['free', 'duchy']);
    expect([frameOf(as({ settlement: 'adalian' })), sovereignOf(as({ sovereign: 'adalia' }))]).toEqual(['adalian', 'edwin']);
    expect(sovereignOf(as({ sovereign: 'divided', manor: 'Kerval' }))).toBe('amaury');
    expect(sovereignOf(as({ sovereign: 'divided', manor: 'Ormel' }))).toBe('edwin_salt');
    const exile = fromDynasty(c, as({ ending: 'exile', settlement: 'partitioned', sovereign: 'divided', manor: 'Marsalin' }), { seed: 1 });
    expect([exile.opening, exile.realm.west, exile.realm.sovereign]).toEqual(['exile', 'partitioned', 'edwin_salt']);
    const founder = fromDynasty(c, as({ ending: 'founder', settlement: 'adalian', sovereign: 'adalia' }), { seed: 1 });
    expect([founder.opening, founder.realm.west]).toEqual(['founder', 'adalian']);
  });

  it('refuses what no opening continues', () => {
    expect(() => fromDynasty(c, as({ ending: 'death' }), { seed: 1 })).toThrow(/no opening continues/);
    expect(() => fromDynasty(c, as({ ending: 'exile', settlement: 'kingdom', sovereign: 'mahaut' }), { seed: 1 })).toThrow(/does not start in A free West/);
    expect(() => fromDynasty(c, as({ settlement: 'unsettled', sovereign: 'unsettled' }), { seed: 1 })).toThrow(/choose a frame/);
  });
});
