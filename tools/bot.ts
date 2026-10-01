// CLI: npm run bot -- [--runs N] [--seed S] [--background id] [--verbose]
// Plays N runs per background per policy and reports endings, dead ends,
// softlocks and coverage. Exits non-zero on any failure or if no run made progress.
import { loadContent } from './content-loader';
import { playOnce, summarise, DEFAULT_POLICIES, loadPlans, playPlan, type RunResult } from './bot-lib';
import { validate } from './validate-lib';

const args = process.argv.slice(2);
const arg = (name: string, dflt: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : dflt;
};
const runsPer = Number(arg('runs', '100'));
const baseSeed = Number(arg('seed', '1'));
const only = arg('background', '');
const verbose = args.includes('--verbose');

const content = loadContent();
const runs: RunResult[] = [];
const bgs = Object.keys(content.backgrounds).filter((b) => !only || b === only);
for (const bg of bgs) {
  for (const policy of DEFAULT_POLICIES) {
    const n = Math.max(1, Math.round(runsPer / DEFAULT_POLICIES.length));
    for (let i = 0; i < n; i++) runs.push(playOnce(content, bg, baseSeed + i * 7919, policy));
  }
}
const report = summarise(content, runs, validate(content).reachableBy);

const pct = (n: number, d: number) => `${((100 * n) / d).toFixed(0)}%`;
for (const [bg, r] of Object.entries(report.byBackground)) {
  console.log(`\n== ${bg} (${r.runs} runs, avg ${r.avgSteps.toFixed(1)} steps, coverage ${pct(r.coverage * 100, 100)})`);
  for (const [e, n] of Object.entries(r.endings).sort((a, b) => b[1] - a[1])) console.log(`   ending ${e.padEnd(16)} ${String(n).padStart(5)}  ${pct(n, r.runs)}`);
  for (const [f, n] of Object.entries(r.failures)) console.log(`   FAIL   ${f.padEnd(16)} ${String(n).padStart(5)}`);
  if (r.unvisited.length) console.log(`   unvisited: ${r.unvisited.join(', ')}`);
  for (const [k, hist] of Object.entries(r.finals)) {
    const total = Object.values(hist).reduce((a, b) => a + b, 0);
    console.log(`   ${k.padEnd(18)} ${Object.entries(hist).sort((a, b) => b[1] - a[1]).map(([v, n]) => `${v} ${pct(n, total)}`).join(', ')}`);
  }
}

const failures = runs.filter((r) => r.outcome !== 'ending');
const seenDetails = new Set<string>();
for (const f of failures) {
  if (seenDetails.has(f.detail ?? '') && !verbose) continue;
  seenDetails.add(f.detail ?? '');
  console.log(`\n${f.outcome.toUpperCase()} ${f.background} seed ${f.seed} ${f.policy}: ${f.detail}\n  path: ${f.path.slice(-8).join(' -> ')}`);
}

// Scripted plans: fixed routes that must keep working as content changes.
console.log('\nScripted plans:');
let planFailures = 0;
for (const plan of loadPlans()) {
  const r = playPlan(content, plan);
  if (!r.ok) planFailures++;
  console.log(`  [${r.ok ? 'PASS' : 'FAIL'}] ${plan.name} (${plan.background}, ${r.path.length} choices)${r.ok ? '' : `: ${r.problems.join(' | ')}`}`);
  if (!r.ok && verbose) console.log(`      ${r.path.join(' > ')}`);
}

// Progress assertion: a harness that never advanced proved nothing.
const progressed = runs.filter((r) => r.steps > 0).length;
const totalSteps = runs.reduce((s, r) => s + r.steps, 0);
console.log(`\n${runs.length} runs, ${totalSteps} total steps, ${progressed} runs advanced, ${failures.length} failures`);
if (progressed !== runs.length) console.log('ERROR: some runs made no progress');
process.exit(failures.length || planFailures || progressed !== runs.length ? 1 : 0);
