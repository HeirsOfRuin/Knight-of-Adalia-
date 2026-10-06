// CLI: npm run transcript -- [plan-file-substring] [--out dir]
// Renders scripted plans as readable Markdown transcripts for review.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent } from './content-loader';
import { loadPlans, planStep, unplannedChoice, type Plan } from './bot-lib';
import { newGame, view, choose } from '../src/game/index';
import type { CheckResult } from '@engine/checks';
import type { ContentBundle } from '../src/content/schema';

export function transcript(content: ContentBundle, plan: Plan): string {
  let state = newGame(content, { background: plan.background, seed: plan.seed, name: 'Hal', role: plan.role });
  const out: string[] = [`# ${plan.name}`, '', `Background: ${content.backgrounds[plan.background]!.label}. Seed ${plan.seed}.`, ''];
  const visits: Record<string, number> = {};
  for (let i = 0; i < 500 && !state.ended; i++) {
    const v = view(content, state);
    out.push(`## ${v.title ?? v.sceneId}`, '');
    if (v.dateChanged) out.push(`*${v.date}*`, '');
    if (v.cause) out.push(`> Consequence of: ${v.cause.text}`, '');
    out.push(v.text.replace(/\n\s*\[break\]\s*\n/g, '\n\n*(Continue)*\n\n'), '');
    for (const c of v.choices) {
      const meta = [c.band, c.lethal ? 'MORTAL DANGER' : '', c.lockReason ?? ''].filter(Boolean).join(', ');
      out.push(`- ${c.available ? '' : '~~'}${c.text}${c.available ? '' : '~~'}${meta ? ` *(${meta})*` : ''}${c.stakes.length ? `  \n  <small>At stake: ${c.stakes.join(' · ')}</small>` : ''}`);
    }
    const avail = v.choices.filter((c) => c.available);
    const step = planStep(plan, state.scene, visits);
    const [id, force] = step ? step.split('!') : [unplannedChoice(state.scene, avail)];
    const chosen = v.choices.find((c) => c.id === id)!;
    state = choose(content, state, id!, { force: force as CheckResult | undefined }).state;
    const o = state.lastOutcome!;
    out.push('', `**Chose:** ${chosen.text}${o.check ? ` (${o.check.band}: ${o.check.result})` : ''}`, '');
    if (o.text) out.push(o.text, '');
    if (o.changes.length) out.push(`*${o.changes.join(' · ')}*`, '');
  }
  const end = view(content, state);
  out.push(`## ${end.title ?? end.sceneId}`, '', end.text, '');
  if (state.ended?.cause) out.push(`*${state.ended.cause}*`, '');
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const outDir = outIdx >= 0 ? args[outIdx + 1]! : join(import.meta.dirname, '..', 'docs', 'playthroughs');
  const filter = args.find((a, i) => !a.startsWith('--') && i !== outIdx + 1) ?? '';
  const content = loadContent();
  mkdirSync(outDir, { recursive: true });
  for (const plan of loadPlans().filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))) {
    const file = join(outDir, `${plan.name.toLowerCase().replace(/[^a-z]+/g, '-')}.md`);
    writeFileSync(file, transcript(content, plan));
    console.log(`wrote ${file}`);
  }
}
