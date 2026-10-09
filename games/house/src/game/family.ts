// The family (PLAN.md §4.1-4.2): who is kin to whom, who inherits under the house's law, the
// regent for a head under age, the odds of each year, births, matches, the news they make, and
// the handover from one head to the next.
import type { CoreState, Character } from '@engine/state';
import type { RngCursor } from '@engine/rng';
import type { CoreContent } from '@engine/schema';
import { ageOfCharacter, heroOf } from '@engine/character';
import { test } from '@engine/conditions';
import { renderText } from '@engine/text';
import { regnalYear } from '@engine/calendar';
import type { ContentBundle, HouseLaw } from '../content/schema';
import { FOUNDER_ID, HOUSE_ID, type HouseState, type News } from './state';

export const st = (s: CoreState) => s as HouseState;
export const ct = (c: CoreContent) => c as ContentBundle;

/** The words content uses to name a character: head.age, {heir.He}, spouse.alive. */
export const SELECTORS = ['head', 'heir', 'spouse', 'father', 'mother', 'eldest', 'second', 'third', 'youngest', 'bastard', 'regent', 'will', 'news', 'founder', 'dowager', 'sibling', 'sibling_spouse'] as const;

/** The first succession scene in the queue jumps every other event: the house cannot hear news without a head. */
export const SUCCESSION_DUE = Number.MIN_SAFE_INTEGER;
export const SUCCESSION_SCENE = 'h_q_succession';
export const NEWS_SCENE = 'h_q_news';

const age = (s: HouseState, c: Character) => ageOfCharacter(s, c);
const living = (c: Character | undefined): c is Character => !!c && c.alive;

/** Children of a character, eldest first (ties by id, so the order never depends on the table's). */
export function childrenOf(s: HouseState, id: string): [string, Character][] {
  return Object.entries(s.characters)
    .filter(([, c]) => c.father === id || c.mother === id)
    .sort(([ia, a], [ib, b]) => a.born - b.born || (ia < ib ? -1 : 1));
}

/** Living legitimate children of the head: eldest, second, third, youngest. */
export function livingChildren(s: HouseState, id = s.hero): string[] {
  return childrenOf(s, id).filter(([, c]) => c.alive && c.legitimate !== false).map(([cid]) => cid);
}

/** Is this character in the line of succession at all: legitimate (or legitimated). */
const inLine = (c: Character) => c.legitimate !== false;

/**
 * The heir of `fromId` under the law: the first living candidate in the line's order. Each
 * person's line is their children's lines in order; male_line passes only through men,
 * male_preference puts sons before daughters at each step, partible names the eldest son as
 * head like male_preference (the younger sons' shares are the lands', PLAN.md §4.6). Failing
 * the dead's own line, it goes up: the father's other lines, then the grandfather's.
 */
export function heirOf(s: HouseState, law: HouseLaw, fromId: string): string | undefined {
  const order = (id: string): string[] => {
    const kids = childrenOf(s, id).filter(([, c]) => inLine(c) && (law !== 'male_line' || c.sex === 'male'));
    const sorted = law === 'male_line' || law === 'eldest' ? kids : [...kids.filter(([, c]) => c.sex === 'male'), ...kids.filter(([, c]) => c.sex !== 'male')];
    return sorted.flatMap(([cid]) => [cid, ...order(cid)]);
  };
  let from: string | undefined = fromId;
  const tried = new Set<string>();
  while (from) {
    tried.add(from);
    const pick = order(from).find((cid) => !tried.has(cid) && living(s.characters[cid]) && !s.characters[cid]!.retired);
    if (pick) return pick;
    const up: Character | undefined = s.characters[from];
    // the line goes up through the parent who was of the house: the father, or under male_preference
    // and partible the mother (an heiress's children climb to her siblings and cousins, not her husband's)
    const parents: (string | undefined)[] = law === 'male_line' ? [up?.father] : [up?.father, up?.mother];
    from = parents.find((p: string | undefined): p is string => !!p && !tried.has(p) && s.characters[p]?.house === HOUSE_ID);
  }
  return undefined;
}

/** Who governs for an heir under age: the mother if she lives, else the eldest adult man of the house. */
export function regentFor(s: HouseState, content: ContentBundle, heirId: string): string | undefined {
  const heir = s.characters[heirId]!;
  const mother = heir.mother ? s.characters[heir.mother] : undefined;
  if (living(mother)) return heir.mother;
  const adults = Object.entries(s.characters)
    .filter(([id, c]) => id !== heirId && living(c) && c.house === HOUSE_ID && c.sex === 'male' && age(s, c) >= content.registry.life.majority)
    .sort(([, a], [, b]) => a.born - b.born);
  return adults[0]?.[0];
}

