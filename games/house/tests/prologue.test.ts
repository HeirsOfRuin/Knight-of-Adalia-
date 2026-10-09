import { describe, it, expect } from 'vitest';
import { choose, view, heroOf } from '../src/game/index';
import { heldFromOdds, select, die } from '../src/game/family';
import { FOUNDER_ID, type HouseState } from '../src/game/state';
import { toSave, fromSave } from '../src/game/save';
import { renderText } from '@engine/text';
import { content, house, withScenes } from './helpers';
import { toDynasty } from '../../knight/src/game/dynasty';
import { loadPlans, playPlan } from '../../knight/tools/bot-lib';
import { loadContent as loadKnight } from '../../knight/tools/content-loader';
import { fromDynasty } from '../src/game/import';
import { decodeDynasty } from '@dynasty/contract';
import { readFileSync } from 'node:fs';

// The Founder opening's prologue (STORY.md, Layer 3, P1-P16), played through by preference.
const c = content();

/** Plays to the end: in each scene the first preferred choice that is open, else the first open choice. */
/** The head dies, as the odds or a scene would kill them: the succession is queued for the next scene. */
function applyDeath(s: HouseState, cause: string): HouseState {
  const t: HouseState = JSON.parse(JSON.stringify(s));
  die(t, t.hero, cause);
  return t;
}

