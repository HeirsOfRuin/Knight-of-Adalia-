// Playthrough bot. Plays the engine headless with a policy and reports how
// each run ended. It asserts progress: a run that never advances is a failure,
// not a pass.
import type { ContentBundle } from '../src/content/schema';
import { newGame, view, choose, type GameState } from '../src/engine/index';
import { RngCursor, seedRng } from '../src/engine/rng';

export type Policy =
  | { kind: 'random' }
  | { kind: 'tags'; prefer: string[] } // goal-seeking by approach tag
  | { kind: 'script'; choices: string[] }; // fixed choice ids, random after they run out

export interface RunResult {
  background: string;
  seed: number;
  policy: string;
  outcome: 'ending' | 'dead_end' | 'softlock' | 'error' | 'max_steps';
  ending?: string;
  detail?: string;
  steps: number;
  seasons: number;
  scenes: string[];
  path: string[];
}

const SOFTLOCK_STEPS = 60;

export function policyName(p: Policy): string {
  return p.kind === 'tags' ? `tags:${p.prefer.join('+')}` : p.kind;
}

export function playOnce(content: ContentBundle, background: string, seed: number, policy: Policy, maxSteps = 2000): RunResult {
  const pick = new RngCursor(seedRng(seed ^ 0x5bd1e995));
  const res: RunResult = { background, seed, policy: policyName(policy), outcome: 'max_steps', steps: 0, seasons: 0, scenes: [], path: [] };
  let state: GameState;
  try {
    state = newGame(content, { background, seed, name: 'Bot' });
  } catch (e) {
    return { ...res, outcome: 'error', detail: (e as Error).message };
  }
  const visited = new Set<string>([state.scene]);
  let lastProgress = 0;
  let lastKey = `${state.chapter}|${state.time}`;
  let script = policy.kind === 'script' ? [...policy.choices] : [];

  for (let step = 0; step < maxSteps; step++) {
    const v = view(content, state);
    if (v.ended) {
      res.outcome = 'ending';
      res.ending = v.ended.ending;
      res.detail = v.ended.cause;
      break;
    }
    const avail = v.choices.filter((c) => c.available);
    if (!avail.length) {
      res.outcome = 'dead_end';
      res.detail = `no available choice in ${state.scene}`;
      break;
    }
    let choice = avail[pick.int(avail.length)]!;
    if (policy.kind === 'tags') {
      const preferred = avail.filter((c) => c.tags.some((t) => policy.prefer.includes(t)));
      if (preferred.length) choice = preferred[pick.int(preferred.length)]!;
    } else if (policy.kind === 'script' && script.length) {
      const want = script.shift()!;
      const found = avail.find((c) => c.id === want);
      if (!found) {
        res.outcome = 'error';
        res.detail = `script: choice "${want}" not available in ${state.scene} (have: ${avail.map((c) => c.id).join(', ')})`;
        break;
      }
      choice = found;
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
  res.seasons = state.time;
  res.scenes = [...visited];
  return res;
}

export interface BotReport {
  runs: RunResult[];
  byBackground: Record<string, {
    runs: number;
    endings: Record<string, number>;
    failures: Record<string, number>;
    avgSteps: number;
    coverage: number; // fraction of all scenes visited by at least one run
    unvisited: string[];
  }>;
}

export function summarise(content: ContentBundle, runs: RunResult[]): BotReport {
  const byBackground: BotReport['byBackground'] = {};
  const all = Object.keys(content.scenes);
  for (const bg of Object.keys(content.backgrounds)) {
    const rs = runs.filter((r) => r.background === bg);
    if (!rs.length) continue;
    const endings: Record<string, number> = {};
    const failures: Record<string, number> = {};
    const seen = new Set<string>();
    for (const r of rs) {
      r.scenes.forEach((s) => seen.add(s));
      if (r.outcome === 'ending') endings[r.ending!] = (endings[r.ending!] ?? 0) + 1;
      else failures[r.outcome] = (failures[r.outcome] ?? 0) + 1;
    }
    byBackground[bg] = {
      runs: rs.length,
      endings,
      failures,
      avgSteps: rs.reduce((s, r) => s + r.steps, 0) / rs.length,
      coverage: seen.size / all.length,
      unvisited: all.filter((s) => !seen.has(s)),
    };
  }
  return { runs, byBackground };
}

export const DEFAULT_POLICIES: Policy[] = [
  { kind: 'random' },
  { kind: 'tags', prefer: ['martial'] },
  { kind: 'tags', prefer: ['cunning', 'intrigue'] },
  { kind: 'tags', prefer: ['diplomacy', 'allies'] },
  { kind: 'tags', prefer: ['wealth', 'learning'] },
];