export function select(s: HouseState, content: ContentBundle, sel: string): string | undefined {
  const head = s.characters[s.hero];
  switch (sel) {
    case 'head': return s.hero;
    case 'heir': return heirOf(s, s.family.law, s.hero);
    case 'spouse': return head?.spouse;
    case 'father': return head?.father;
    case 'mother': return head?.mother;
    case 'eldest': return livingChildren(s)[0];
    case 'second': return livingChildren(s)[1];
    case 'third': return livingChildren(s)[2];
    case 'youngest': return livingChildren(s).at(-1);
    // the head's eldest living child not (yet) legitimate
    case 'bastard': return childrenOf(s, s.hero).find(([, c]) => c.alive && c.legitimate === false)?.[0];
    case 'regent': return s.family.regent;
    case 'will': return s.family.will;
    case 'news': return s.family.current?.who;
    // the founder of the house, living or dead, and the founder's spouse
    case 'founder': return s.characters[FOUNDER_ID] ? FOUNDER_ID : undefined;
    case 'dowager': return s.characters[FOUNDER_ID]?.spouse;
    // the sibling's husband or wife (Ronan de Penhoët, where the second child married him)
    case 'sibling_spouse': { const sib = select(s, content, 'sibling'); return sib ? s.characters[sib]?.spouse : undefined; }
    // the founder's eldest living child who does not keep the house: not the founder's heir while the founder is head, not the head after
    case 'sibling': {
      const keeper = s.hero === FOUNDER_ID ? heirOf(s, s.family.law, FOUNDER_ID) : s.hero;
      return livingChildren(s, FOUNDER_ID).find((id) => id !== keeper);
    }
  }
  return undefined;
}

// ---- new people ----------------------------------------------------------------------------

export function newId(s: HouseState): string {
  return `c${s.family.next++}`;
}

function pick<T>(xs: readonly T[], rng?: RngCursor): T {
  return xs[rng ? rng.int(xs.length) : 0]!;
}

const TEMPERAMENTS = ['bold', 'bookish', 'merry', 'grave'] as const;

/** A person with plain stats, for births and generated spouses. */
export function person(content: ContentBundle, name: string, sex: Character['sex'], born: number, house: string, rng?: RngCursor): Character {
  return {
    name, sex, born, alive: true,
    attributes: Object.fromEntries(content.config.attributes.map((a) => [a, 2])),
    skills: Object.fromEntries(content.config.skills.map((k) => [k, 0])),
    health: 8, traits: [], injuries: [], items: [], station: content.config.stations[0]!,
    house, temperament: pick(TEMPERAMENTS, rng), bond: 0,
  };
}

/** A child of a couple, unnamed until a name_child. */
export function bear(s: HouseState, content: ContentBundle, motherId: string, fatherId: string, sex: Character['sex'] | undefined, rng?: RngCursor): string {
  const id = newId(s);
  const child = person(content, '', sex ?? (rng && rng.float() < 0.5 ? 'female' : 'male'), s.time, HOUSE_ID, rng);
  child.mother = motherId;
  child.father = fatherId;
  child.station = s.characters[s.hero]!.station;
  s.characters[id] = child;
  return id;
}

/** A spouse from a culture's names, married to who. A daughter of the house who marries leaves it for her husband's. */
export function marry(s: HouseState, content: ContentBundle, whoId: string, culture: string, to: string | undefined, rng?: RngCursor): string {
  const who = s.characters[whoId]!;
  const names = content.registry.names[culture] ?? content.registry.names.adalian!;
  const sex = who.sex === 'male' ? 'female' : 'male';
  const family = to ?? (names.families.length ? pick(names.families, rng) : 'outside');
  const id = newId(s);
  const spouse = person(content, `${pick(sex === 'male' ? names.male : names.female, rng)}${names.families.length ? ` ${family}` : ''}`, sex, who.born + (sex === 'female' ? 4 * (rng ? rng.int(5) : 2) : -4 * (rng ? rng.int(6) : 3)), family, rng);
  spouse.spouse = whoId;
  who.spouse = id;
  s.characters[id] = spouse;
  if (who.sex === 'female' && whoId !== s.hero && who.house === HOUSE_ID) who.house = family;
  return id;
}

