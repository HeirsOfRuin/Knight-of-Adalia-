// A house from a Knight of Adalia life: reads the dynasty export (packages/dynasty) and starts
// the opening its ending names, in the frame its settlement left (FRAME.md §4, "Import").
import type { DynastyExport } from '@dynasty/contract';
import { bornAtAge } from '@engine/character';
import type { Character } from '@engine/state';
import type { RngCursor } from '@engine/rng';
import type { ContentBundle, Frame } from '../content/schema';
import { begin, checkStart, EngineError } from './index';
import { newId, person } from './family';
import { FOUNDER_ID, HOUSE_ID, type HouseState } from './state';

/** The frame a Knight of Adalia settlement leaves the West in. */
export function frameOf(d: DynastyExport): Frame | undefined {
  switch (d.realm.settlement) {
    case 'kingdom': case 'duchy': return 'free';
    case 'adalian': return 'adalian';
    case 'partitioned': return 'partitioned';
  }
  // an export from before `settlement` was written (Knight of Adalia's first release): read `west`
  if (!d.realm.settlement) return d.realm.west === 'free' ? 'free' : d.realm.west === 'adalian' ? 'adalian' : undefined;
  return undefined;
}

/** Who rules the West after it. A divided West: the king of the half the founder's manor lies in (Kerval is in the Armance; Ormel and Marsalin are on the Salt). */
export function sovereignOf(d: DynastyExport): string | undefined {
  switch (d.realm.sovereign) {
    case 'self': case 'mahaut': case 'thibaut': case 'duchy': return d.realm.sovereign;
    case 'adalia': return 'edwin';
    case 'divided': return d.lands.manor?.name === 'Ormel' || d.lands.manor?.name === 'Marsalin' ? 'edwin_salt' : 'amaury';
  }
  // an export from before `sovereign` was written: a man who reigns rules the West himself
  if (!d.realm.sovereign && (d.realm.reigns || d.flags.includes('c5_reigns'))) return 'self';
  return undefined;
}

export interface ImportOptions {
  seed: number;
  /** only for an export whose West was never settled */
  frame?: Frame;
  sovereign?: string;
}

