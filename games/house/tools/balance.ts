// CLI: npm run house:balance -- [--runs N]. Step 4c's gate (PLAN.md §10): the house's money and standing, and the
// rival houses' temper, at the end of what is written, across every start and the bot's policies. Starts are built
// from the setup questions (setup.ts) with every treasury answer, plus the author's own save. Prints a table per
// start and fails if a gate in GATES is broken.
import { readFileSync } from 'node:fs';
import { decodeDynasty } from '@dynasty/contract';
import { formatCoin } from '@engine/format';
import { playOnce, POLICIES } from '@tools/play';
import { loadContent } from './content-loader';
import { startsOf } from '../src/game/index';
import { fromDynasty } from '../src/game/import';
import { newGameFromSetup } from '../src/game/setup';
import { yearBudget } from '../src/game/economy';
import { standingOf, standingWord } from '../src/game/houses';
import type { HouseState } from '../src/game/state';

const args = process.argv.slice(2);
const runs = Number(args[args.indexOf('--runs') + 1]) || 12;
const content = loadContent();

interface Sample { coin: number; start: number; net: number; income: number; standing: number; penhoet: number; kerguen: number; arrears: boolean; deserted: boolean; locked: number; offered: number; scenes: Set<string> }

function sample(label: string, make: (seed: number) => HouseState): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < runs; i++) {
    let last: HouseState | undefined;
    let first: HouseState | undefined;
    let locked = 0, offered = 0, deserted = false;
    const r = playOnce<HouseState>(content, label, make, 1 + i * 7919, POLICIES[i % POLICIES.length]!, {
      observe: (s, v) => {
        first ??= s; last = s;
        // a choice shut by money: its lock names coin
        for (const c of v.choices) { offered++; if (!c.available && /coin/i.test(c.lockReason ?? '')) locked++; }
        if (v.outcome?.changes.some((x) => /desert/.test(x))) deserted = true;
      },
    });
    if (r.outcome !== 'ending' || !last || !first) throw new Error(`${label}: ${r.outcome} ${r.detail ?? ''}`);
    const b = yearBudget(last);
    out.push({
      coin: last.res.coin ?? 0, start: first.res.coin ?? 0, net: b.net, income: b.rent + b.holdings + b.dues,
      standing: standingOf(last), penhoet: last.houses?.penhoet?.temper ?? 0, kerguen: last.houses?.kerguen?.standing ?? 0,
      arrears: !!last.counters.pay_arrears, deserted, locked, offered, scenes: new Set(r.scenes),
    });
  }
  return out;
}

const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const range = (xs: number[]) => `${Math.min(...xs)}..${Math.max(...xs)}`;
const pounds = (p: number) => (p < 0 ? `-${formatCoin(-p)}` : formatCoin(p)).replace(/ \d+s( \d+d)?$|( \d+d)$/, '');

const rows: { label: string; xs: Sample[] }[] = [];
for (const st of startsOf(content)) {
  for (const treasury of ['comfortable', 'debt']) {
    const label = `${st.opening}/${st.frame}/${st.sovereign} ${treasury}`;
    rows.push({ label, xs: sample(label, (seed) => newGameFromSetup(content, { ...st, name: 'Bot', sex: 'male', seed }, { treasury })) });
  }
}
{
  const d = await decodeDynasty(readFileSync(new URL('../tests/fixtures/author-crowned.koad', import.meta.url), 'utf8').trim());
  rows.push({ label: "the author's save", xs: sample("the author's save", (seed) => fromDynasty(content, d, { seed })) });
}

console.log(`${'start'.padEnd(44)} ${'coin start→end'.padEnd(20)} ${'in/yr'.padEnd(7)} ${'net/yr'.padEnd(8)} ${'standing'.padEnd(30)} ${'Penhoët'.padEnd(9)} ${'Kerguen'.padEnd(8)} locked  unpaid`);
for (const { label, xs } of rows) {
  const s = med(xs.map((x) => x.standing));
  console.log([
    label.padEnd(44),
    `${pounds(med(xs.map((x) => x.start)))}→${pounds(med(xs.map((x) => x.coin)))}`.padEnd(20),
    pounds(med(xs.map((x) => x.income))).padEnd(7),
    pounds(med(xs.map((x) => x.net))).padEnd(8),
    `${s} ${standingWord(s)}`.padEnd(30),
    range(xs.map((x) => x.penhoet)).padEnd(9),
    range(xs.map((x) => x.kerguen)).padEnd(8),
    `${Math.round((100 * xs.reduce((a, x) => a + x.locked, 0)) / Math.max(1, xs.reduce((a, x) => a + x.offered, 0)))}%`.padEnd(7),
    `${xs.filter((x) => x.arrears || x.deserted).length}/${xs.length}`,
  ].join(' '));
}

// coverage: the gated events fire somewhere
const seen = new Set(rows.flatMap((r) => r.xs.flatMap((x) => [...x.scenes])));
for (const id of ['h_b1p_penhoet_feud', 'h_b1p_c_charter', 'h_b1p_c_letter']) console.log(`${id}: ${seen.has(id) ? 'reached' : 'NOT REACHED'}`);

// gates (PLAN.md §4.3, §4.6): a written comfortable start is solvent and pays its men, and lands where its rank says
const GATES: [string, (label: string, xs: Sample[]) => string | undefined][] = [
  ['solvent', (l, xs) => (l.endsWith('comfortable') && xs.some((x) => x.net < 0) ? 'a comfortable start loses money every year' : undefined)],
  ['pays its men', (l, xs) => (l.endsWith('comfortable') && xs.some((x) => x.deserted) ? 'men desert from a comfortable start' : undefined)],
  ['great house income', (l, xs) => (/^(founder|kingmaker)\/free.* comfortable$/.test(l) && (med(xs.map((x) => x.income)) < 48000 || med(xs.map((x) => x.income)) > 192000) ? `a great house takes ${pounds(med(xs.map((x) => x.income)))} a year; PLAN.md §4.6 wants £200-£800` : undefined)],
  ['great house', (l, xs) => (/^(founder|kingmaker)\/.* comfortable$/.test(l) && med(xs.map((x) => x.standing)) < 40 ? 'a Founder or Kingmaker is not a great house (standing 40+)' : undefined)],
  ['penhoët moves', (l) => (l === rows[0]!.label && rows.every((r) => r.xs.every((x) => x.penhoet === 0)) ? "Penhoët's temper never moves" : undefined)],
];
let failed = 0;
for (const [name, gate] of GATES) {
  for (const { label, xs } of rows) {
    const msg = gate(label, xs);
    if (msg) { failed++; console.log(`GATE ${name}: ${label}: ${msg}`); }
  }
}
console.log(`\n${rows.length} starts, ${rows.length * runs} runs, ${failed} gate failures`);
process.exit(failed ? 1 : 0);