/** Names a child: after a grandparent of the same sex, after the parent of the same sex, or from the house's culture. */
export function nameChild(s: HouseState, content: ContentBundle, id: string, style: 'grandparent' | 'parent' | 'culture', rng?: RngCursor): void {
  const c = s.characters[id];
  if (!c || c.name) return;
  const parent = s.characters[(c.sex === 'male' ? c.father : c.mother) ?? ''];
  const grand = parent ? s.characters[(c.sex === 'male' ? parent.father : parent.mother) ?? ''] : undefined;
  const first = (x?: Character) => x?.name.split(' ')[0];
  const names = content.registry.names.adalian!;
  // a living brother or sister's name is not given again (a dead child's may be: houses did)
  const taken = new Set(Object.entries(s.characters).filter(([k, x]) => k !== id && x.alive && ((c.father && x.father === c.father) || (c.mother && x.mother === c.mother))).map(([, x]) => first(x)));
  const wanted = style === 'grandparent' ? first(grand) : style === 'parent' ? first(parent) : undefined;
  const pool = (c.sex === 'male' ? names.male : names.female).filter((n) => !taken.has(n));
  c.name = (wanted && !taken.has(wanted) ? wanted : undefined) ?? pick(pool.length ? pool : c.sex === 'male' ? names.male : names.female, rng);
}

// ---- news and the succession -----------------------------------------------------------------

export function tell(s: HouseState, news: News): void {
  s.family.news.push(news);
  s.queue.push({ event: NEWS_SCENE, dueAt: s.time, origin: { scene: s.scene, choice: '(the year)', at: s.time, text: news.cause ?? '' } });
}

/** The head is dead or has stepped down: queue the succession ahead of everything else. */
export function queueSuccession(s: HouseState, cause: string): void {
  if (s.queue.some((q) => q.event === SUCCESSION_SCENE)) return;
  s.queue.push({ event: SUCCESSION_SCENE, dueAt: SUCCESSION_DUE, origin: { scene: s.scene, choice: '(the succession)', at: s.time, text: cause } });
}

export function die(s: HouseState, id: string, cause: string): void {
  const c = s.characters[id];
  if (!c || !c.alive) return;
  c.alive = false;
  c.died = s.time;
  if (id === s.hero) queueSuccession(s, cause);
  if (s.family.will === id) s.family.will = undefined;
  if (s.family.regent === id) s.family.regent = undefined;
}

/** The handover: the old head's chronicle paragraph, the journal condensed, and play passes to the heir. */
export function succeed(s: HouseState, content: ContentBundle, heirId: string | undefined, changes: string[]): void {
  const old = s.characters[s.hero]!;
  const lines = content.registry.chronicle.filter((l) => test(l.if, s, content)).map((l) => renderText(l.text, s, content));
  s.chronicle.push({ who: s.hero, name: old.name, from: content.config.start_year + Math.floor(s.family.since / 4), to: regnalYear(s, content), lines });
  // the journal of the old head keeps what was chosen and when; the rest goes into the chronicle
  s.journal = s.journal.map((e) => ({ at: e.at, scene: e.scene, sceneTitle: e.sceneTitle, choice: e.choice, changes: [] }));
  if (!heirId || !living(s.characters[heirId])) {
    s.family.extinct = true;
    changes.push('The house has no heir');
    return;
  }
  const heir = s.characters[heirId]!;
  heir.station = old.station;
  heir.house = HOUSE_ID;
  s.hero = heirId;
  s.family.generation += 1;
  s.family.since = s.time;
  s.family.will = undefined;
  s.family.regent = age(s, heir) < content.registry.life.majority ? regentFor(s, content, heirId) : undefined;
  // a crown the house wears passes with the headship, and its years count again from the new reign
  if (s.realm.sovereign === 'self') s.realm.from = regnalYear(s, content);
  changes.push(`${heir.name} is head of the house`);
}

// ---- the year ---------------------------------------------------------------------------------

/** The house's members and the spouses married into it: the people the odds of the year apply to. */
function household(s: HouseState): [string, Character][] {
  return Object.entries(s.characters).filter(([, c]) => c.alive && (c.house === HOUSE_ID || (c.spouse !== undefined && s.characters[c.spouse]?.house === HOUSE_ID)));
}

/** Michaelmas: deaths, births, matches and majorities, each told as news. Draws only with a cursor. */
/** Who the odds may not kill: in the prologue, the founder, the founder's spouse, the head and the founder's heir (STORY.md, L3-6). */
export function heldFromOdds(s: HouseState): Set<string> {
  const founder = s.characters[FOUNDER_ID];
  const held = new Set<string>();
  // a crowned founder married to Mahaut reigns nineteen years (Knight of Adalia's ending): the old king lives to his
  // scripted death in about year 64, and Mahaut to hers in about year 73 (canon)
  if (s.inheritance?.flags.includes('c5_married_mahaut') && s.opening === 'crowned') {
    if (s.time < 14 * 4) held.add(FOUNDER_ID);
    if (founder?.spouse && s.time < 23 * 4) held.add(founder.spouse);
  }
  if (s.chapter !== 'prologue') return held;
  for (const id of [FOUNDER_ID, founder?.spouse, s.hero, s.hero === FOUNDER_ID ? heirOf(s, s.family.law, FOUNDER_ID) : undefined]) if (id) held.add(id);
  return held;
}