function drive(s: HouseState, prefs: Record<string, string[]>, seen: string[] = [], until?: string): HouseState {
  for (let i = 0; i < 300 && !s.ended && s.scene !== until; i++) {
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
  it('lets the founder spend on the manor at the first Michaelmas, once each, and goes on', () => {
    const seen: string[] = [];
    const s = drive(house(), { ...ROUTE, h_p05_purse: ['market', 'granary', 'done'] }, seen);
    expect(seen.filter((x) => x === 'h_p05_purse')).toHaveLength(3);
    expect(s.holdings?.market_charter).toMatchObject({ income: 1200, kind: 'trade' });
    expect(s.flags.inv_h_granary).toBe(true);
    expect(seen).toContain('h_p06_offer');
  });

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
    const s = drive(house({ frame: 'free', sovereign: 'thibaut' }), ROUTE, [], 'h_e01_crisis');
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
    const s = drive(house({ seed: 4 }), { ...ROUTE, h_b03_match: ['kerguen'], h_b08_match: ['penhoet'] }, seen, 'h_e01_crisis');
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
    const s = drive(fromDynasty(c, d, { seed: 5, frame: 'free', sovereign: 'mahaut' }), ROUTE, seen, 'h_e01_crisis');
    expect(seen).toContain('h_b03_sauvel');
    expect(seen).not.toContain('h_b03_match');
    expect(s.characters[s.characters[s.hero]!.spouse!]!.name).toMatch(/de Sauvel$/);
  });

  it('plays Act II, The Law, in every frame and sovereign, to the likely outcome by default', () => {
    for (const [frame, sovereign] of [['free', 'mahaut'], ['free', 'duchy'], ['free', 'thibaut'], ['adalian', 'edwin']] as const) {
      const seen: string[] = [];
      const s = drive(house({ frame, sovereign }), ROUTE, seen, 'h_e01_crisis');
      expect(seen).toContain(frame === 'adalian' ? 'h_b02_governor' : 'h_b02_herald');
      expect(seen).toEqual(expect.arrayContaining(['h_b12_estates', 'h_c01_offers', 'h_c07_march', 'h_c09_result', 'h_c11_house_law', 'h_d01_sickness', 'h_d06_succour', 'h_d10_count', 'h_d11_will']));
      expect(s.scene).toBe('h_e01_crisis');
      expect(s.time).toBe(68); // spring, year 67: Act IV opens
      // the Mottle has come and gone; the Old Companion is dead, and Ronan de Penhoët with him
      expect(s.flags.plague).toBeFalsy();
      expect(s.flags.h_companion_dead).toBe(true)
      // the first open choice takes Mahaut's side, so the likely outcome stands
      if (frame === 'adalian') expect(s.flags.h_wardship_king).toBe(true);
      else expect(s.flags.h_realm_male_pref || s.flags.h_realm_male_line).toBe(true);
      expect(s.realm.war).toBeUndefined(); // the companies' summer is over
    }
  });

  it('overturns the likely law only with the threshold met and an ally beside the house', () => {
    const push = { ...ROUTE, h_c01_offers: ['rival'], h_c02_hearing: ['speak!success'], h_c03_price: ['refuse'], h_c05_count: ['ally_kerguen!success'], h_c07_march: ['send!success'], h_c09_vote: ['speak!success'] };
    const won = drive(house({ seed: 3 }), push);
    expect(won.counters.overturn).toBeGreaterThanOrEqual(6);
    expect(won.counters.allies).toBe(1);
    expect(won.flags.h_realm_male_line).toBe(true);
    // the same push without the ally falls short (L3-13)
    const alone = drive(house({ seed: 3 }), { ...push, h_c05_count: ['spend'] });
    expect(alone.counters.overturn).toBeGreaterThanOrEqual(6);
    expect(alone.flags.h_realm_male_pref).toBe(true);
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
      const s = drive(fromDynasty(c, married(), { seed }), CROWNED, seen, 'h_n01_after');
      expect(seen.slice(0, 2)).toEqual(['h_pc00_crown', 'h_pc01_court']);
      expect(seen).toContain('h_pc10_crowning');
      expect(seen).not.toContain('h_p01_hall');
      expect(seen).toEqual(expect.arrayContaining(['h_bc09_estates', 'h_k01_estates', 'h_k05_vote', 'h_k06_majority', 'h_k07_rising']));
      expect(s.scene).toBe('h_n01_after');
      // Mahaut's child heads the house: Jehanne, unless the odds took her in Act II and a brother or sister followed (L2-4)
      const queen = s.characters[s.hero]!;
      expect(s.characters[queen.mother!]!.name).toBe("Mahaut d'Armance");
      expect(Object.values(s.characters).some((x) => x.name === 'Jehanne')).toBe(true);
      // the Mottle takes the old king in 926 (L3-38)
      expect(s.characters[FOUNDER_ID]!.alive).toBe(false);
      expect(s.characters[FOUNDER_ID]!.died).toBe((64 - 50) * 4);
      expect(s.characters[FOUNDER_ID]!.retired).toBe(true);
      expect(s.characters[queen.mother!]!.alive).toBe(true);
      expect(s.flags.h_c_junior).toBe(true);
      expect(s.time).toBe(68);
      expect(s.family.regent).toBeUndefined(); // of age in Act II
    }
  });

  it('makes Mahaut regent for the child queen until she is sixteen', () => {
    const s = drive(fromDynasty(c, married(), { seed: 4 }), CROWNED, [], 'h_k01_estates');
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

    it('carries the lands, the knights, the standing and the people the life left, and settles them at Michaelmas', async () => {
      const d = await saved();
      const s = fromDynasty(c, d, { seed: 1 });
      expect(s.estate).toMatchObject({ name: 'Marsalin', people: 489, salt: 10, temper: 5 });
      expect(Object.keys(s.holdings!)).toHaveLength(d.lands.holdings.length);
      expect(s.holdings!.crown_revenues!.income).toBe(144000);
      expect(s.vassals).toHaveLength(d.lands.vassals!.length);
      expect(s.vassals!.find((v) => v.id === 'lesneven')).toMatchObject({ seat: 'Lesneven' });
      expect(s.rep.church).toBe(d.founder.reputation.church);
      expect(s.rep.honor).toBe(d.founder.reputation.honor);
      expect(s.npcs.mahaut_armance!.affection).toBe(10);
      expect(s.res.coin).toBe(d.wealth.coin);
      // the children's qualities grow from temperament and upbringing (Jehan is bold)
      const jehan = Object.values(s.characters).find((x) => x.name === 'Jehan')!;
      expect(jehan.attributes.strength).toBe(3);
      // play to the first Michaelmas: one line for the year, and the purse grows by the year's account
      let t = s;
      const lines: string[] = [];
      for (let i = 0; i < 12 && t.time < 3; i++) { const r = choose(c, t, view(c, t).choices.find((x) => x.available)!.id); t = r.state; lines.push(...(t.lastOutcome?.changes ?? [])); }
      expect(lines.some((l) => /^Michaelmas, a [a-z]+ harvest and (slack|steady|brisk) trade: £\d+.* came in; the household .*, the men's pay .* and repairs .* went out$/.test(l))).toBe(true);
    });

    it('carries a hereditary crown only with the case made and an ally, with or without Hervé\'s bargain', async () => {
      const base = { ...CROWNED, h_k02_case: ['hereditary'], h_k05_vote: ['on'] };
      const bargain = drive(fromDynasty(c, await saved(), { seed: 1 }), { ...base, h_k01_estates: ['accept'], h_k03_count: ['kerguen!success', 'hold'] }, [], 'h_m01_wedding');
      expect(bargain.flags.h_crown_hereditary).toBe(true);
      expect(bargain.flags.h_armance_male_line).toBe(true);
      const refused = drive(fromDynasty(c, await saved(), { seed: 1 }), { ...base, h_k01_estates: ['refuse'], h_k03_count: ['spend', 'kerguen!success', 'church!success', 'hold'] }, [], 'h_m01_wedding');
      expect(refused.flags.h_crown_hereditary).toBe(true);
      expect(refused.flags.h_k_penhoet_waits).toBe(true);
      const short = drive(fromDynasty(c, await saved(), { seed: 1 }), { ...base, h_k01_estates: ['refuse'], h_k03_count: ['hold'] }, [], 'h_m01_wedding');
      expect(short.flags.h_crown_for_life).toBe(true);
    });

    it('sends the Estates to choose when the sovereign dies under the elective crown, and they may choose outside the house', async () => {
      const route = { ...CROWNED, h_k02_case: ['for_life'], h_crown_estates: ['aside'] };
      let s = drive(fromDynasty(c, await saved(), { seed: 2 }), route, [], 'h_m04_crown');
      expect(s.flags.h_crown_for_life).toBe(true);
      expect(s.realm.sovereign).toBe('self');
      // the young king dies (the Mottle, by the odds or by this test)
      s = applyDeath(s, 'the Mottle');
      const seen: string[] = [];
      s = drive(s, route, seen, 'h_n01_after');
      expect(seen).toEqual(expect.arrayContaining(['h_q_succession', 'h_crown_estates', 'h_crown_lost']));
      expect(s.flags.h_crown_lost).toBe(true);
      expect(['tanguy', 'herve', 'lothaire']).toContain(s.realm.sovereign);
      expect(s.characters[s.hero]!.station).toBe('great_lord');
      expect(s.holdings?.crown_revenues).toBeUndefined();
      expect(s.estate?.name).toBe('Marsalin'); // the house keeps its own
      expect(s.scene).toBe('h_n01_after');
    });

    it('plays the elective crown through Act II, with Jehan king and of age', async () => {
      for (const seed of [1, 2, 3]) {
        const seen: string[] = [];
        const s = drive(fromDynasty(c, await saved(), { seed }), CROWNED, seen, 'h_n01_after');
        expect(s.scene).toBe('h_n01_after');
        expect(seen).toContain('h_pc08_estates');
        expect(seen).toContain('h_bc09_estates');
        const king = s.characters[s.hero]!;
        expect(king.name).toBe('Jehan');
        expect(s.family.regent).toBeUndefined();
        expect(s.characters[FOUNDER_ID]!.alive).toBe(false); // the Mottle took him (L3-38)
        // the elective crown: confirmed for life unless the crown carried a hereditary one
        expect(s.flags.h_crown_for_life || s.flags.h_crown_hereditary).toBe(true);
        expect(renderText('{realm.sovereign}', s, c)).toBe('King Jehan');
        expect(view(c, s).text).not.toMatch(/Jehanne/);
        // and the end of Act I read as it did
        const mid = drive(fromDynasty(c, await saved(), { seed }), CROWNED, [], 'h_k01_estates');
        expect(mid.family.regent).toBe(king.mother);
      }
    });
  });

  it('keeps the framework scene for a crowned life without Mahaut', () => {
    const s = fromDynasty(c, crowned(), { seed: 1 });
    expect(choose(c, s, 'go_on').state.scene).toBe('h_open');
  });
});

