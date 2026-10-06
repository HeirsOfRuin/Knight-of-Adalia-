// CLI: npm run balance. Per policy and background: knighted, dead, and where the deaths happen.
import { loadContent } from './content-loader';
import { playOnce, DEFAULT_POLICIES } from './bot-lib';

const runs = Number(process.argv[2] ?? 300);
const c = loadContent();
const deathsAt: Record<string, number> = {};
for (const p of DEFAULT_POLICIES) {
  const row: string[] = [];
  for (const bg of Object.keys(c.backgrounds)) {
    let k = 0, d = 0;
    for (let i = 0; i < runs; i++) {
      const r = playOnce(c, bg, 1 + i * 7919, p);
      if (r.ending === 'death') {
        d++;
        const where = r.path[r.path.length - 1]!.split('/')[0]!;
        deathsAt[where] = (deathsAt[where] ?? 0) + 1;
      } else if (r.final?.['knighted by'] && r.final['knighted by'] !== 'ceremonial' && r.final['knighted by'] !== 'not knighted') k++;
    }
    row.push(`${bg} knight ${((100 * k) / runs).toFixed(0)}% dead ${((100 * d) / runs).toFixed(0)}%`);
  }
  console.log((p.kind === 'tags' ? p.prefer.join('+') : p.kind).padEnd(18), '|', row.join(' | '));
}
console.log('\ndeaths by scene:', Object.entries(deathsAt).sort((a, b) => b[1] - a[1]).map(([s, n]) => `${s} ${n}`).join(', '));
