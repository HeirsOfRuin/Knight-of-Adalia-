// A new house without a save: a few questions settle what Knight of Adalia would have (the author's decision,
// 2026-10-08). The answers build a dynasty export, so a fresh start and an imported life run through one door
// (import.ts fromDynasty) and the story reads the same flags either way. Every question has a default, so a player
// can begin at once.
import type { DynastyExport, DynastyHeir } from '@dynasty/contract';
import type { ContentBundle, Frame } from '../content/schema';
import { fromDynasty } from './import';
import { WEST_KNIGHTS } from './economy';
import type { HouseState } from './state';

export interface SetupStart {
  opening: string;
  frame: Frame;
  sovereign: string;
  name: string;
  sex: 'male' | 'female';
  seed: number;
}

/** What the answers have built so far; turned into an export at the end. */
interface Draft {
  background: string;
  attrs: Record<string, number>;
  skills: Record<string, number>;
  rep: Record<string, number>;
  renown: number;
  coin: number;
  men: number;
  flags: Set<string>;
  spouse?: DynastyExport['spouse'];
  heirs: DynastyHeir[];
  holdings: DynastyExport['lands']['holdings'];
  knights: number;
  war?: 'won' | 'held' | 'lost';
  debt?: number;
}

interface Ctx { start: SetupStart; content: ContentBundle; answers: Record<string, string> }

export interface SetupOption {
  id: string;
  label: (c: Ctx) => string;
  hint: string;
  when?: (c: Ctx) => boolean;
  apply: (d: Draft, c: Ctx) => void;
}

export interface SetupQuestion {
  id: string;
  question: string;
  /** shown only for these openings, or when this holds */
  openings?: string[];
  when?: (c: Ctx) => boolean;
  options: SetupOption[];
}

const child = (c: Ctx, son: string, daughter: string) => (c.start.sex === 'female' ? daughter : son);
const add = (r: Record<string, number>, k: string, n: number) => { r[k] = (r[k] ?? 0) + n; };
const married = (c: Ctx) => c.answers.marriage !== 'none';
const withMahaut = (c: Ctx) => c.answers.marriage === 'mahaut';

/** Given names, fixed by the seed: the same start always draws the same family. */
function pick(pool: string[], seed: number, salt: number, taken: Set<string>): string {
  const free = pool.filter((n) => !taken.has(n));
  const from = free.length ? free : pool;
  const n = from[Math.abs(Math.imul(seed ^ (salt * 2654435761), 1597334677)) % from.length]!;
  taken.add(n);
  return n;
}