describe("Book I, Act IV: the test of the law, and the Keeper's end", () => {
  for (const [frame, sovereign] of [['free', 'mahaut'], ['free', 'duchy'], ['free', 'thibaut'], ['adalian', 'edwin']] as const) {
    it(`plays to the end of Book I in a ${frame} West under ${sovereign}, and always ends the Keeper's headship`, () => {
      const seen: string[] = [];
      const s = drive(house({ frame, sovereign }), ROUTE, seen);
      if (s.ended?.ending === 'extinct') return; // the Mottle can still end a house (Act III)
      expect(s.scene).toBe('h_e_end');
      expect(seen).toEqual(expect.arrayContaining(['h_e01_crisis', 'h_e02_side', 'h_e04_move', 'h_e06_kerval', 'h_e08_settled', 'h_e09_mahaut', 'h_e10_test']));
      expect(seen).toContain(frame === 'adalian' ? 'h_e07_majority' : 'h_e07_illness');
      // Hervé is dead, and Penhoët is settled one of three ways (L2-3)
      expect(['h_penhoet_broken', 'h_penhoet_reconciled', 'h_penhoet_contained'].filter((f) => s.flags[f])).toHaveLength(1);
      if (frame === 'free') expect(['h_armance_jehanne', 'h_armance_penhoet', 'h_armance_crown', 'h_armance_cousin'].filter((f) => s.flags[f])).toHaveLength(1);
      expect(s.realm.war).toBeUndefined();
      // E13 always ends the headship (L3-23): the Builder heads the house at the close of Book I
      expect(s.family.generation).toBeGreaterThanOrEqual(3);
      // by E13, or earlier by the odds (L2-4)
      expect(seen.includes('h_e13_end') || s.family.since < (77 - 50) * 4).toBe(true);
    });
  }

  it("crowns Jehanne under male preference where her mother was Queen, and the Estates choose Gaucelin under the male line", () => {
    const pref = drive(house({ sovereign: 'mahaut' }), { ...ROUTE, h_e10_test: ['hold_back'] });
    expect(pref.flags.h_realm_male_pref).toBe(true);
    expect(pref.flags.h_armance_jehanne).toBe(true);
    expect(pref.realm.sovereign).toBe('jehanne');
    const push = { ...ROUTE, h_c01_offers: ['rival'], h_c02_hearing: ['speak!success'], h_c03_price: ['refuse'], h_c05_count: ['ally_kerguen!success'], h_c07_march: ['send!success'], h_c09_vote: ['speak!success'], h_e08_settled: ['contained'], h_e10_test: ['hold_back'] };
    const line = drive(house({ seed: 3, sovereign: 'mahaut' }), push);
    expect(line.flags.h_realm_male_line).toBe(true);
    expect(line.flags.h_armance_penhoet).toBe(true);
    expect(line.realm.sovereign).toBe('gaucelin');
    expect(line.flags.h_e_gaucelin_chosen).toBe(true);
  });

  it('lets a Keeper with nobody of the blood adopt an heir at the end, rather than end the house', () => {
    let s = house();
    for (let seed = 1; seed < 30; seed++) {
      s = drive(house({ seed }), ROUTE, [], 'h_e13_end');
      if (s.scene === 'h_e13_end') break;
    }
    expect(s.scene).toBe('h_e13_end');
    const t: HouseState = JSON.parse(JSON.stringify(s));
    const spouse = t.characters[t.hero]!.spouse;
    for (const [id, x] of Object.entries(t.characters)) if (id !== t.hero && id !== spouse && x.alive) die(t, id, 'a fever');
    expect(renderText('[if family.no_heir]none[/if]', t, c)).toBe('none');
    s = drive(t, { h_e13_end: ['hall'] });
    expect(s.ended?.ending).toBe('story_so_far');
    expect(s.flags.h_e_adopted).toBe(true);
    expect(s.characters[s.hero]!.traits).toContain('adopted');
  });

  it("buries the cloistered founder's widow in Act IV, where Act III passed her over", () => {
    const prefs = { ...ROUTE, h_p09_illness: ['relic'], h_p10_handover: ['cloister', 'hall'] };
    for (let seed = 1; seed < 60; seed++) {
      const s = drive(house({ seed }), prefs, [], 'h_e02_side');
      if (!s.flags.h_cloister || !s.characters[s.characters[FOUNDER_ID]!.spouse!]?.alive) continue;
      const seen: string[] = [];
      const end = drive(s, prefs, seen);
      expect(seen).toContain('h_e03_widow');
      expect(end.characters[end.characters[FOUNDER_ID]!.spouse!]!.alive).toBe(false);
      return;
    }
    throw new Error('no seed reached Act IV with the cloistered founder\'s widow living');
  });

  it("elects the founder's churchly child bishop when Knight of Adalia gave a child to the Church", () => {
    const knight = loadKnight();
    for (const plan of loadPlans()) {
      const end = playPlan(knight, plan).state;
      if (end.ended?.ending !== 'founder') continue;
      const d = toDynasty(end, knight);
      d.flags = [...d.flags, 'c5_younger_church'];
      for (let seed = 1; seed < 20; seed++) {
        const s = drive(fromDynasty(c, d, { seed, frame: 'free', sovereign: 'duchy' }), ROUTE, [], 'h_e04_move');
        if (!select(s, c, 'sibling')) continue;
        const seen: string[] = [];
        drive(s, { ...ROUTE, h_e05_bishop: ['weight!success'] }, seen);
        expect(seen).toContain('h_e05_bishop');
        return;
      }
    }
    throw new Error('no Founder life left a sibling living into Act IV');
  });
});