export function fromDynasty(content: ContentBundle, d: DynastyExport, opts: ImportOptions): HouseState {
  if (d.kind !== 'knight-of-adalia/dynasty') throw new EngineError('not a Knight of Adalia dynasty export');
  const opening = Object.values(content.openings).find((o) => o.from_ending === d.ending.id);
  if (!opening) throw new EngineError(`no opening continues the ending "${d.ending.label}"`);
  const frame = frameOf(d) ?? opts.frame;
  if (!frame) throw new EngineError('the West was never settled in this life: choose a frame');
  const sovereign = checkStart(content, opening.id, frame, sovereignOf(d) ?? opts.sovereign);
  const startYear = content.config.start_year;
  const f = d.founder;
  const founder: Character = {
    name: f.name,
    sex: 'male',
    born: bornAtAge(f.age + Math.max(0, startYear - d.date.year)),
    alive: true,
    attributes: Object.fromEntries(content.config.attributes.map((a) => [a, f.attributes[a] ?? 2])),
    skills: Object.fromEntries(content.config.skills.map((s) => [s, f.skills[s] ?? 0])),
    health: 8,
    // only what this game knows; the rest stays in the inheritance
    traits: f.traits.filter((t) => t in content.registry.traits),
    items: f.items.filter((i) => i in content.registry.items),
    injuries: [],
    station: content.config.stations.includes(f.station) ? f.station : opening.founder.station,
  };
  const res = { coin: d.wealth.coin, supplies: 0, horses: 0, renown: f.renown, men: d.wealth.men, garrison: d.wealth.garrison, levy: d.wealth.levy };
  const gap = Math.max(0, startYear - d.date.year); // years between the end of the life and the start of the house
  const married42 = d.flags.includes('c5_married_mahaut') && d.spouse?.id === 'mahaut_armance';
  return begin(content, opts.seed, opening.id, frame, sovereign, founder, res, { inheritance: d }, (s, c, rng) => {
    // a crowned founder's reign is dated from the year the life dated it (Knight of Adalia's reign year at its end)
    if (sovereign === 'self' && d.realm.reigns && d.date.reignYear > 0) s.realm.from = d.date.year - d.date.reignYear + 1;
    // the wife and children the life left, as characters; ages carried forward to the house's first year
    let spouse: string | undefined;
    if (d.spouse) {
      spouse = newId(s);
      // Mahaut was fourteen in year 33 (canon), so thirty-one at the house's start
      const born = d.spouse.id === 'mahaut_armance' ? (19 - startYear) * 4 : founder.born + 4 * 8;
      const w = person(c, d.spouse.name, 'female', born, d.spouse.id, rng);
      w.spouse = FOUNDER_ID;
      if (!d.spouse.alive) { w.alive = false; w.died = 0; }
      s.characters[spouse] = w;
      founder.spouse = spouse;
    }
    for (const h of d.heirs) {
      const id = newId(s);
      const child = person(c, h.name, h.sex === 'son' ? 'male' : 'female', bornAtAge(h.age + gap), HOUSE_ID, rng);
      child.father = FOUNDER_ID;
      // married to Mahaut at Whitsun in year 42: a child born before that is a first marriage's (the export keeps no first wife)
      if (spouse && !(married42 && child.born < (43 - startYear) * 4)) child.mother = spouse;
      child.alive = h.alive;
      if (!h.alive) child.died = 0;
      if (h.temperament) child.temperament = h.temperament;
      if (h.upbringing) child.upbringing = h.upbringing;
      child.bond = h.bond;
      child.station = h.crowned ? 'royal' : founder.station;
      s.characters[id] = child;
    }
    if (married42 && spouse) mahautsChildren(s, c, spouse, founder.station, rng);
  });
}

/**
 * The founder married Mahaut before the Estates in year 42 (STORY.md, crowned path). The children the life left are
 * hers; if it left none, their daughter Jehanne is born in year 44 (canon). Then Mahaut's other children, drawn by
 * the odds for the years to 49 (the author's decision), a year apart at least, with Valdrennish names.
 */
function mahautsChildren(s: HouseState, c: ContentBundle, mahaut: string, station: string, rng: RngCursor): void {
  const start = c.config.start_year;
  const at = (year: number) => (year - start) * 4;
  const kids = Object.values(s.characters).filter((k) => k.mother === mahaut);
  const add = (name: string, sex: 'male' | 'female', born: number) => {
    const id = newId(s);
    const k = person(c, name, sex, born, HOUSE_ID, rng);
    Object.assign(k, { father: FOUNDER_ID, mother: mahaut, station, bond: 2 });
    s.characters[id] = k;
    return id;
  };
  // canon's Jehanne is Mahaut's only where the life left her no child of her own (the author's run left a son, Jehan)
  if (!kids.length) add('Jehanne', 'female', at(44));
  const fert = c.registry.life.fertility;
  for (let y = 45; y < start; y++) {
    if (Object.values(s.characters).some((k) => k.mother === mahaut && k.born >= at(y) - 4)) continue; // a year apart at least
    if (rng.float() * 100 >= fert.p) continue;
    const id = add('', rng.float() < 0.5 ? 'female' : 'male', at(y));
    const k = s.characters[id]!;
    // a name from the Valdrennish pool that no living sibling or parent already has
    const pool = c.registry.names.valdrennish![k.sex === 'male' ? 'male' : 'female'];
    const taken = new Set(Object.values(s.characters).map((x) => x.name.split(' ')[0]));
    const free = pool.filter((n) => !taken.has(n));
    k.name = (free.length ? free : pool)[rng.int((free.length ? free : pool).length)]!;
  }
}
