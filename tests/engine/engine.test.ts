import { describe, it, expect } from 'vitest';
import { choose, view, newGame } from '../../src/engine/index';
import { content, game, withScenes } from '../helpers';

describe('engine', () => {
  const c = content();

  it('starts every background at its start scene with its stats', () => {
    for (const bg of Object.keys(c.backgrounds)) {
      const s = game(bg);
      expect(s.scene).toBe(c.backgrounds[bg]!.start_scene);
      const total = Object.values(s.attributes).reduce((a, b) => a + b, 0);
      expect(total).toBe(11);
    }
  });

  it('picks exactly one flag from each random group, by seed', () => {
    const results = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const s = game('reeve', seed);
      const picked = ['father_skims', 'steward_skims'].filter((f) => s.flags[f]);
      expect(picked).toHaveLength(1);
      results.add(picked[0]!);
    }
    expect(results.size).toBe(2);
  });

  it('servant gets a role and its skills', () => {
    const s = newGame(c, { background: 'servant', seed: 1, name: 'x', role: 'huntsman' });
    expect(s.role).toBe('huntsman');
    expect(s.skills.woodcraft).toBe(3);
  });

  it('shows locked choices with a requirement label, hides hidden ones', () => {
    const v = view(c, game('archer'));
    const tally = v.choices.find((x) => x.id === 'tally')!;
    expect(tally.available).toBe(false);
    expect(tally.lockReason).toBe('Requires: can read');
    expect(v.choices.find((x) => x.id === 'name_patron')).toBeUndefined();
    expect(view(c, game('servant')).choices.find((x) => x.id === 'name_patron')).toBeDefined();
    expect(v.choices.find((x) => x.id === 'argue')!.band).toMatch(/Risky|Even|Favorable/);
  });

  it('refuses locked and invisible choices', () => {
    expect(() => choose(c, game('archer'), 'tally')).toThrow(/locked/);
    expect(() => choose(c, game('archer'), 'name_patron')).toThrow(/not visible/);
  });

  it('does not mutate the input state', () => {
    const s = game();
    const snap = JSON.stringify(s);
    choose(c, s, 'give_up');
    expect(JSON.stringify(s)).toBe(snap);
  });

  it('is reproducible: same seed and choices give the same state', () => {
    const play = () => {
      let s = game('burgess', 77);
      for (const id of ['strike']) s = choose(c, s, id).state;
      // whatever pool event came up, take its first available choice
      for (let i = 0; i < 6 && !s.ended; i++) {
        const v = view(c, s);
        s = choose(c, s, v.choices.find((x) => x.available)!.id).state;
      }
      return s;
    };
    expect(JSON.stringify(play())).toBe(JSON.stringify(play()));
  });

  it('forces check outcomes in debug', () => {
    const r = choose(c, game(), 'strike', { force: 'partial' });
    expect(r.check?.result).toBe('partial');
    expect(r.state.injuries.map((i) => i.id)).toContain('cut_brow');
  });

  it('plays a pool interlude and returns to the spine', () => {
    let s = choose(c, game(), 'give_up').state;
    expect(c.scenes[s.scene]!.kind).toBe('pool');
    expect(s.returnStack).toEqual(['t_evening']);
    const v = view(c, s);
    s = choose(c, s, v.choices.find((x) => x.available && !['wrestle', 'cutpurse'].includes(x.id))!.id).state;
    expect(s.scene).toBe('t_evening');
    expect(s.returnStack).toEqual([]);
  });

  it('fires a queued event a season later, with its cause, then resumes', () => {
    let s = choose(c, game('burgess'), 'pay').state; // queues t_q_odo for next season
    expect(s.queue).toHaveLength(1);
    s = choose(c, s, view(c, s).choices.find((x) => x.available && !x.tags.includes('martial') && x.id !== 'cutpurse')!.id).state;
    expect(s.scene).toBe('t_evening');
    s = choose(c, s, 'home').state;
    expect(s.scene).toBe('t_q_odo');
    expect(s.activeCause?.scene).toBe('t_market');
    expect(view(c, s).cause?.text).toBe('Give him sixpence to let go.');
    s = choose(c, s, 'take_it').state;
    expect(s.scene).toBe('t_winter');
    expect(s.journal.at(-1)!.cause?.choice).toBe('pay');
  });

  it('death only through a lethal choice, and it ends the game', () => {
    let s = choose(c, game('reeve'), 'argue', { force: 'success' }).state;
    s = choose(c, s, view(c, s).choices.find((x) => x.available && !x.tags.includes('martial') && x.id !== 'cutpurse')!.id).state;
    s = choose(c, s, 'home').state;
    const fight = view(c, s).choices.find((x) => x.id === 'fight')!;
    expect(fight.lethal).toBe(true);
    expect(fight.warn).toBeTruthy();
    s = choose(c, s, 'fight', { force: 'failure' }).state;
    expect(s.ended?.ending).toBe('death');
    expect(s.ended?.cause).toMatch(/aged 8\./);
    expect(view(c, s).choices).toHaveLength(0);
    expect(() => choose(c, s, 'wait')).toThrow(/ended/);
  });

  it('reaches the test ending', () => {
    let s = game('archer');
    for (let i = 0; i < 20 && !s.ended; i++) {
      const v = view(c, s);
      const ch = v.choices.find((x) => x.available && !x.lethal)!;
      s = choose(c, s, ch.id, { force: 'success' }).state;
    }
    expect(s.ended?.ending).toBe('test_complete');
    expect(s.time).toBe(1);
    expect(s.journal.length).toBeGreaterThanOrEqual(4);
  });

  it('reports a dead end when every choice is locked', () => {
    const cc = withScenes([{ id: 'x_dead', chapter: 'test', text: 'x', choices: [{ id: 'a', text: 'a', requires: 'skill.arms >= 9', next: 't_end' }] }]);
    const s = game('reeve', 1, cc);
    s.scene = 'x_dead';
    expect(view(cc, s).deadEnd).toBe(true);
  });
});

