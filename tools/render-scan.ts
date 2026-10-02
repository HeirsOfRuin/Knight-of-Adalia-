// Renders every scene a few hundred bot runs pass through and flags text glitches:
// stray braces or [if] tags, "undefined", doubled words, lower-case sentence starts.
// Hits are leads, not failures: ellipses and the word "none" in prose are fine.
import { loadContent } from './content-loader';
import { playOnce, DEFAULT_POLICIES } from './bot-lib';
import { view } from '../src/engine/index';
const c = loadContent();
const bad: Record<string, Set<string>> = {};
const pats: [string, RegExp][] = [['brace', /[{}]/], ['tag', /\[(if|elif|else|\/if)/], ['undefined', /undefined|NaN|\bnull\b/], ['at', /@[a-z]/], ['doublespace', /\S  \S/], ['space-punct', / [,.;:!?](\s|$)/], ['empty-quote', /""/], ['dup-word', /\b(\w+) \1\b/i], ['lower-after-stop', /[.!?] [a-z]/], ['start-lower', /^[a-z]/], ['stop-stop', /[.!?,][.,]/]];
let n = 0;
for (const p of DEFAULT_POLICIES) for (const bg of Object.keys(c.backgrounds)) for (let i = 0; i < 15; i++) {
  playOnce(c, bg, 11 + i * 104729, p, 3000, (s) => {
    if (s.ended) return;
    let v; try { v = view(c, s); } catch (e) { (bad['view-error'] ??= new Set()).add(`${s.scene}: ${(e as Error).message}`); return; }
    n++;
    const texts = [['text', v.text], ['title', v.title ?? ''], ['outcome', v.outcome?.text ?? ''], ...v.choices.map((ch: any) => ['choice', ch.text])];
    for (const [k, t] of texts) for (const [name, re] of pats) { const m = (t as string).match(re); if (m) (bad[name] ??= new Set()).add(`${s.scene} ${k}: …${(t as string).slice(Math.max(0, m.index! - 50), m.index! + 50).replace(/\n/g, ' ')}…`); }
  });
}
console.log('views scanned', n);
for (const [k, set] of Object.entries(bad)) { console.log(`== ${k} (${set.size})`); [...set].slice(0, 12).forEach((x) => console.log('  ' + x)); }
