// CLI: npm run house:life -- [--runs N]. Seventy-five empty years for every start (life-lib.ts),
// and what the family's odds did: extinction, generations, family size, heiresses, regencies.
import { lifeContent, lifeRuns } from './life-lib';

const args = process.argv.slice(2);
const runs = Number(args[args.indexOf('--runs') + 1]) || 20;
const rs = lifeRuns(lifeContent(), runs);
const n = rs.length;
const pct = (k: number) => `${((100 * k) / n).toFixed(0)}%`;
const avg = (f: (r: (typeof rs)[number]) => number) => (rs.reduce((a, r) => a + f(r), 0) / n).toFixed(1);
const failures = rs.filter((r) => r.run.outcome !== 'ending');
const extinct = rs.filter((r) => r.extinct);
const byDecade = new Map<number, number>();
for (const r of extinct) byDecade.set(Math.floor(r.endYear! / 10) * 10, (byDecade.get(Math.floor(r.endYear! / 10) * 10) ?? 0) + 1);
console.log(`${n} runs over 75 years`);
console.log(`  extinct            ${pct(extinct.length)}  (by year ${[...byDecade].sort((a, b) => a[0] - b[0]).map(([d, k]) => `${d}s ${k}`).join(', ') || 'none'})`);
console.log(`  extinct before 102 ${pct(extinct.filter((r) => r.endYear! < 102).length)}  (target 15-25%, PLAN.md §7)`);
console.log(`  heads per run      ${avg((r) => r.generations)}`);
console.log(`  living members     max ${Math.max(...rs.map((r) => r.maxMembers))}, average peak ${avg((r) => r.maxMembers)}`);
const successions = rs.reduce((a, r) => a + r.generations - 1, 0);
console.log(`  heiresses          ${((100 * rs.reduce((a, r) => a + r.heiresses, 0)) / Math.max(1, successions)).toFixed(0)}% of successions went to a woman (${pct(rs.filter((r) => r.heiresses > 0).length)} of runs had one)`);
console.log(`  regencies          ${pct(rs.filter((r) => r.regencies > 0).length)} of runs had a minor succeed`);
console.log(`  contested          ${pct(rs.filter((r) => r.contested > 0).length)} of runs held to a will against the law`);
console.log(`  characters         average ${avg((r) => r.characters)}, save ${avg((r) => r.saveBytes / 1024)} KB average, ${(Math.max(...rs.map((r) => r.saveBytes)) / 1024).toFixed(0)} KB largest`);
for (const f of failures.slice(0, 8)) console.log(`\n${f.run.outcome.toUpperCase()} ${f.run.start} seed ${f.run.seed}: ${f.run.detail}\n  path: ${f.run.path.slice(-6).join(' -> ')}`);
console.log(`\n${failures.length} failures`);
process.exit(failures.length ? 1 : 0);