export const SETUP: SetupQuestion[] = [
  {
    id: 'origin',
    question: 'Where did you begin?',
    options: [
      { id: 'reeve', label: (c) => `A reeve's ${child(c, 'son', 'daughter')}`, hint: 'Stewardship; the commons trust you', apply: (d) => { d.background = 'reeve'; add(d.skills, 'stewardship', 1); add(d.attrs, 'wits', 1); add(d.rep, 'commons', 3); } },
      { id: 'burgess', label: (c) => `A wool merchant's ${child(c, 'son', 'daughter')}`, hint: 'Trade and a fuller purse; the merchants trust you', apply: (d) => { d.background = 'burgess'; add(d.skills, 'trade', 2); add(d.rep, 'merchants', 3); d.coin *= 1.2; } },
      { id: 'archer', label: (c) => `An archer's ${child(c, 'son', 'daughter')}`, hint: 'The bow and the ranks; the soldiers know your name', apply: (d) => { d.background = 'archer'; add(d.skills, 'archery', 2); add(d.skills, 'arms', 1); add(d.rep, 'commons', 2); d.renown += 2; } },
      { id: 'servant', label: (c) => `A servant in a great house`, hint: 'Courtesy, and how the great talk when they think no one listens', apply: (d) => { d.background = 'servant'; add(d.skills, 'courtesy', 2); add(d.skills, 'intrigue', 1); add(d.rep, 'nobles', 1); } },
    ],
  },
  {
    id: 'rise',
    question: 'How did you rise?',
    options: [
      { id: 'sword', label: () => 'By the sword', hint: 'Arms and command; renown; the knights follow you', apply: (d) => { add(d.attrs, 'strength', 1); add(d.skills, 'arms', 1); add(d.skills, 'command', 1); add(d.skills, 'tactics', 1); d.renown += 6; add(d.rep, 'knights', 3); add(d.rep, 'honor', 3); } },
      { id: 'counsel', label: () => 'By counsel and the law', hint: 'Diplomacy and presence; the lords listen to you', apply: (d) => { add(d.attrs, 'presence', 1); add(d.skills, 'diplomacy', 1); add(d.skills, 'courtesy', 1); add(d.rep, 'nobles', 3); d.renown += 2; } },
      { id: 'purse', label: () => 'By the purse', hint: 'Trade and stewardship; money; the banks know you', apply: (d) => { add(d.attrs, 'wits', 1); add(d.skills, 'trade', 1); add(d.skills, 'stewardship', 1); add(d.rep, 'merchants', 2); add(d.rep, 'sarenza', 3); d.coin *= 1.5; } },
      { id: 'faith', label: () => 'By faith and good works', hint: 'Learning; the Church stands with you', apply: (d) => { add(d.skills, 'learning', 2); add(d.rep, 'church', 4); add(d.rep, 'piety', 5); d.renown += 2; } },
    ],
  },
  {
    id: 'wars',
    question: 'What did Mortefontaine, in 896, and the War of the West cost you?',
    options: [
      { id: 'victory', label: () => 'Victory: the company came home', hint: 'Renown; your men intact', apply: (d) => { d.flags.add('c4_mf_victory'); d.renown += 4; d.war = 'won'; } },
      { id: 'bloody', label: () => 'Victory, bought dear', hint: 'Renown, and a third of your men in the ground', apply: (d) => { d.flags.add('c4_mf_bloody'); d.renown += 2; d.men *= 0.7; d.war = 'held'; add(d.rep, 'ruthlessness', 2); } },
      { id: 'lost', label: () => 'Defeat: you got your men out', hint: 'Less renown and fewer men, but the ones left would follow you anywhere', apply: (d) => { d.flags.add('c4_mf_lost'); d.renown -= 2; d.men *= 0.6; d.war = 'held'; add(d.rep, 'knights', 2); } },
    ],
  },
  {
    id: 'marriage',
    question: 'Whom did you marry?',
    options: [
      { id: 'mahaut', label: () => 'Mahaut of Armance, before the Estates in 904', hint: 'The crowned path: the King and the Duchess, and their children the heirs of both', when: (c) => c.start.opening === 'crowned' && c.start.sex === 'male', apply: (d) => { d.flags.add('c5_married_mahaut'); d.spouse = { id: 'mahaut_armance', name: "Mahaut d'Armance", alive: true }; add(d.rep, 'nobles', 1); } },
      { id: 'keys', label: (c) => (c.start.sex === 'female' ? 'A husband who left the books to you' : 'A wife who took the keys and the books off you in a week'), hint: 'Living, and the household runs', apply: (d, c) => { if (c.start.sex === 'male') { d.flags.add('c3_married'); d.flags.add('c3_wife_keys'); } d.spouse = { id: 'spouse', name: '', alive: true }; } },
      { id: 'laughed', label: (c) => (c.start.sex === 'female' ? 'A husband who came for the land and stayed for you' : 'A wife who laughed at the manor, and stayed anyway'), hint: 'Living', apply: (d, c) => { if (c.start.sex === 'male') d.flags.add('c3_married'); d.spouse = { id: 'spouse', name: '', alive: true }; } },
      { id: 'childbed', label: (c) => (c.start.sex === 'female' ? 'A husband, dead these five years' : 'A wife who died in childbed'), hint: 'You are a widower; the children are all you have of her', apply: (d, c) => { if (c.start.sex === 'male') { d.flags.add('c3_married'); d.flags.add('c3_wife_died_childbed'); } d.spouse = { id: 'spouse', name: '', alive: false }; } },
    ],
  },
  {
    id: 'children',
    question: 'Your children, in 912?',
    options: [
      // with Mahaut: married at Whitsun 904, so her eldest is six at most (import.ts adds the younger ones by the odds)
      { id: 'mahaut_son', label: () => 'A son, about five', hint: "Mahaut's eldest; the odds give the rest", when: withMahaut, apply: (d) => { d.heirs = [{ name: '', sex: 'son', age: 5, alive: true, temperament: 'bold', bond: 1 }]; } },
      { id: 'mahaut_daughter', label: () => 'A daughter, Jehanne, six', hint: "Canon's Jehanne; the odds give the rest", when: withMahaut, apply: (d) => { d.heirs = []; } },
      { id: 'grown_son', label: () => 'A grown son, and younger children', hint: 'An heir of twenty-two, ready or not', when: (c) => !withMahaut(c), apply: (d) => { d.heirs = [{ name: '', sex: 'son', age: 22, alive: true, upbringing: 'arms', bond: 1 }, { name: '', sex: 'daughter', age: 17, alive: true, upbringing: 'court', bond: 2 }, { name: '', sex: 'son', age: 12, alive: true, upbringing: 'letters', bond: 1 }]; } },
      { id: 'grown_daughter', label: () => 'A grown daughter, and a younger son', hint: 'An heiress of twenty-one, where the law allows one', when: (c) => !withMahaut(c), apply: (d) => { d.heirs = [{ name: '', sex: 'daughter', age: 21, alive: true, upbringing: 'court', bond: 2 }, { name: '', sex: 'son', age: 15, alive: true, upbringing: 'page', bond: 1 }]; } },
      { id: 'young', label: () => 'A young family: the eldest about twelve', hint: 'A minority is likely if you die soon', when: (c) => !withMahaut(c), apply: (d) => { d.heirs = [{ name: '', sex: 'son', age: 12, alive: true, upbringing: 'page', bond: 2 }, { name: '', sex: 'daughter', age: 9, alive: true, bond: 2 }, { name: '', sex: 'son', age: 5, alive: true, bond: 1 }]; } },
      { id: 'one', label: () => 'One child: a son of sixteen', hint: 'Everything on one head', when: (c) => !withMahaut(c), apply: (d) => { d.heirs = [{ name: '', sex: 'son', age: 16, alive: true, upbringing: 'arms', bond: 2 }]; } },
    ],
  },
  {
    id: 'treasury',
    question: 'How full is the treasury?',
    options: [
      { id: 'comfortable', label: () => 'Comfortable', hint: 'What your rank should have', apply: () => {} },
      { id: 'rich', label: () => 'Rich: the war paid', hint: 'Two and a half times as much', apply: (d) => { d.coin *= 2.5; } },
      { id: 'stretched', label: () => 'Stretched', hint: 'Less than half', apply: (d) => { d.coin *= 0.4; } },
      { id: 'debt', label: () => 'In debt to the Lanzi bank', hint: "A tenth, and owing twice your rank's purse at ten in the hundred", apply: (d) => { d.debt = d.coin * 2; d.coin *= 0.1; d.flags.add('c4_war_debt'); add(d.rep, 'sarenza', -3); } },
    ],
  },
  {
    id: 'lands',
    question: 'Your lands and your men?',
    options: [
      { id: 'granted', label: () => 'As your rank was granted them', hint: 'The manor, your holdings, your knights and your company', apply: () => {} },
      { id: 'great', label: () => 'A great honour, and a great company', hint: 'More rents, four more knights, half as many men again', apply: (d) => { d.holdings.push({ id: 'hollin', name: 'Hollin and the chase', income: 2100, temper: 0 }, { id: 'market_charter', name: 'The market and fair', income: 1200, temper: 0 }); d.knights += 4; d.men *= 1.5; } },
      { id: 'lean', label: () => 'Lean: little beyond the manor', hint: 'Fewer rents, half the knights, fewer men to pay', apply: (d) => { d.holdings = d.holdings.filter((h) => h.id === 'crown_revenues'); d.knights = Math.floor(d.knights / 2); d.men *= 0.6; } },
    ],
  },
  // ---- the Founder of a House -----------------------------------------------------------------------------------
  {
    id: 'penhoet',
    question: 'Old Yann de Penhoët asked for a marriage between your houses. What did you say?',
    openings: ['founder', 'kingmaker'],
    when: (c) => c.answers.children !== 'one',
    options: [
      { id: 'refused', label: () => 'You put him off', hint: 'Penhoët still wants Kerval, and a bargain for it', apply: () => {} },
      { id: 'promised', label: () => 'You promised a child to his grandson Ronan', hint: 'The houses are bound; the second child pays for it', apply: (d) => { d.flags.add('c5_betrothed_penhoet'); } },
    ],
  },
  // ---- the Crowned opening ----------------------------------------------------------------------------------------
  {
    id: 'succession',
    question: 'What did you promise the Estates about the crown after you?',
    openings: ['crowned'],
    options: [
      { id: 'choose', label: () => 'That they would choose the next king', hint: 'An elective crown: the Estates will want their choice', apply: (d) => { d.flags.add('c5r_estates_choose'); } },
      { id: 'blood', label: () => 'Nothing: the crown goes by blood', hint: 'Your eldest child, and no one asked the Estates', apply: () => {} },
    ],
  },
  {
    id: 'querec',
    question: 'The lord of Quérec defied you in your first years. What did you do?',
    openings: ['crowned'],
    options: [
      { id: 'exiled', label: () => 'Sent him over the march into exile', hint: 'His son Bertrand wants the land back', apply: (d) => { d.flags.add('c5r_querec_exiled'); d.holdings.push({ id: 'querec', name: 'Quérec', income: 2400, temper: 0 }); } },
      { id: 'executed', label: () => 'Took his head', hint: 'His son Bertrand wants more than land', apply: (d) => { d.flags.add('c5r_querec_executed'); d.holdings.push({ id: 'querec', name: 'Quérec', income: 2400, temper: 0 }); add(d.rep, 'ruthlessness', 3); } },
      { id: 'pardoned', label: () => 'Pardoned him', hint: 'He kept his land, and his opinions', apply: (d) => { d.flags.add('c5r_querec_pardoned'); add(d.rep, 'honor', 1); } },
      { id: 'knelt', label: () => 'Made him kneel, in front of everyone', hint: 'He swore, and has been counting since', apply: (d) => { d.flags.add('c5r_querec_knelt'); } },
    ],
  },
  {
    id: 'peace',
    question: 'How did you make peace with Valdrenne?',
    openings: ['crowned'],
    options: [
      { id: 'bought', label: () => 'Bought it', hint: 'Coin out of the treasury, and Valdrenne cool but quiet', apply: (d) => { d.flags.add('c5r_peace_bought'); d.coin *= 0.8; } },
      { id: 'marriage', label: () => 'With a marriage promised', hint: 'A child of yours for a Valdrennish prince or princess', apply: (d) => { d.flags.add('c5r_peace_marriage'); add(d.rep, 'valdrenne', 2); } },
      { id: 'castle', label: () => 'With a castle given up', hint: 'Its people have long memories', apply: (d) => { d.flags.add('c5r_peace_castle'); } },
      { id: 'none', label: () => 'You never made one', hint: 'A truce of exhaustion, and Valdrenne watching the hills', apply: (d) => { d.flags.add('c5r_no_peace'); add(d.rep, 'valdrenne', -3); } },
    ],
  },
];

