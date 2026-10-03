import { loadContent } from './tools/content-loader';
import { playOnce, DEFAULT_POLICIES } from './tools/bot-lib';
const c = loadContent();
let pay = 0, des = 0, n = 0; const ch: Record<string, number> = {}; const lost: number[] = [];
for (const bg of Object.keys(c.backgrounds)) for (const p of DEFAULT_POLICIES) for (let i = 0; i < 40; i++) {
  const hit = new Set<string>(); let paid = false; let lostMen = 0; let prev: any;
  playOnce(c, bg, 1 + i * 7919, p, 2000, (s) => {
    const o = s.lastOutcome; if (!o || o === prev) return; prev = o;
    for (const x of o.changes) { if (/Michaelmas pay/.test(x)) paid = true; const m = /(\d+) men unpaid two years running desert/.exec(x); if (m) { hit.add(s.scene); lostMen += +m[1]!; } }
  });
  n++; if (paid) pay++; if (hit.size) { des++; lost.push(lostMen); for (const k of hit) ch[k] = (ch[k] ?? 0) + 1; }
}
lost.sort((a,b)=>a-b);
console.log({ n, pay, des, ch, lostMedian: lost[Math.floor(lost.length/2)] });
