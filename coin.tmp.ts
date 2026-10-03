import { loadContent } from './tools/content-loader';
import { playOnce, DEFAULT_POLICIES } from './tools/bot-lib';
const c = loadContent();
const marks = ['c2_following', 'c2_lannec_winter', 'c2_garrison_life', 'c3_arrival', 'c3_end', 'c4_council', 'c4_home', 'c4_stewards', 'c4_master', 'c4_end', 'c5_war_muster', 'c5_reckoning'];
const at: Record<string, number[]> = {};
const men: Record<string, number[]> = {};
const des: Record<string, number> = {}; let total = 0;
for (const bg of Object.keys(c.backgrounds)) for (const p of DEFAULT_POLICIES) for (let i = 0; i < 40; i++) {
  const seen = new Set<string>(); let last: any;
  playOnce(c, bg, 1 + i * 7919, p, 2000, (s) => { last = s;
    if (marks.includes(s.scene) && !seen.has(s.scene)) { seen.add(s.scene); (at[s.scene] ??= []).push((s.res.coin ?? 0) / 240); (men[s.scene] ??= []).push((s.res.men ?? 0) + (s.res.garrison ?? 0)); }
  });
  const chs = new Set(last.journal.filter((e: any) => e.changes.some((x: string) => /desert/.test(x))).map((e: any) => c.scenes[e.scene]?.chapter));
  for (const ch of chs) des[ch as string] = (des[ch as string] ?? 0) + 1; total++;
}
const q = (xs: number[], f: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(f * (s.length - 1))]!.toFixed(1); };
for (const m of marks) if (at[m]) console.log(m.padEnd(18), 'n', String(at[m].length).padStart(4), ' £ p10', q(at[m], .1), 'p50', q(at[m], .5), 'p90', q(at[m], .9), '  men p50', q(men[m]!, .5), 'p90', q(men[m]!, .9));

console.log('runs with desertion by chapter', Object.entries(des).map(([k,v])=>k+' '+(100*v/total).toFixed(0)+'%').join(', '));
