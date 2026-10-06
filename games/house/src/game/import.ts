// A house from a Knight of Adalia life: reads the dynasty export (packages/dynasty) and starts
// the opening its ending names, in the frame its settlement left (FRAME.md §4, "Import").
import type { DynastyExport } from '@dynasty/contract';
import { bornAtAge } from '@engine/character';
import type { Character } from '@engine/state';
import type { ContentBundle, Frame } from '../content/schema';
import { begin, checkStart, EngineError } from './index';
import type { HouseState } from './state';

/** The frame a Knight of Adalia settlement leaves the West in. */
export function frameOf(d: DynastyExport): Frame | undefined {
  switch (d.realm.settlement) {
    case 'kingdom': case 'duchy': return 'free';
    case 'adalian': return 'adalian';
    case 'partitioned': return 'partitioned';
  }
  return undefined;
}

/** Who rules the West after it. A divided West: the king of the half the founder's manor lies in (Kerval is in the Armance; Ormel and Marsalin are on the Salt). */
export function sovereignOf(d: DynastyExport): string | undefined {
  switch (d.realm.sovereign) {
    case 'self': case 'mahaut': case 'thibaut': case 'duchy': return d.realm.sovereign;
    case 'adalia': return 'edwin';
    case 'divided': return d.lands.manor?.name === 'Ormel' || d.lands.manor?.name === 'Marsalin' ? 'edwin_salt' : 'amaury';
  }
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
  return begin(content, opts.seed, opening.id, frame, sovereign, founder, res, { inheritance: d });
}
