// CLI: npm run house:continuity [-- --strict]. Plays every start, renders every view, and fails on
// a frame-bound phrase shown while the West stands in another frame (FRAME.md §7).
import { loadContent } from './content-loader';
import { playOnce, POLICIES } from '@tools/play';
import { compileRules, checkView, type PhraseHit } from '@tools/continuity';
import { newGame, startsOf } from '../src/game/index';
import { frameRules } from './frames';
import type { HouseState } from '../src/game/state';

export function runContinuity(runs = 8): { hits: (PhraseHit & { start: string })[]; errors: string[]; views: number } {
  const content = loadContent();
  const { rules, errors } = compileRules(content, frameRules(content));
  const hits: (PhraseHit & { start: string })[] = [];
  let views = 0;
  for (const st of startsOf(content)) {
    const label = `${st.opening}/${st.frame}/${st.sovereign}`;
    for (let i = 0; i < runs; i++) {
      playOnce<HouseState>(content, label, (seed) => newGame(content, { ...st, seed, name: 'Bot', sex: i % 2 ? 'female' : 'male' }), 3 + i * 7919, POLICIES[i % POLICIES.length]!, {
        observe: (s, v) => { views++; for (const h of checkView(content, s, v, rules)) hits.push({ ...h, start: label }); },
      });
    }
  }
  return { hits, errors, views };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const strict = process.argv.includes('--strict');
  const { hits, errors, views } = runContinuity();
  for (const e of errors) console.log(`ERROR ${e}`);
  const seen = new Set<string>();
  for (const h of hits) {
    const k = `${h.rule} @ ${h.scene}`;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`${k}  (e.g. ${h.start})\n    ${h.sentence.slice(0, 220)}`);
  }
  console.log(`\ncontinuity: ${views} views, ${seen.size} distinct problems, ${errors.length} rule errors`);
  if (strict && (seen.size || errors.length)) process.exit(1);
}
