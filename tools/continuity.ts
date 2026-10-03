// Continuity check: plays a few hundred seeded runs, renders every view, and
// flags text that contradicts the state of the run showing it.
//  1. Rules in content/continuity.yaml: a phrase allowed only when a condition holds.
//  2. Dead names: a named NPC appearing after his death, outside a sentence
//     about his death or memory.
// Usage: npm run continuity [-- --runs N] [--strict]   (--strict exits 1 on any hit)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { loadContent, CONTENT_DIR } from './content-loader';
import { playOnce, DEFAULT_POLICIES, loadPlans, playPlan } from './bot-lib';
import { view } from '../src/engine/index';
import { compileCond, evalCond, validateCond, type Cond } from '../src/engine/conditions';
import type { GameState } from '../src/engine/state';
import type { ContentBundle } from '../src/content/schema';

interface RuleSrc { match: string; allow: string; chapters?: string[]; except?: string[]; why?: string }
interface Rule { src: RuleSrc; re: RegExp; cond: Cond }
export interface Hit { kind: string; scene: string; sentence: string; background: string; seed: number }

const MEMORIAL = /\b(dead|died|dies|die|death|dying|grave|graves|buried|bury|burial|remember|remembers|remembered|memory|ghost|late|killed|kill|mourn|mourned|pray|prayers?|mass|soul|tomb|widow|widowed|was|were|had|used to|named|name|after him|after her|lost|gone|missing|fell|fallen|body|bones|corpse|hanged)\b|\bfor your (father|mother|old master)\b/i;

export function loadRules(content: ContentBundle, dir = CONTENT_DIR): { rules: Rule[]; deadOk: Record<string, string[]>; errors: string[] } {
  const raw = YAML.parse(readFileSync(join(dir, 'continuity.yaml'), 'utf8')) as { rules: RuleSrc[]; dead_names_ok?: Record<string, string[]> };
  const errors: string[] = [];
  const rules: Rule[] = [];
  for (const src of raw.rules ?? []) {
    const errs = validateCond(src.allow, content);
    if (errs.length) { errors.push(`rule "${src.match}": ${errs.join('; ')}`); continue; }
    rules.push({ src, re: new RegExp(src.match), cond: compileCond(src.allow) });
  }
  return { rules, deadOk: raw.dead_names_ok ?? {}, errors };
}

/**
 * Name patterns for each NPC: the full name, the titled first name ("Sir Hamon"),
 * and the bare first name when no other NPC shares it. A bare first name that one
 * of his children carries is left out for that run: "Hamon is five" is the son.
 */
interface NamePat { id: string; strict: RegExp; bare?: RegExp; first: string }
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function namePatterns(content: ContentBundle): NamePat[] {
  const npcs = Object.entries(content.registry.npcs) as [string, { name: string; title?: string }][];
  const firsts: Record<string, number> = {};
  for (const [, n] of npcs) { const f = n.name.split(' ')[0]!; firsts[f] = (firsts[f] ?? 0) + 1; }
  return npcs.map(([id, n]) => {
    const f = n.name.split(' ')[0]!;
    const strict = [...(n.name.includes(' ') ? [n.name] : []), ...(n.title ? [`${n.title} ${f}`] : [])];
    const bare = f !== n.name && firsts[f] === 1 && f.length >= 4 ? new RegExp(`\\b${esc(f)}\\b`) : n.name === f && firsts[f] === 1 ? new RegExp(`\\b${esc(f)}\\b`) : undefined;
    return { id, strict: strict.length ? new RegExp(`\\b(${strict.map(esc).join('|')})\\b`) : /(?!)/, bare, first: f };
  });
}

const sentences = (t: string) => t.split(/(?<=[.!?]["”’]?)\s+|\n+/).map((s) => s.trim()).filter(Boolean);

export function checkState(content: ContentBundle, s: GameState, rules: Rule[], names: NamePat[], deadOk: Record<string, string[]>): { kind: string; sentence: string }[] {
  if (s.ended) return [];
  const v = view(content, s);
  const texts = [v.text, v.outcome?.text ?? '', ...v.choices.map((c) => c.text)];
  const out: { kind: string; sentence: string }[] = [];
  const heirNames = new Set((s.heirs ?? []).map((h) => h.name).filter(Boolean));
  for (const t of texts) for (const sen of sentences(t)) {
    for (const r of rules) {
      if (r.src.chapters && !r.src.chapters.includes(s.chapter)) continue;
      if (r.src.except?.includes(s.scene)) continue;
      if (r.re.test(sen) && !evalCond(r.cond, s, content)) out.push({ kind: `rule: ${r.src.match} (needs ${r.src.allow})`, sentence: sen });
    }
    for (const n of names) {
      const npc = s.npcs[n.id];
      if (!npc || npc.alive) continue;
      if (deadOk[s.scene]?.includes(n.id) || deadOk[s.scene]?.includes('*')) continue;
      const named = n.strict.test(sen) || (!!n.bare && !heirNames.has(n.first) && n.bare.test(sen));
      if (named && !MEMORIAL.test(sen)) out.push({ kind: `dead: ${n.id}`, sentence: sen });
    }
  }
  return out;
}

export function runContinuity(content: ContentBundle, runsPerBackground = 30): { hits: Hit[]; errors: string[]; views: number } {
  const { rules, deadOk, errors } = loadRules(content);
  const names = namePatterns(content);
  const hits: Hit[] = [];
  let views = 0;
  const observe = (bg: string, seed: number) => (s: GameState) => {
    views++;
    for (const h of checkState(content, s, rules, names, deadOk)) hits.push({ ...h, scene: s.scene, background: bg, seed });
  };
  for (const bg of Object.keys(content.backgrounds)) {
    for (let i = 0; i < runsPerBackground; i++) {
      const p = DEFAULT_POLICIES[i % DEFAULT_POLICIES.length]!;
      const seed = 7 + i * 7919;
      playOnce(content, bg, seed, p, 3000, observe(bg, seed));
    }
  }
  for (const plan of loadPlans()) playPlan(content, plan, 500, observe(plan.background, plan.seed ?? 0));
  return { hits, errors, views };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const runs = Number(args[args.indexOf('--runs') + 1]) || 30;
  const strict = args.includes('--strict');
  const content = loadContent();
  const { hits, errors, views } = runContinuity(content, runs);
  for (const e of errors) console.log(`ERROR ${e}`);
  const grouped = new Map<string, Hit[]>();
  for (const h of hits) { const k = `${h.kind} @ ${h.scene}`; (grouped.get(k) ?? grouped.set(k, []).get(k)!).push(h); }
  for (const [k, hs] of [...grouped].sort()) {
    const h = hs[0]!;
    console.log(`${k}  (${hs.length}x; e.g. ${h.background} seed ${h.seed})\n    ${h.sentence.slice(0, 220)}`);
  }
  console.log(`\ncontinuity: ${views} views, ${grouped.size} distinct problems, ${errors.length} rule errors`);
  if (strict && (grouped.size || errors.length)) process.exit(1);
}
