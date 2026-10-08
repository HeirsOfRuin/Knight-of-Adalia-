import { describe, it, expect } from 'vitest';
import { view, choose, startsOf, type HouseState } from '../src/game/index';
import { questionsFor, settleAnswers, buildExport, newGameFromSetup, SETUP, type SetupStart } from '../src/game/setup';
import { select } from '../src/game/family';
import { FOUNDER_ID } from '../src/game/state';
import { content } from './helpers';

// A new house from the setup questions (setup.ts): the answers build a dynasty export, imported like a real life.
const c = content();

function play(s: HouseState): { s: HouseState; seen: string[] } {
  const seen: string[] = [];
  for (let i = 0; i < 300 && !s.ended; i++) {
    const v = view(c, s);
    seen.push(v.sceneId);
    for (const t of [v.title ?? '', v.text, ...v.choices.map((x) => x.text), ...(v.outcome?.changes ?? [])]) expect(t, `unrendered text in ${v.sceneId}`).not.toMatch(/[{}]|undefined|NaN|\[if /);
    const open = v.choices.filter((x) => x.available);
    expect(open.length, `dead end in ${v.sceneId}`).toBeGreaterThan(0);
    s = choose(c, s, open[i % open.length]!.id).state;
  }
  return { s, seen };
}

describe('the setup questions', () => {
  it('ask seven questions for every start, and more for the Founder and the Crowned openings', () => {
    const start = (opening: string, sovereign: string): SetupStart => ({ opening, frame: 'free', sovereign, name: 'Hal', sex: 'male', seed: 3 });
    expect(questionsFor(c, start('diminished', 'mahaut'), {})).toHaveLength(7);
    expect(questionsFor(c, start('founder', 'mahaut'), {}).map((q) => q.id)).toContain('penhoet');
    const crowned = questionsFor(c, start('crowned', 'self'), {}).map((q) => q.id);
    expect(crowned).toEqual(expect.arrayContaining(['succession', 'querec', 'peace']));
    // Mahaut only for a crowned man; her children are hers, so the question changes with the marriage
    expect(questionsFor(c, { ...start('crowned', 'self'), sex: 'female' }, {}).find((q) => q.id === 'marriage')!.options.map((o) => o.id)).not.toContain('mahaut');
    expect(questionsFor(c, start('crowned', 'self'), { marriage: 'mahaut' }).find((q) => q.id === 'children')!.options.map((o) => o.id)).toEqual(['mahaut_son', 'mahaut_daughter']);
  });

  it('starts every opening, frame and sovereign from the default answers, and plays it to the end of what is written', () => {
    for (const st of startsOf(c)) {
      const start: SetupStart = { ...st, name: 'Hal', sex: 'male', seed: 5 };
      const s = newGameFromSetup(c, start, {});
      expect(s.opening, `${st.opening}/${st.frame}/${st.sovereign}`).toBe(st.opening);
      expect(s.realm, `${st.opening}/${st.frame}/${st.sovereign}`).toMatchObject({ west: st.frame, sovereign: st.sovereign });
      expect(select(s, c, 'heir'), `${st.opening}: an heir`).toBeDefined();
      const { s: end } = play(s);
      expect(end.ended?.ending, `${st.opening}/${st.frame}/${st.sovereign}`).toBe('story_so_far');
    }
  });

  it('turns every answer into the life it describes', () => {
    const start: SetupStart = { opening: 'crowned', frame: 'free', sovereign: 'self', name: 'Hal', sex: 'male', seed: 9 };
    const d = buildExport(c, start, { origin: 'archer', rise: 'purse', marriage: 'mahaut', children: 'mahaut_son', treasury: 'rich', succession: 'choose', querec: 'exiled', peace: 'bought' });
    expect(d.founder.background).toBe('archer');
    expect(d.spouse?.id).toBe('mahaut_armance');
    expect(d.heirs).toMatchObject([{ sex: 'son', age: 5 }]);
    expect(d.flags).toEqual(expect.arrayContaining(['c5_married_mahaut', 'c5r_estates_choose', 'c5r_querec_exiled', 'c5r_peace_bought', 'c5_reigns']));
    // £250 for a crown, ×1.5 by the purse, ×2.5 rich, ×0.8 for the peace bought
    expect(d.wealth.coin).toBe(Math.round(60000 * 1.5 * 2.5 * 0.8));
    const s = newGameFromSetup(c, start, { marriage: 'mahaut', children: 'mahaut_son', succession: 'choose' });
    expect(s.scene).toBe('h_pc00_crown');
    expect(view(c, choose(c, s, 'go_on').state).sceneId).toBe('h_pc01_court');
    expect(s.estate?.name).toBe('Kerval');
    expect(s.vassals).toHaveLength(12);
    expect(s.vassals!.find((v) => v.id === 'salvert')).toMatchObject({ seat: 'the Salvert dyke' });
  });

  it('starts a woman founder with a husband, and her children are hers', () => {
    const s = newGameFromSetup(c, { opening: 'founder', frame: 'free', sovereign: 'mahaut', name: 'Isabel', sex: 'female', seed: 4 }, { marriage: 'keys' });
    const f = s.characters[FOUNDER_ID]!;
    expect(f.sex).toBe('female');
    expect(s.characters[f.spouse!]!.sex).toBe('male');
    const kids = Object.values(s.characters).filter((k) => k.mother === FOUNDER_ID);
    expect(kids.length).toBeGreaterThan(0);
    expect(kids.every((k) => k.father === f.spouse)).toBe(true);
  });

  it('settles a missing or stale answer to the first open option', () => {
    const start: SetupStart = { opening: 'founder', frame: 'free', sovereign: 'mahaut', name: 'Hal', sex: 'male', seed: 1 };
    const a = settleAnswers(c, start, { children: 'mahaut_son', treasury: 'nonsense' });
    expect(a.children).toBe('grown_son');
    expect(a.treasury).toBe('comfortable');
    expect(Object.keys(a)).toHaveLength(questionsFor(c, start, a).length);
    expect(SETUP.every((q) => q.options.length >= 2)).toBe(true);
  });
});