/** The questions for this start, in order, given the answers so far. */
export function questionsFor(content: ContentBundle, start: SetupStart, answers: Record<string, string>): SetupQuestion[] {
  const ctx: Ctx = { start, content, answers };
  return SETUP.filter((q) => (!q.openings || q.openings.includes(start.opening)) && (!q.when || q.when(ctx)))
    .map((q) => ({ ...q, options: q.options.filter((o) => !o.when || o.when(ctx)) }))
    .filter((q) => q.options.length > 0);
}

/** Each question's answer, or its first open option where there is none (or the answer no longer fits). */
export function settleAnswers(content: ContentBundle, start: SetupStart, answers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  // answers can open or close later questions: settle in order, twice over
  for (let pass = 0; pass < 2; pass++) {
    for (const q of questionsFor(content, start, { ...answers, ...out })) {
      const a = answers[q.id];
      out[q.id] = q.options.some((o) => o.id === a) ? a! : q.options[0]!.id;
    }
  }
  return out;
}

/** Labels, for the form. */
export const labelOf = (o: SetupOption, content: ContentBundle, start: SetupStart, answers: Record<string, string>) => o.label({ start, content, answers });

const SETTLEMENT: Record<string, DynastyExport['realm']['settlement']> = { self: 'kingdom', mahaut: 'kingdom', thibaut: 'kingdom', duchy: 'duchy' };

