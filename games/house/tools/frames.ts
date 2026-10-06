// Writing for three frames (FRAME.md §7). A frame-bound phrase (registry/frames.yaml, bound:)
// may appear only in text that can show in its own frame: a scene's text when the scene is
// written for that frame alone, its variant for that frame, or a branch guarded by
// realm.west == <frame>. checkFrames is the validator's static check; frameRules gives the
// continuity checker the same phrases as runtime rules.
import { parseText } from '@engine/text';
import type { Cond } from '@engine/conditions';
import type { PhraseRuleSrc } from '@tools/continuity';
import { FRAMES, type ContentBundle, type Frame, type Scene } from '../src/content/schema';

type FrameSet = Set<Frame>;
const ALL = (): FrameSet => new Set(FRAMES);

/** The frames a condition limits text to, or undefined when it says nothing about the frame. */
export function framesOf(c: Cond): FrameSet | undefined {
  switch (c.t) {
    case 'cmp':
      if (c.path !== 'realm.west' || typeof c.value !== 'string') return undefined;
      if (c.op === '==') return new Set([c.value as Frame]);
      if (c.op === '!=') return new Set(FRAMES.filter((f) => f !== c.value));
      return undefined;
    case 'truthy': return undefined;
    case 'not': { const x = framesOf(c.of); return x && new Set(FRAMES.filter((f) => !x.has(f))); }
    case 'all': {
      let out: FrameSet | undefined;
      for (const p of c.of) { const x = framesOf(p); if (x) out = new Set([...(out ?? ALL())].filter((f) => x.has(f))); }
      return out;
    }
    case 'any': {
      const xs = c.of.map(framesOf);
      return xs.every(Boolean) ? new Set(xs.flatMap((x) => [...x!])) : undefined;
    }
  }
}

interface TextNode { t: 'text'; s: string }
interface IfNode { t: 'if'; branches: { cond: Cond | null; body: Node[] }[] }
type Node = TextNode | IfNode | { t: 'var'; name: string };

/** Each run of plain text in a passage, with the frames it can show in. */
function textRuns(src: string, frames: FrameSet): { text: string; frames: FrameSet }[] {
  const out: { text: string; frames: FrameSet }[] = [];
  const walk = (nodes: Node[], fs: FrameSet) => {
    for (const n of nodes) {
      if (n.t === 'text') out.push({ text: n.s, frames: fs });
      else if (n.t === 'if') {
        let rest: FrameSet | undefined = new Set(fs); // frames no earlier branch has claimed, while every earlier branch spoke of the frame
        for (const b of n.branches) {
          const own: FrameSet | undefined = b.cond ? framesOf(b.cond) : rest;
          const here = new Set([...fs].filter((f) => (own ? own.has(f) : true) && (rest ? rest.has(f) : true)));
          walk(b.body, here);
          if (rest && own && b.cond) rest = new Set([...rest].filter((f) => !own.has(f)));
          else if (b.cond) rest = undefined;
        }
      }
    }
  };
  walk(parseText(src) as Node[], frames);
  return out;
}

export interface FrameIssue { where: string; message: string }

/** Every bound phrase in the scene's player-facing text that could show in a frame it is not true in. */
export function checkFrames(content: ContentBundle, s: Scene, where: string): FrameIssue[] {
  const bound = Object.entries(content.registry.frames).flatMap(([f, d]) => d.bound.map((phrase) => ({ phrase, frame: f as Frame, re: new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })));
  const written = new Set<Frame>(s.frames ?? FRAMES);
  const variants = Object.keys(s.variants ?? {}) as Frame[];
  const issues: FrameIssue[] = [];
  const scan = (label: string, src: string | undefined, frames: FrameSet) => {
    if (!src) return;
    for (const run of textRuns(src, frames)) for (const b of bound) {
      if (!b.re.test(run.text)) continue;
      const wrong = [...run.frames].filter((f) => f !== b.frame);
      if (wrong.length) issues.push({ where: `${where}${label}`, message: `"${b.phrase}" is only true in ${content.registry.frames[b.frame]!.label}, but this text can show in ${wrong.map((f) => content.registry.frames[f]!.label).join(' and ')}` });
    }
  };
  // the scene's own text shows in every frame it is written for that has no variant
  scan('', s.text, new Set([...written].filter((f) => !variants.includes(f))));
  for (const [k, t] of Object.entries(s.variants ?? {})) scan(` (variant ${k})`, t, new Set([k as Frame].filter((f) => written.has(f))));
  scan(' (title)', s.title, written);
  for (const c of s.choices) {
    for (const t of [c.text, c.text_after, c.label, c.warn]) scan(`/${c.id}`, t, written);
    for (const o of [c.success, c.partial, c.failure]) scan(`/${c.id}`, o?.text, written);
  }
  for (const v of variants) if (!written.has(v)) issues.push({ where, message: `variant for ${v}, but the scene is written only for ${[...written].join(', ')}` });
  return issues;
}

/** The bound phrases as continuity rules: each allowed only while the West stands in its frame. */
export function frameRules(content: ContentBundle): PhraseRuleSrc[] {
  return Object.entries(content.registry.frames).flatMap(([f, d]) => d.bound.map((phrase) => ({
    match: phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    allow: `realm.west == ${f}`,
    why: `frame-bound phrase (registry/frames.yaml)`,
  })));
}

/** The runtime half of `frames:`: a scene written for some frames must not be entered in another. */
export function frameRule(content: ContentBundle, state: { scene: string; realm: { west: Frame } }): string | undefined {
  const s = content.scenes[state.scene];
  if (s?.frames && !s.frames.includes(state.realm.west)) return `scene written for ${s.frames.join(', ')} entered in a ${state.realm.west} West`;
  return undefined;
}

