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
import { decodeDynasty } from '@dynasty/contract';
import { readFileSync } from 'node:fs';

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

describe('the crowned path: King of the West, married to Mahaut', () => {
  const knight = loadKnight();
  const crowned = () => {
    const plan = loadPlans().find((p) => playPlan(knight, p).state.ended?.ending === 'crowned')!;
    return toDynasty(playPlan(knight, plan).state, knight);
  };
  /** A crowned life married to Mahaut before the Estates in year 42, with no children before her (the author's run). */
  const married = () => {
    const d = crowned();
    d.flags = [...d.flags, 'c5_married_mahaut'];
    d.spouse = { id: 'mahaut_armance', name: "Mahaut d'Armance", alive: true };
    d.heirs = [];
    return d;
  };
  const CROWNED = {
    ...ROUTE, h_pc00_crown: ['go_on'], h_pc01_court: ['ride'], h_pc02_company: ['counsel'], h_pc03_heir: ['mahaut'],
    h_pc04_querec: ['watch'], h_pc05_exchequer: ['save'], h_pc06_embassy: ['free'], h_pc08_estates: ['swear'],
    h_pc09_illness: ['rest'], h_pc10_crowning: ['cathedral'], h_pc11_council: ['count'], h_pc12_regency: ['both'],
    h_pc13_rising: ['treat'], h_pc14_question: ['be_myself'], h_pc15_bishop: ['anselm'], h_pc16_acclamation: ['written'],
    h_bc01_homage: ['mother'], h_bc02_claim: ['hear'], h_bc03_betrothal: ['ronan'], h_bc04_court: ['let_him'],
    h_bc05_querec: ['hostage'], h_bc06_sibling: ['close'], h_bc07_mother: ['learn'], h_bc08_household: ['old'], h_bc09_estates: ['end'],
  };

  it('brings Mahaut at thirty-one, and Jehanne born in year 44, the heir under the crown\'s custom of the eldest', () => {
    const s = fromDynasty(c, married(), { seed: 2 });
    expect(s.opening).toBe('crowned');
    expect(s.family.law).toBe('eldest');
    const mahaut = s.characters[s.characters[FOUNDER_ID]!.spouse!]!;
    expect(mahaut.name).toBe("Mahaut d'Armance");
    expect(renderText('{spouse.age}', s, c)).toBe('31');
    const heir = s.characters[select(s, c, 'heir')!]!;
    expect(heir.name).toBe('Jehanne');
    expect(renderText('{heir.age}', s, c)).toBe('6');
    expect(heir.mother).toBe(s.characters[FOUNDER_ID]!.spouse);
    // Mahaut's other children, by the odds, are younger than Jehanne
    for (const k of Object.values(s.characters).filter((x) => x.mother === heir.mother && x !== heir)) expect(k.born).toBeGreaterThan(heir.born);
  });

  it('gives a child born before the marriage no mother in Mahaut', () => {
    const d = married();
    d.heirs = [{ name: 'Hamon', sex: 'son', age: 12, alive: true, bond: 1 }];
    const s = fromDynasty(c, d, { seed: 2 });
    const hamon = Object.values(s.characters).find((x) => x.name === 'Hamon')!;
    expect(hamon.mother).toBeUndefined();
    expect(Object.values(s.characters).some((x) => x.name === 'Jehanne')).toBe(true);
  });

  it('crowns Jehanne junior queen at nine, under her mother\'s regency, and plays to the end of Act I with the old king living', () => {
    for (const seed of [1, 2, 3]) {
      const seen: string[] = [];
      const s = drive(fromDynasty(c, married(), { seed }), CROWNED, seen);
      expect(seen.slice(0, 2)).toEqual(['h_pc00_crown', 'h_pc01_court']);
      expect(seen).toContain('h_pc10_crowning');
      expect(seen).not.toContain('h_p01_hall');
      expect(s.scene).toBe('h_bc_end');
      const queen = s.characters[s.hero]!;
      expect(queen.name).toBe('Jehanne');
      expect(s.characters[FOUNDER_ID]!.alive).toBe(true); // held to his death in about year 64
      expect(s.characters[FOUNDER_ID]!.retired).toBe(true);
      expect(s.characters[queen.mother!]!.alive).toBe(true);
      expect(s.flags.h_c_junior).toBe(true);
      expect(s.time).toBe(32);
    }
  });

  it('makes Mahaut regent for the child queen until she is sixteen', () => {
    const s = drive(fromDynasty(c, married(), { seed: 4 }), CROWNED);
    const queen = s.characters[s.hero]!;
    expect(renderText('{head.age}', s, c)).toBe('14');
    expect(s.family.regent).toBe(queen.mother);
  });

  describe("the author's own save: King David, Mahaut, and Jehan", () => {
    // Knight of Adalia's crowned ending with Mahaut, exported in year 50: Jehan five, the crown left to the Estates,
    // old Quérec exiled. The save decides the heir, so canon's Jehanne never appears.
    const code = readFileSync(new URL('./fixtures/author-crowned.koad', import.meta.url), 'utf8').trim();
    const saved = () => decodeDynasty(code);

    it('imports Jehan as heir under the custom of the eldest, in the second year of King David', async () => {
      const s = fromDynasty(c, await saved(), { seed: 1 });
      expect(s.opening).toBe('crowned');
      expect(s.family.law).toBe('eldest');
      expect(s.inheritance?.flags).toContain('c5r_estates_choose');
      const heir = s.characters[select(s, c, 'heir')!]!;
      expect(heir.name).toBe('Jehan');
      expect(heir.mother).toBe(s.characters[FOUNDER_ID]!.spouse);
      expect(Object.values(s.characters).some((x) => x.name === 'Jehanne')).toBe(false);
      expect(renderText('{date}', s, c)).toMatch(/second year of King David|year 2 of King David/i);
      expect(renderText('{house.ruler} {house.match_penhoet} {house.querec}', s, c)).toBe('King Sibylle de Penhoët Bertrand de Quérec');
    });

    it('plays the elective crown through to the end of Act I, with Jehan king under his mother\'s regency', async () => {
      for (const seed of [1, 2, 3]) {
        const seen: string[] = [];
        const s = drive(fromDynasty(c, await saved(), { seed }), CROWNED, seen);
        expect(s.scene).toBe('h_bc_end');
        expect(seen).toContain('h_pc08_estates');
        expect(seen).toContain('h_bc09_estates');
        const king = s.characters[s.hero]!;
        expect(king.name).toBe('Jehan');
        expect(s.family.regent).toBe(king.mother);
        expect(s.characters[FOUNDER_ID]!.alive).toBe(true);
        const end = view(c, s).text;
        expect(end).toMatch(/King of the West/);
        expect(end).toMatch(/whether the crown of the West is theirs to give/);
        expect(end).not.toMatch(/Jehanne|Queen of the West/);
      }
    });
  });

  it('keeps the framework scene for a crowned life without Mahaut', () => {
    const s = fromDynasty(c, crowned(), { seed: 1 });
    expect(choose(c, s, 'go_on').state.scene).toBe('h_open');
  });
});