/** The life the answers describe, as Knight of Adalia would have exported it. */
export function buildExport(content: ContentBundle, start: SetupStart, raw: Record<string, string>): DynastyExport {
  const answers = settleAnswers(content, start, raw);
  const op = content.openings[start.opening]!;
  const f = op.founder;
  const d: Draft = {
    background: 'reeve', attrs: { ...f.attributes }, skills: { ...f.skills }, rep: {}, renown: f.renown, coin: f.coin, men: f.men,
    flags: new Set(), heirs: [], holdings: f.lands.holdings.map((h) => ({ ...h, temper: 0 })), knights: f.lands.knights,
  };
  const ctx: Ctx = { start, content, answers };
  for (const q of questionsFor(content, start, answers)) q.options.find((o) => o.id === answers[q.id])?.apply(d, ctx);

  // what the opening itself says happened
  const crowned = start.sovereign === 'self';
  if (start.frame === 'free') d.flags.add('c5_west_free');
  if (crowned) { d.flags.add('c5_reigns'); d.flags.add('c5_crowned_self'); }
  if (start.frame === 'adalian' && (start.opening === 'founder' || start.opening === 'kingmaker')) {
    d.flags.add('c5_earl');
    d.holdings.push({ id: 'earldom_march', name: 'The earldom of the March', income: 144000, temper: 0 });
    d.knights = Math.max(d.knights, 12);
  }
  if (f.lands.manor?.name === 'Kerval') d.flags.add('c2_granted_kerval');

  // names: the family's, fixed by the seed
  const taken = new Set([start.name.split(' ')[0]!]);
  const names = content.registry.names;
  const spouseCulture = 'valdrennish';
  if (d.spouse && d.spouse.id === 'spouse') {
    const pool = names[spouseCulture]![start.sex === 'male' ? 'female' : 'male'];
    d.spouse.name = `${pick(pool, start.seed, 1, taken)} ${pick(names[spouseCulture]!.families, start.seed, 2, new Set())}`;
  }
  d.heirs.forEach((h, i) => {
    if (h.name) return;
    const culture = i % 2 ? 'adalian' : 'valdrennish';
    h.name = pick(names[culture]![h.sex === 'son' ? 'male' : 'female'], start.seed, 10 + i, taken);
  });

  const knights = WEST_KNIGHTS.slice(0, d.knights).map(([id, name, seat]) => ({
    id, heir: false,
    // as Knight of Adalia names a knight: "Sir Josselin Salvert of the Salvert dyke" where his name does not say where he holds
    name: name.includes(seat.replace(/^(the|La|Le) /, '')) ? name : `${name} of ${seat}`,
  }));
  const r = (n: number) => Math.max(0, Math.round(n));
  const m = f.lands.manor;
  return {
    kind: 'knight-of-adalia/dynasty',
    version: 1,
    contentHash: 'setup',
    date: { year: content.config.start_year, season: 'spring', king: '', reignYear: crowned ? content.config.start_year - (content.registry.sovereigns.self?.reign_from ?? 45) + 1 : 0 },
    ending: { id: op.from_ending, label: op.label },
    founder: {
      name: start.name.trim() || 'Wat', background: d.background, age: f.age, station: f.station, renown: r(d.renown),
      attributes: Object.fromEntries(Object.entries(d.attrs).map(([k, v]) => [k, Math.min(6, Math.max(1, v))])),
      skills: Object.fromEntries(Object.entries(d.skills).map(([k, v]) => [k, Math.min(10, Math.max(0, v))])),
      traits: [], items: [],
      reputation: Object.fromEntries(Object.entries(d.rep).map(([k, v]) => [k, Math.min(10, Math.max(-10, v))])),
    },
    spouse: d.spouse,
    heirs: d.heirs,
    realm: {
      west: start.frame === 'free' ? 'free' : start.frame === 'adalian' ? 'adalian' : 'lost',
      settlement: start.frame === 'free' ? SETTLEMENT[start.sovereign] ?? 'kingdom' : start.frame,
      // a divided West's king is the player's choice, not the manor's (import.ts sovereignOf reads 'unsettled' as none)
      sovereign: start.frame === 'free' ? (start.sovereign as DynastyExport['realm']['sovereign']) : start.frame === 'adalian' ? 'adalia' : 'unsettled',
      war: d.war,
      reigns: crowned,
    },
    lands: {
      manor: m ? { ...m } : undefined,
      holdings: d.holdings,
      vassals: knights,
    },
    wealth: { coin: r(d.coin), men: r(d.men), garrison: 0, levy: 0 },
    // the oldest of the old company, who rode with you from the start ({house.companion})
    people: [{ id: 'old_companion', name: 'Piers atte Brook', alive: true, affection: 6, respect: 4, loyalty: 9, follower: true }],
    counters: d.debt ? { house_debt: r(d.debt) } : {},
    flags: [...d.flags].sort(),
  };
}

/** A new house from the answers: the same door as an imported life. */
export function newGameFromSetup(content: ContentBundle, start: SetupStart, answers: Record<string, string>): HouseState {
  return fromDynasty(content, buildExport(content, start, answers), { seed: start.seed, frame: start.frame, sovereign: start.sovereign, sex: start.sex });
}