export function yearTick(s: HouseState, content: ContentBundle, rng: RngCursor): void {
  const life = content.registry.life;
  const plague = !!s.flags.plague;
  const children = plague && !!s.flags.plague_children;
  const held = heldFromOdds(s);
  for (const [id, c] of household(s)) {
    const a = age(s, c);
    const band = life.mortality.find((m) => a <= m.to) ?? life.mortality.at(-1)!;
    // the house's answer to the Mottle (STORY.md D1) moves its own odds: the hills safest, the open hall worst
    const answer = s.flags.h_mottle_fled ? 0.6 : s.flags.h_mottle_shut ? 0.8 : s.flags.h_mottle_stayed ? 1.3 : 1;
    const mult = plague ? (children && a < 15 ? life.plague.children : life.plague.all) * answer : 1;
    // always draw, so holding someone does not shift later rolls
    if (rng.float() * 100 < band.p * mult && !held.has(id)) {
      die(s, id, plague ? 'the Mottle' : a < 5 ? 'a fever' : a >= 60 ? 'old age' : 'an illness');
      if (id !== s.hero) tell(s, { kind: 'death', who: id, cause: plague ? 'the Mottle' : undefined, at: s.time });
    }
  }
  // births: a living couple where the husband is of the house, or the wife is its head
  for (const [id, wife] of Object.entries(s.characters)) {
    if (!wife.alive || wife.sex !== 'female' || !wife.spouse) continue;
    const husband = s.characters[wife.spouse];
    if (!living(husband) || (husband.house !== HOUSE_ID && id !== s.hero)) continue;
    // a man who has given up the rule (the cloister, or an illness that ended it) fathers no more children
    if (husband.retired) continue;
    const a = age(s, wife);
    if (a < life.fertility.from || a > life.fertility.to) continue;
    if (rng.float() * 100 >= (a >= life.fertility.late_from ? life.fertility.late_p : life.fertility.p)) continue;
    const child = bear(s, content, id, wife.spouse, undefined, rng);
    const lost = rng.float() * 100 < life.childbed && !held.has(id);
    if (lost) die(s, id, 'childbed');
    tell(s, { kind: 'birth', who: child, childbed: lost, at: s.time });
  }
  // matches due and majorities reached; in the prologue the matches are the story's own (STORY.md, P6)
  for (const [id, c] of Object.entries(s.characters)) {
    if (!c.alive || c.house !== HOUSE_ID) continue;
    const a = age(s, c);
    // while the prologue and Book I are played, the founder's children marry by the story (STORY.md, P6, B3, B8);
    // the odds offer matches from the next generation on, and to everyone in the empty-years harness
    const storyMatch = s.chapter === 'book1' && (id === FOUNDER_ID || c.father === FOUNDER_ID || c.mother === FOUNDER_ID);
    if (s.chapter !== 'prologue' && !storyMatch && !c.spouse && a >= life.match_age && c.legitimate !== false && s.time - (s.family.offered[id] ?? -999) >= 12) {
      s.family.offered[id] = s.time;
      tell(s, { kind: 'match', who: id, at: s.time });
    }
    if (id === s.hero && s.family.regent && a === life.majority) {
      s.family.regent = undefined;
      tell(s, { kind: 'majority', who: id, at: s.time });
    }
  }
}

/** The head's age, for the module's own paths. */
export function headAge(s: HouseState): number {
  return age(s, heroOf(s));
}

/**
 * A child's qualities from temperament and upbringing, grown with age (Knight of Adalia exports no children's stats).
 * Bold: strength and arms; bookish: wits and learning; merry: presence and courtesy; grave: wits and stewardship.
 * The upbringing adds its training once the child is old enough to have had it (eight).
 */
export function shapeChild(s: HouseState, k: Character): void {
  const age = Math.floor((s.time - k.born) / 4);
  const up = (path: 'attributes' | 'skills', key: string, n: number) => { if (key in k[path]) k[path][key] = (k[path][key] ?? 0) + n; };
  const T: Record<string, [string, string]> = { bold: ['strength', 'arms'], bookish: ['wits', 'learning'], merry: ['presence', 'courtesy'], grave: ['wits', 'stewardship'] };
  const t = T[k.temperament ?? ''];
  if (t) { up('attributes', t[0], 1); if (age >= 8) up('skills', t[1], 1); }
  const U: Record<string, [string, number][]> = {
    page: [['courtesy', 1], ['riding', 1]], church: [['learning', 2]], arms: [['arms', 2], ['riding', 1]],
    letters: [['learning', 1], ['stewardship', 1]], court: [['courtesy', 1], ['diplomacy', 1]], home: [['riding', 1]],
  };
  if (age >= 8) for (const [sk, n] of U[k.upbringing ?? ''] ?? []) up('skills', sk, age >= 14 ? n + 1 : n);
}
