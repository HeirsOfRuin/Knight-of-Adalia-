// Phrase rules for any game: a phrase may appear in rendered text only while a condition holds
// ("the crown of the West" only in a free West). Rules come from the game (a continuity file,
// or generated from its registry); checkView applies them to one rendered view.
import { compileCond, evalCond, validateCond, type Cond } from '@engine/conditions';
import type { SceneView } from '@engine/index';
import type { CoreContent } from '@engine/schema';
import type { CoreState } from '@engine/state';

export interface PhraseRuleSrc { match: string; allow: string; why?: string; except?: string[] }
export interface PhraseRule { src: PhraseRuleSrc; re: RegExp; cond: Cond }
export interface PhraseHit { rule: string; scene: string; sentence: string }

export function compileRules(content: CoreContent, srcs: PhraseRuleSrc[]): { rules: PhraseRule[]; errors: string[] } {
  const rules: PhraseRule[] = [];
  const errors: string[] = [];
  for (const src of srcs) {
    const errs = validateCond(src.allow, content);
    if (errs.length) { errors.push(`rule "${src.match}": ${errs.join('; ')}`); continue; }
    rules.push({ src, re: new RegExp(src.match, 'i'), cond: compileCond(src.allow) });
  }
  return { rules, errors };
}

export const sentences = (t: string) => t.split(/(?<=[.!?]["”’]?)\s+|\n+/).map((s) => s.trim()).filter(Boolean);

export function checkView(content: CoreContent, s: CoreState, v: SceneView, rules: PhraseRule[]): PhraseHit[] {
  if (s.ended) return [];
  // the outcome text belongs to the scene where the choice was made
  const from = s.journal.at(-1)?.scene ?? s.scene;
  const texts: [string, string][] = [[s.scene, v.text], [from, v.outcome?.text ?? ''], [s.scene, v.title ?? ''], ...v.choices.map((c): [string, string] => [s.scene, c.text])];
  const hits: PhraseHit[] = [];
  for (const [scene, t] of texts) for (const sen of sentences(t)) {
    for (const r of rules) {
      if (r.src.except?.includes(scene)) continue;
      if (r.re.test(sen) && !evalCond(r.cond, s, content)) hits.push({ rule: `${r.src.match} (needs ${r.src.allow})`, scene, sentence: sen });
    }
  }
  return hits;
}