describe("the crowned path, Act IV: the Armance, and the junior crown", () => {
  const code = readFileSync(new URL('./fixtures/author-crowned.koad', import.meta.url), 'utf8').trim();
  const saved = () => decodeDynasty(code);
  const knightish = { h_pc00_crown: ['go_on'], h_pc10_crowning: ['cathedral'], h_pc16_acclamation: ['written'] };
  const hereditary = { ...knightish, h_k02_case: ['hereditary'], h_k05_vote: ['on'], h_k01_estates: ['refuse'], h_k03_count: ['spend', 'kerguen!success', 'church!success', 'hold'] };

  it('crowns the heir junior under a hereditary crown, and the old sovereign lives on at court', async () => {
    for (let seed = 1; seed < 8; seed++) {
      const seen: string[] = [];
      const pre = drive(fromDynasty(c, await saved(), { seed }), hereditary, [], 'h_n11_crowning');
      if (pre.scene !== 'h_n11_crowning') continue;
      const keeper = pre.hero;
      expect(pre.flags.h_crown_hereditary).toBe(true);
      expect(pre.flags.h_armance_united || pre.flags.h_armance_sibling || pre.flags.h_armance_child).toBe(true);
      const s = drive(pre, { h_n11_crowning: ['cathedral'] }, seen);
      expect(s.scene).toBe('h_n_end');
      expect(s.flags.h_n_junior).toBe(true);
      expect(s.hero).not.toBe(keeper);
      expect(s.characters[keeper]!.alive).toBe(true);
      expect(s.characters[keeper]!.retired).toBe(true);
      expect(s.realm.sovereign).toBe('self');
      return;
    }
    throw new Error('no seed reached the junior crown');
  });

  it('asks the Estates of a crown for life for the crown by blood; refused, the sovereign can lay it down and they choose', async () => {
    const forLife = { ...knightish, h_k02_case: ['for_life'] };
    for (let seed = 1; seed < 8; seed++) {
      const pre = drive(fromDynasty(c, await saved(), { seed }), forLife, [], 'h_n11_crowning');
      if (pre.scene !== 'h_n11_crowning') continue;
      expect(pre.flags.h_crown_for_life).toBe(true);
      const won = drive(pre, { h_n11_crowning: ['ask!success'] });
      expect(won.flags.h_crown_hereditary).toBe(true);
      expect(won.flags.h_crown_for_life).toBeFalsy();
      const seen: string[] = [];
      const lost = drive(pre, { h_n11_crowning: ['ask!failure'], h_n11b_refused: ['abdicate'], h_crown_estates: ['aside'] }, seen);
      expect(seen).toEqual(expect.arrayContaining(['h_n11b_refused', 'h_q_succession', 'h_crown_estates', 'h_crown_lost']));
      expect(lost.flags.h_crown_lost).toBe(true);
      expect(lost.scene).toBe('h_n_end');
      return;
    }
    throw new Error('no seed reached the junior crown');
  });

  it('gives the crown back to the house at King Hervé\'s death, if the Estates will have it', async () => {
    const route = { ...knightish, h_k02_case: ['for_life'], h_crown_estates: ['aside'], h_n12_claim: ['ask!success'] };
    let s = drive(fromDynasty(c, await saved(), { seed: 2 }), route, [], 'h_m04_crown');
    s = applyDeath(s, 'the Mottle');
    s.houses!.kerguen!.standing = 20; // Kerguen too small to be chosen: the male-line lords' Hervé is
    const seen: string[] = [];
    s = drive(s, route, seen, 'h_n01_after');
    expect(s.realm.sovereign).toBe('herve');
    s = drive(s, route, seen);
    expect(seen).toEqual(expect.arrayContaining(['h_n07_rising', 'h_n08k_king', 'h_n12_claim', 'h_n09_mahaut']));
    expect(seen).not.toContain('h_n08_herve');
    expect(s.flags.h_crown_regained).toBe(true);
    expect(s.flags.h_crown_lost).toBeFalsy();
    expect(s.holdings?.crown_revenues).toBeDefined();
  });

  it('plays a crown lost to Kerguen through the house\'s claim and the Founder\'s end', async () => {
    const route = { ...knightish, h_k02_case: ['for_life'], h_crown_estates: ['aside'] };
    let s = drive(fromDynasty(c, await saved(), { seed: 2 }), route, [], 'h_m04_crown');
    s = applyDeath(s, 'the Mottle');
    s.houses!.kerguen!.standing = 40;
    const seen: string[] = [];
    s = drive(s, route, seen);
    expect(seen).toEqual(expect.arrayContaining(['h_n08_herve', 'h_n09_mahaut', 'h_n12_claim']));
    expect(s.scene).toBe('h_e_end');
    expect(s.realm.sovereign).toBe('tanguy');
  });
});

describe('a death in the years a scene passes over', () => {
  it('runs the succession before the scene is read, and opens the scene again for the new head', () => {
    const cx = withScenes([
      { id: 't_from', chapter: 'book1', title: 'From', text: 'From.', choices: [ { id: 'go', text: 'Go.', next: 't_to' } ] },
      { id: 't_to', chapter: 'book1', title: 'To', text: '{name} reads this.', on_enter: [ { if: '!flag.t_once', then: [ { set: 'flag.t_once' }, { death: { who: 'head', cause: 'a fever' } } ] } ], choices: [ { id: 'on', text: 'On.', next: 't_to' } ] },
    ]);
    let s = drive(house(), ROUTE, [], 'h_b01_homage');
    const keeper = s.hero;
    s = { ...s, scene: 't_from' };
    s = choose(cx, s, 'go').state;
    expect(s.scene).toBe('h_q_succession');
    s = choose(cx, s, 'the_law').state;
    expect(s.scene).toBe('t_to');
    expect(s.hero).not.toBe(keeper);
    expect(view(cx, s).text).toContain(s.characters[s.hero]!.name.split(' ')[0]);
  });
});
