// CLI: npm run house:bot -- [--runs N]. Plays every opening, frame and sovereign a house can start
// with (startsOf), N runs each across the policies, and fails on any run that does not reach an
// ending, or that enters a scene written for another frame.
import { loadContent } from './content-loader';
import { playOnce, POLICIES, type Run } from '@tools/play';
import { newGame, startsOf } from '../src/game/index';
import { frameRule } from './frames';
import type { HouseState } from '../src/game/state';

const args = process.argv.slice(2);
const runs = Number(args[args.indexOf('--runs') + 1]) || 20;
const content = loadContent();
const all: Run[] = [];
const starts = startsOf(content);
for (const st of starts) {
  const label = `${st.opening}/${st.frame}/${st.sovereign}`;
  for (let i = 0; i < runs; i++) {
    const policy = POLICIES[i % POLICIES.length]!;
    const r = playOnce<HouseState>(content, label, (seed) => newGame(content, { ...st, seed, name: 'Bot', sex: i % 2 ? 'female' : 'male' }), 1 + i * 7919, policy, { rule: (s) => frameRule(content, s) });
    all.push(r);
  }
}
const by = new Map<string, Run[]>();
for (const r of all) (by.get(r.start) ?? by.set(r.start, []).get(r.start)!).push(r);
for (const [start, rs] of by) {
  const endings = new Map<string, number>();
  for (const r of rs) endings.set(r.ending ?? r.outcome, (endings.get(r.ending ?? r.outcome) ?? 0) + 1);
  console.log(`${start.padEnd(32)} ${[...endings].map(([e, n]) => `${e} ${n}`).join(', ')}`);
}
const failures = all.filter((r) => r.outcome !== 'ending');
for (const f of failures.slice(0, 10)) console.log(`\n${f.outcome.toUpperCase()} ${f.start} seed ${f.seed} ${f.policy}: ${f.detail}\n  path: ${f.path.slice(-8).join(' -> ')}`);
const steps = all.reduce((s, r) => s + r.steps, 0);
console.log(`\n${starts.length} starts, ${all.length} runs, ${steps} total steps, ${failures.length} failures`);
process.exit(failures.length || all.some((r) => r.steps === 0) ? 1 : 0);