describe('queued events with a chapter gate', () => {
  it('wait for the named chapter even when due', () => {
    const c = content();
    const s = game('burgess');
    s.queue.push({ event: 't_q_odo', dueAt: 0, earliestChapter: 'ch1', origin: { scene: 'x', choice: 'y', at: 0, text: 't' } });
    const after = choose(c, s, 'give_up').state;
    expect(after.queue).toHaveLength(1);
    expect(c.scenes[after.scene]!.kind).toBe('pool');
  });
});

describe('mergeChanges', () => {
  it('folds repeated numeric changes and drops ones that cancel out', async () => {
    const { mergeChanges } = await import('../../src/engine/index');
    expect(mergeChanges(['A +1', 'Gained: X', 'A +2', 'B −1', 'B +1'])).toEqual(['A +3', 'Gained: X']);
  });
});

describe('Phase 3 rules', () => {
  const c = content();
  const atScene = (scene: string, bg = 'reeve') => {
    const s = game(bg);
    s.scene = scene;
    return s;
  };

  it('a failed ford charge kills only the unarmoured or already injured', () => {
    const armoured = atScene('c1_raid');
    armoured.items.push('padded_jack');
    const a = choose(c, armoured, 'charge', { force: 'failure' }).state;
    expect(a.ended).toBeUndefined();
    expect(a.injuries.map((i) => i.id)).toContain('cracked_skull');

    const bare = choose(c, atScene('c1_raid'), 'charge', { force: 'failure' }).state;
    expect(bare.ended?.ending).toBe('death');

    const hurt = atScene('c1_raid');
    hurt.items.push('padded_jack');
    hurt.injuries.push({ id: 'bruised_ribs', since: hurt.time });
    expect(choose(c, hurt, 'charge', { force: 'failure' }).state.ended?.ending).toBe('death');
  });

  it('text conditions accept && and ||', async () => {
    const { renderText } = await import('../../src/engine/text');
    const s = game('archer');
    expect(renderText('[if background == reeve || item.yew_bow && !injured]yes[else]no[/if]', s, c)).toBe('yes');
    s.injuries.push({ id: 'bruised_ribs', since: 0 });
    expect(renderText('[if background == reeve || item.yew_bow && !injured]yes[else]no[/if]', s, c)).toBe('no');
  });

  it('a bowman\'s son needs knights to stand witness before his master can dub him', () => {
    const s = atScene('c1_knighting', 'archer');
    s.aliases.master = 'ancel_brome';
    s.npcs.ancel_brome!.respect = 6;
    s.res.renown = 5;
    s.rep.knights = 0;
    const locked = view(c, s).choices.find((x) => x.id === 'master')!;
    expect(locked.available).toBe(false);
    expect(locked.lockReason).toMatch(/bowman's son/);
    s.rep.knights = 2;
    expect(view(c, s).choices.find((x) => x.id === 'master')!.available).toBe(true);
  });
});
