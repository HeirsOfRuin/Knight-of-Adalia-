// Headless play for any game on the engine: a random or tag-seeking player, with progress
// assertions (a run that stops moving is a softlock, not a pass). Each game's bot supplies
// its starts and any check of its own on each state.
import { RngCursor, seedRng } from '@engine/rng';
import { view, choose, type SceneView } from '@engine/index';
import type { CoreContent } from '@engine/schema';
import type { CoreState } from '@engine/state';

export type Policy = { kind: 'random' } | { kind: 'tags'; prefer: string[] };
export const POLICIES: Policy[] = [
  { kind: 'random' },
  { kind: 'tags', prefer: ['martial'] },
  { kind: 'tags', prefer: ['diplomacy'] },
  { kind: 'tags', prefer: ['cunning'] },
];
export const policyName = (p: Policy) => (p.kind === 'tags' ? `tags:${p.prefer.join('+')}` : p.kind);

export interface Run {
  start: string;
  seed: number;
  policy: string;
  outcome: 'ending' | 'dead_end' | 'softlock' | 'error' | 'max_steps' | 'rule';
  ending?: string;
  detail?: string;
  steps: number;
  scenes: string[];
  path: string[];
}

const SOFTLOCK_STEPS = 60;

export interface PlayOptions<S extends CoreState> {
  maxSteps?: number;
  /** each state before a choice, with its view (continuity checks read both) */
  observe?: (state: S, v: SceneView) => void;
  /** a game rule a state must keep; a message fails the run */
  rule?: (state: S, content: CoreContent) => string | undefined;
}

export function playOnce<S extends CoreState>(content: CoreContent, start: string, make: (seed: number) => S, seed: number, policy: Policy, opts: PlayOptions<S> = {}): Run {
  const pick = new RngCursor(seedRng(seed ^ 0x5bd1e995));
  const res: Run = { start, seed, policy: policyName(policy), outcome: 'max_steps', steps: 0, scenes: [], path: [] };
  let state: S;
  try {
    state = make(seed);
  } catch (e) {
    return { ...res, outcome: 'error', detail: (e as Error).message };
  }
  const visited = new Set<string>([state.scene]);
  let lastProgress = 0;
  let lastKey = `${state.chapter}|${state.time}`;
  for (let step = 0; step < (opts.maxSteps ?? 2000); step++) {
    const broken = opts.rule?.(state, content);
    if (broken) { res.outcome = 'rule'; res.detail = `${state.scene}: ${broken}`; break; }
    const v = view(content, state);
    opts.observe?.(state, v);
    if (v.ended) { res.outcome = 'ending'; res.ending = v.ended.ending; res.detail = v.ended.cause; break; }
    const avail = v.choices.filter((c) => c.available);
    if (!avail.length) { res.outcome = 'dead_end'; res.detail = `no available choice in ${state.scene}`; break; }
    let choice = avail[pick.int(avail.length)]!;
    if (policy.kind === 'tags') {
      const preferred = avail.filter((c) => c.tags.some((t) => policy.prefer.includes(t)));
      const notYield = avail.filter((c) => !c.tags.includes('yield'));
      const pool = preferred.length ? preferred : notYield.length ? notYield : avail;
      choice = pool[pick.int(pool.length)]!;
    }
    res.path.push(`${state.scene}/${choice.id}`);
    try {
      state = choose(content, state, choice.id).state;
    } catch (e) {
      res.outcome = 'error';
      res.detail = `${state.scene}/${choice.id}: ${(e as Error).message}`;
      break;
    }
    res.steps = step + 1;
    const key = `${state.chapter}|${state.time}`;
    const isNew = !visited.has(state.scene);
    visited.add(state.scene);
    if (key !== lastKey || isNew) { lastProgress = res.steps; lastKey = key; }
    if (res.steps - lastProgress > SOFTLOCK_STEPS) {
      res.outcome = 'softlock';
      res.detail = `no new scene, chapter or season for ${SOFTLOCK_STEPS} steps around ${state.scene}`;
      break;
    }
  }
  res.scenes = [...visited];
  return res;
}
