// Seventy-five empty years for every start: what the odds of the family do with no story
// (PLAN.md §10, step 4a). The content plus tests/fixtures/life.yaml, every opening starting there.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { playOnce, POLICIES, type Run } from '@tools/play';
import { SceneSchema, type ContentBundle } from '../src/content/schema';
import { newGame, startsOf } from '../src/game/index';
import { HOUSE_ID, type HouseState } from '../src/game/state';
import { loadContent } from './content-loader';
import { frameRule } from './frames';

export function lifeContent(): ContentBundle {
  const c = structuredClone(loadContent());
  for (const raw of YAML.parse(readFileSync(join(import.meta.dirname, '..', 'tests', 'fixtures', 'life.yaml'), 'utf8'))) {
    const s = SceneSchema.parse(raw);
    c.scenes[s.id] = s;
    c.sources[s.id] = 'tests/fixtures/life.yaml';
  }
  for (const o of Object.values(c.openings)) o.start_scene = 't_years';
  return c;
}

export interface LifeRun {
  run: Run;
  extinct: boolean;
  /** the year the house ended, if it did */
  endYear?: number;
  generations: number;
  maxMembers: number;
  /** heads after the founder who were women */
  heiresses: number;
  regencies: number;
  contested: number;
  characters: number;
  saveBytes: number;
}

export function lifeRuns(c: ContentBundle, runsPerStart: number): LifeRun[] {
  const out: LifeRun[] = [];
  for (const st of startsOf(c)) {
    for (let i = 0; i < runsPerStart; i++) {
      let maxMembers = 0;
      let regencies = 0;
      let lastHead = '';
      let last: HouseState | undefined;
      const run = playOnce<HouseState>(c, `${st.opening}/${st.frame}/${st.sovereign}`, (seed) => newGame(c, { ...st, seed, name: 'Bot', sex: i % 2 ? 'female' : 'male' }), 11 + i * 7919, POLICIES[i % POLICIES.length]!, {
        maxSteps: 4000,
        rule: (s) => frameRule(c, s),
        observe: (s) => {
          last = s;
          maxMembers = Math.max(maxMembers, Object.values(s.characters).filter((x) => x.alive && x.house === HOUSE_ID).length);
          if (s.hero !== lastHead) { if (lastHead && s.family.regent) regencies++; lastHead = s.hero; }
        },
      });
      const s = last!;
      out.push({
        run,
        extinct: run.ending === 'extinct',
        endYear: run.ending === 'extinct' ? c.config.start_year + Math.floor(s.time / 4) : undefined,
        generations: s.family.generation,
        maxMembers,
        heiresses: [...s.chronicle.slice(1).map((e) => e.who), ...(s.chronicle.length ? [s.hero] : [])].filter((id) => s.characters[id]?.sex === 'female').length,
        regencies,
        contested: s.counters.contested ?? 0,
        characters: Object.keys(s.characters).length,
        saveBytes: JSON.stringify(s).length,
      });
    }
  }
  return out;
}
