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
