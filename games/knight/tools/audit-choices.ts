// Audits what each choice actually does, so choices that look meaningful but are
// not can be found. For every outcome of every choice it classifies the effects:
//   now     changes something the player can see (stats, standing, coin, people, men)
//   later   sets a flag or counter that a later condition, check or switch reads
//   flavour sets a flag that only later text reads
//   none    does nothing at all
// A choice is "hollow" when none of its outcomes is better than flavour.
// Usage: npm run audit [-- --chapter ch2] [-- --list]
import { loadContent } from './content-loader';
import type { Choice, Effect, Outcome } from '../src/content/schema';

const content = loadContent();
const args = process.argv.slice(2);
const only = args.includes('--chapter') ? args[args.indexOf('--chapter') + 1] : undefined;
const list = args.includes('--list');

const TEXT_KEYS = new Set(['text', 'text_after', 'title', 'label', 'warn', 'description', 'journal', 'die']);

/** Collect path references (flag.x, counter.x) from non-text fields and from text fields separately. */
function collect(node: unknown, inText: boolean, mech: Set<string>, text: Set<string>): void {
  if (typeof node === 'string') {
    for (const m of node.matchAll(/\b(flag|counter)\.([a-z0-9_]+)/g)) (inText ? text : mech).add(`${m[1]}.${m[2]}`);
    return;
  }
  if (Array.isArray(node)) { node.forEach((n) => collect(n, inText, mech, text)); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      // effect writes (set/clear/add keys) are not reads
      if (k === 'set' || k === 'clear') continue;
      if (k === 'add' && v && typeof v === 'object') continue;
      collect(v, inText || TEXT_KEYS.has(k), mech, text);
    }
  }
}
const mechReads = new Set<string>();
const textReads = new Set<string>();
for (const s of Object.values(content.scenes)) collect(s, false, mechReads, textReads);

type Kind = 'now' | 'later' | 'flavour' | 'none';
const RANK: Record<Kind, number> = { none: 0, flavour: 1, later: 2, now: 3 };

function classify(effects: Effect[]): Kind {
  let best: Kind = 'none';
  const up = (k: Kind) => { if (RANK[k] > RANK[best]) best = k; };
  const walk = (es: Effect[]) => {
    for (const e of es) {
      if ('if' in e || 'chance' in e) { walk(e.then); walk(e.else ?? []); continue; }
      if ('set' in e) {
        const f = e.set;
        up(mechReads.has(f) ? 'later' : textReads.has(f) ? 'flavour' : 'none');
      } else if ('add' in e) {
        for (const p of Object.keys(e.add)) {
          if (p.startsWith('counter.')) up(mechReads.has(p) ? 'later' : 'none');
          else up('now');
        }
      } else if ('clear' in e || 'journal' in e) {
        // no lasting change by itself
      } else up('now'); // items, injuries, station, join, kill, coin via other ops, etc.
    }
  };
  walk(effects);
  return best;
}

function outcomes(c: Choice): [string, Outcome | { effects: Effect[] }][] {
  if (!c.check) return [['direct', { effects: c.effects }]];
  const out: [string, Outcome | { effects: Effect[] }][] = [];
  for (const k of ['success', 'partial', 'failure'] as const) if (c[k]) out.push([k, { effects: [...c.effects, ...(c[k]!.effects ?? [])] }]);
  return out;
}

const byChapter: Record<string, Record<Kind | 'total', number>> = {};
const hollow: string[] = [];
for (const s of Object.values(content.scenes)) {
  if (only && s.chapter !== only) continue;
  // a choice that leads somewhere its siblings do not is a branch: it matters even with no effects
  const nexts = s.choices.map((c) => JSON.stringify(c.next ?? null));
  const common = nexts.sort((a, b) => nexts.filter((x) => x === b).length - nexts.filter((x) => x === a).length)[0];
  for (const c of s.choices) {
    const kinds = outcomes(c).map(([label, o]) => [label, classify(o.effects)] as const);
    let best = kinds.reduce<Kind>((b, [, k]) => (RANK[k] > RANK[b] ? k : b), 'none');
    const branches = JSON.stringify(c.next ?? null) !== common || (['success', 'partial', 'failure'] as const).some((k) => c[k]?.next && JSON.stringify(c[k]!.next) !== JSON.stringify(c.next ?? null));
    if (branches && RANK[best] < RANK.later) best = 'later';
    // a "Go on." bridge is not a choice
    if (s.choices.length === 1) continue;
    const t = (byChapter[s.chapter] ??= { now: 0, later: 0, flavour: 0, none: 0, total: 0 });
    t[best]++; t.total++;
    if (RANK[best] <= 1) hollow.push(`${s.chapter.padEnd(8)} ${s.id}/${c.id}: ${best} [${kinds.map(([l, k]) => `${l}=${k}`).join(' ')}] "${c.text.slice(0, 70)}"`);
  }
}
console.log('chapter   choices  now  later  flavour  none');
for (const [ch, t] of Object.entries(byChapter)) console.log(`${ch.padEnd(9)} ${String(t.total).padStart(7)} ${String(t.now).padStart(4)} ${String(t.later).padStart(6)} ${String(t.flavour).padStart(8)} ${String(t.none).padStart(5)}`);
console.log(`\nhollow choices (nothing better than flavour): ${hollow.length}`);
if (list) hollow.forEach((h) => console.log('  ' + h));
