import { describe, it, expect } from 'vitest';
import { choose, view, heroOf } from '../src/game/index';
import { heldFromOdds, select } from '../src/game/family';
import { FOUNDER_ID, type HouseState } from '../src/game/state';
import { toSave, fromSave } from '../src/game/save';
import { renderText } from '@engine/text';
import { content, house } from './helpers';
import { toDynasty } from '../../knight/src/game/dynasty';
import { loadPlans, playPlan } from '../../knight/tools/bot-lib';
import { loadContent as loadKnight } from '../../knight/tools/content-loader';
import { fromDynasty } from '../src/game/import';

// The Founder opening's prologue (STORY.md, Layer 3, P1-P16), played through by preference.
const c = content();

/** Plays to the end: in each scene the first preferred choice that is open, else the first open choice. */
function drive(s: HouseState, prefs: Record<string, string[]>, seen: string[] = []): HouseState {
  for (let i = 0; i < 200 && !s.ended; i++) {
    const v = view(c, s);
    seen.push(v.sceneId);
    for (const t of [v.title ?? '', v.text, v.outcome?.text ?? '', ...v.choices.map((x) => x.text)]) expect(t, `unrendered text in ${v.sceneId}`).not.toMatch(/[{}]|undefined|\[if /);
    const open = v.choices.filter((x) => x.available);
    expect(open.length, `dead end in ${v.sceneId}`).toBeGreaterThan(0);
    // a preference may force its check: "law!failure"
    const pref = (prefs[v.sceneId] ?? []).map((p) => p.split('!') as [string, string?]).find(([id]) => open.some((x) => x.id === id));
    const pick = pref?.[0] ?? open[0]!.id;
    s = choose(c, s, pick, pref?.[1] ? { force: pref[1] as 'success' | 'failure' } : {}).state;
  }
  return s;
}

const ROUTE = {
  h_p01_hall: ['bounds'], h_p02_company: ['counsel'], h_p03_heir: ['manor'], h_p04_suit: ['families'],
  h_p05_michaelmas: ['save'], h_p06_offer: ['refuse'], h_p07_year: ['watch'], h_p08_summons: ['ride'],
  h_p08_estates: ['silent'], h_p08_patent: ['concede'], h_p08_election: ['queen'],
  h_p09_illness: ['rest'], h_p10_handover: ['hall'], h_p11_first_days: ['sign'], h_p12_will: ['honour'],
  h_p13_boundary: ['concede'], h_p14_deathbed: ['be_myself'], h_p15_funeral: ['chancel'], h_p16_oath: ['plain'],
};

describe('the prologue: The Old Lord', () => {
  it('starts the Founder opening in the hall, as the founder', () => {
    const s = house();
    expect(s.scene).toBe('h_p01_hall');
    expect(s.hero).toBe(FOUNDER_ID);
    expect(view(c, s).text).toMatch(/The hall is cold in the mornings now/);
  });

  for (const [frame, sovereign] of [['free', 'mahaut'], ['free', 'duchy'], ['free', 'thibaut'], ['adalian', 'edwin']] as const) {
    it(`plays to its end in a ${frame} West under ${sovereign}, and passes the house to the heir`, () => {
      const seen: string[] = [];
      const s = drive(house({ frame, sovereign }), ROUTE, seen);
      expect(s.ended?.ending).toBe('story_so_far');
      expect(s.hero).not.toBe(FOUNDER_ID);
      expect(s.characters[FOUNDER_ID]!.alive).toBe(false); // the deathbed
      expect(seen).toContain(frame === 'adalian' ? 'h_p08_patent' : sovereign === 'thibaut' ? 'h_p08_election' : 'h_p08_estates');
      expect(seen).toContain('h_p15_funeral');
      expect(fromSave(JSON.parse(JSON.stringify(toSave(s, c))), c).state).toEqual(s);
    });
  }

  it('reads for a founder of either sex', () => {
    const s = drive(house({ sex: 'female' }), ROUTE);
    expect(s.ended?.ending).toBe('story_so_far');
  });

  it("crowns Mahaut after Thibaut's death unless the house speaks for the boy", () => {
    const s = drive(house({ frame: 'free', sovereign: 'thibaut' }), ROUTE);
    expect(s.realm.sovereign).toBe('mahaut');
    expect(s.flags.h_thibaut_dead).toBe(true);
  });

  it('keeps a cloistered founder alive, and skips the funeral', () => {
    const seen: string[] = [];
    const prefs = { ...ROUTE, h_p09_illness: ['relic'], h_p10_handover: ['cloister', 'hall'] };
    // the relic is a check; try seeds until the founder rallies and the cowl is open
    for (let seed = 1; seed < 40; seed++) {
      seen.length = 0;
      const s = drive(house({ seed }), prefs, seen);
      if (!s.flags.h_cloister) continue;
      // alive through the prologue (the abbey gate, not the deathbed), and dead by the abbot's letter in Book I, Act I
      expect(seen).toContain('h_p16_oath');
      expect(seen).not.toContain('h_p15_funeral');
      expect(seen).toContain('h_b09_abbot');
      expect(s.characters[FOUNDER_ID]!.retired).toBe(true);
      expect(s.characters[FOUNDER_ID]!.alive).toBe(false);
      expect(s.ended?.ending).toBe('story_so_far');
      return;
    }
    throw new Error('no seed reached the cloister');
  });

  it('holds the odds off the founder, the spouse and the heirs in the prologue only', () => {
    const s = house();
    const held = heldFromOdds(s);
    expect(held.has(FOUNDER_ID)).toBe(true);
    expect(held.has(s.characters[FOUNDER_ID]!.spouse!)).toBe(true);
    expect(held.has(select(s, c, 'heir')!)).toBe(true);
    expect(heldFromOdds({ ...s, chapter: 'book1' }).size).toBe(0);
  });

  it('names the sibling: the founder\'s eldest child who does not keep the house', () => {
    const s = house();
    const heir = select(s, c, 'heir');
    const sib = select(s, c, 'sibling');
    if (sib) expect(sib).not.toBe(heir);
    expect(renderText('{founder.first}', s, c)).toBe(heroOf(s).name.split(' ')[0]);
    expect(renderText('{house.claimed}, {house.companion}', s, c)).toBe('Kerval, Piers atte Brook');
  });

  it('plays from every Knight of Adalia life that ends as a Founder', () => {
    const knight = loadKnight();
    let played = 0;
    for (const plan of loadPlans()) {
      const end = playPlan(knight, plan).state;
      if (end.ended?.ending !== 'founder') continue;
      const d = toDynasty(end, knight);
      const s = drive(fromDynasty(c, d, { seed: 3, frame: 'free', sovereign: 'duchy' }), ROUTE);
      expect(s.ended?.ending, plan.name).toBe('story_so_far');
      expect(s.inheritance).toBeDefined();
      played++;
    }
    expect(played).toBeGreaterThan(0);
  });
});

describe('Book I, Act I: The New Lord', () => {
  const titles = (seen: string[]) => seen.map((id) => c.scenes[id]?.title ?? id);

  it('judges Kerval by the charter, and moves the verdict one step by the court check', () => {
    const open = { ...ROUTE, h_p04_suit: ['law'], h_p06_offer: ['refuse'], h_p13_boundary: ['concede'] };
    const cases: [string, string, string][] = [
      ['law!success', 'argue!success', 'h_kerval_kept'],
      ['law!success', 'argue!failure', 'h_kerval_shared'],
      ['law!failure', 'argue!success', 'h_kerval_shared'],
      ['law!failure', 'argue!failure', 'h_kerval_lost'],
    ];
    for (const [charter, court, want] of cases) {
      const seen: string[] = [];
      const s = drive(house(), { ...open, h_p04_suit: [charter], h_b06_suit: [court] }, seen);
      expect(seen, `${charter} ${court}`).toContain('h_b06_suit');
      expect(['h_kerval_kept', 'h_kerval_shared', 'h_kerval_lost'].filter((f) => s.flags[f]), `${charter} ${court}`).toEqual([want]);
    }
  });

  it('skips the suit when the prologue settled it', () => {
    const seen: string[] = [];
    drive(house(), { ...ROUTE, h_p04_suit: ['buy'] }, seen);
    expect(seen).not.toContain('h_b06_suit');
    expect(seen).toContain('h_b12_estates');
  });

  it("marries the Keeper by the story's match, and never offers the founder's children the odds' matches", () => {
    const seen: string[] = [];
    const s = drive(house({ seed: 4 }), { ...ROUTE, h_b03_match: ['kerguen'], h_b08_match: ['penhoet'] }, seen);
    const keeper = s.characters[s.hero]!;
    expect(s.characters[keeper.spouse!]!.name).toBe(keeper.sex === 'male' ? 'Azenor de Kerguen' : 'Tanguy de Kerguen');
    expect(titles(seen)).not.toContain('A Match');
    expect(seen).toContain('h_b04_wedding');
  });

  it('brings the Sauvel bride over the hills when Knight of Adalia made the peace with a marriage', () => {
    const knight = loadKnight();
    const plan = loadPlans().find((p) => playPlan(knight, p).state.ended?.ending === 'founder')!;
    const d = toDynasty(playPlan(knight, plan).state, knight);
    d.flags = [...d.flags, 'c5r_peace_marriage'];
    const seen: string[] = [];
    const s = drive(fromDynasty(c, d, { seed: 5, frame: 'free', sovereign: 'mahaut' }), ROUTE, seen);
    expect(seen).toContain('h_b03_sauvel');
    expect(seen).not.toContain('h_b03_match');
    expect(s.characters[s.characters[s.hero]!.spouse!]!.name).toMatch(/de Sauvel$/);
  });

  it('reaches the end of Act I in every frame and sovereign, with the two offers on the table', () => {
    for (const [frame, sovereign] of [['free', 'mahaut'], ['free', 'duchy'], ['free', 'thibaut'], ['adalian', 'edwin']] as const) {
      const seen: string[] = [];
      const s = drive(house({ frame, sovereign }), ROUTE, seen);
      expect(seen).toContain(frame === 'adalian' ? 'h_b02_governor' : 'h_b02_herald');
      expect(seen.at(-1)).toBe('h_b12_estates');
      expect(s.scene).toBe('h_b_end');
      expect(s.time).toBe(32); // Lady Day, year 58
    }
  });
});
