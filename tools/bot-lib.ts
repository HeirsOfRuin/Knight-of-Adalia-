// Playthrough bot. Plays the engine headless with a policy and reports how
// each run ended. It asserts progress: a run that never advances is a failure,
// not a pass.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import type { ContentBundle } from '../src/content/schema';
import { newGame, view, choose, type GameState } from '../src/engine/index';
import { RngCursor, seedRng } from '../src/engine/rng';
import { test as testCond } from '../src/engine/conditions';
import type { CheckResult } from '../src/engine/checks';
import { payDue } from '../src/engine/estate';

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
  /** summary of the final state, for balance reports */
  final?: Record<string, string>;
}

const SOFTLOCK_STEPS = 60;

export function policyName(p: Policy): string {
  return p.kind === 'tags' ? `tags:${p.prefer.join('+')}` : p.kind;
}

/** What a shop choice costs: the coin its effects take. */
export function priceOf(content: ContentBundle, scene: string, choice: string): number {
  const c = content.scenes[scene]?.choices.find((x) => x.id === choice);
  let p = 0;
  for (const e of c?.effects ?? []) if ('add' in e && typeof e.add['res.coin'] === 'number' && e.add['res.coin'] < 0) p -= e.add['res.coin'];
  return p;
}

export function playOnce(content: ContentBundle, background: string, seed: number, policy: Policy, maxSteps = 2000, observe?: (s: GameState) => void): RunResult {
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
    observe?.(state);
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
    if (state.scene.includes('_buy_') && policy.kind !== 'script') {
      // shops: keep back the men's Michaelmas pay. A spender (wealth) buys what he can;
      // anyone else buys one thing, half the time, and closes the purse.
      const reserve = payDue(state);
      const buys = avail.filter((c) => c.id !== 'done' && (state.res.coin ?? 0) - priceOf(content, state.scene, c.id) >= reserve);
      const spender = policy.kind === 'tags' && policy.prefer.includes('wealth');
      const boughtHere = res.path.at(-1)?.startsWith(`${state.scene}/`);
      const buy = buys.length && (spender || (!boughtHere && pick.int(2) === 0));
      choice = buy ? buys[pick.int(buys.length)]! : avail.find((c) => c.id === 'done') ?? choice;
    } else if (policy.kind === 'tags') {
      // a goal-seeking player takes his preferred approach, and otherwise does not simply give up
      const preferred = avail.filter((c) => c.tags.some((t) => policy.prefer.includes(t)));
      const notYield = avail.filter((c) => !c.tags.includes('yield'));
      const pool = preferred.length ? preferred : notYield.length ? notYield : avail;
      choice = pool[pick.int(pool.length)]!;
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
  res.final = describeFinal(state);
  res.scenes = [...visited];
  return res;
}

/** Coarse facts about a finished run, tallied per background in the report. */
export function describeFinal(s: GameState): Record<string, string> {
  const suits = Object.entries(s.suits).filter(([, x]) => x.status === 'courted' || x.pledge !== 'none');
  return {
    gate: s.flags.p_lower_track ? 'lower track' : 'squire track',
    exit: s.ended?.ending === 'death' ? 'dead' : s.station === 'knight' ? 'knight' : s.track === 'man_at_arms' ? 'man-at-arms' : `${s.station}/${s.track ?? '-'}`,
    master: s.aliases.master ?? 'none',
    'lost first master': s.flags.c1_lost_master ? 'yes' : 'no',
    'courtships open': String(suits.length),
    renown: s.res.renown! >= 12 ? '12+' : s.res.renown! >= 6 ? '6-11' : '0-5',
    'knighted by': s.flags.c1_dubbed_by_master ? 'master (ch1)' : s.flags.c1_dubbed_by_ravell ? 'Ravell (ch1)' : s.flags.c1_dubbed_by_king ? 'King (ch1)' : s.flags.c1_dubbed_by_pryce ? 'Pryce (ch1)' : s.flags.c2_knighted_grisolles ? 'Grisolles' : s.flags.c2_knighted_eve ? 'eve of Les Salines' : s.flags.c2_knighted_field ? 'field of Les Salines' : s.flags.c2_ceremonial_knight ? 'ceremonial' : 'not knighted',
    'following at end': String(Object.values(s.npcs).filter((n) => n.follower && n.alive).length + (s.res.men ?? 0)),
  };
}

export interface BotReport {
  runs: RunResult[];
  byBackground: Record<string, {
    runs: number;
    endings: Record<string, number>;
    failures: Record<string, number>;
    avgSteps: number;
    coverage: number; // fraction of scenes reachable for this background visited by at least one run
    unvisited: string[];
    finals: Record<string, Record<string, number>>;
  }>;
}

export function summarise(content: ContentBundle, runs: RunResult[], reachable?: Record<string, Set<string>>): BotReport {
  const byBackground: BotReport['byBackground'] = {};
  const all = Object.keys(content.scenes);
  for (const bg of Object.keys(content.backgrounds)) {
    const rs = runs.filter((r) => r.background === bg);
    if (!rs.length) continue;
    const endings: Record<string, number> = {};
    const failures: Record<string, number> = {};
    const seen = new Set<string>();
    const finals: Record<string, Record<string, number>> = {};
    for (const r of rs) {
      if (r.outcome === 'ending') for (const [k, v] of Object.entries(r.final ?? {})) {
        finals[k] ??= {};
        finals[k][v] = (finals[k][v] ?? 0) + 1;
      }
      r.scenes.forEach((s) => seen.add(s));
      if (r.outcome === 'ending') endings[r.ending!] = (endings[r.ending!] ?? 0) + 1;
      else failures[r.outcome] = (failures[r.outcome] ?? 0) + 1;
    }
    byBackground[bg] = {
      runs: rs.length,
      endings,
      failures,
      avgSteps: rs.reduce((s, r) => s + r.steps, 0) / rs.length,
      coverage: (reachable?.[bg] ? [...reachable[bg]!].filter((x) => seen.has(x)).length / reachable[bg]!.size : seen.size / all.length),
      unvisited: (reachable?.[bg] ? [...reachable[bg]!] : all).filter((s) => !seen.has(s)),
      finals,
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

// ---- Scripted plans ---------------------------------------------------------
// A plan names the choice to take in each scene ("choice" or "choice!success"
// to force the check). Scenes not in the plan (pool and queued interludes)
// take the first available non-lethal choice. After the run, every `expect`
// condition must hold.

export interface Plan {
  name: string;
  background: string;
  seed: number;
  role?: string;
  /** choice per scene; a list for a scene visited more than once (shops), taken in order */
  steps: Record<string, string | string[]>;
  ending: string;
  expect: string[];
}

export interface PlanResult {
  plan: string;
  ok: boolean;
  problems: string[];
  path: string[];
  state: GameState;
}

/** The planned choice for this visit to a scene (a list is taken in order, one per visit). */
export function planStep(plan: Plan, scene: string, visits: Record<string, number>): string | undefined {
  const planned = plan.steps[scene];
  const visit = (visits[scene] = (visits[scene] ?? -1) + 1);
  return Array.isArray(planned) ? planned[Math.min(visit, planned.length - 1)] : planned;
}

/** A scene the plan does not name: a shop (the purse files) closes its purse; anything else takes the first safe choice. */
export function unplannedChoice(scene: string, avail: { id: string; lethal?: boolean }[]): string {
  return (avail.find((c) => c.id === 'done' && scene.includes('_buy_')) ?? avail.find((c) => !c.lethal) ?? avail[0]!).id;
}

export function playPlan(content: ContentBundle, plan: Plan, maxSteps = 500, observe?: (s: GameState) => void): PlanResult {
  let state = newGame(content, { background: plan.background, seed: plan.seed, name: 'Plan', role: plan.role });
  const problems: string[] = [];
  const path: string[] = [];
  const used = new Set<string>();
  const visits: Record<string, number> = {};
  for (let i = 0; i < maxSteps && !state.ended; i++) {
    observe?.(state);
    const v = view(content, state);
    const avail = v.choices.filter((c) => c.available);
    if (!avail.length) { problems.push(`dead end in ${state.scene}`); break; }
    const step = planStep(plan, state.scene, visits);
    let id: string;
    let force: CheckResult | undefined;
    if (step) {
      const [cid, f] = step.split('!');
      id = cid!;
      force = f as CheckResult | undefined;
      if (!avail.some((c) => c.id === id)) {
        problems.push(`${state.scene}: planned choice "${id}" not available (have ${avail.map((c) => c.id).join(', ')})`);
        break;
      }
      used.add(state.scene);
    } else {
      id = unplannedChoice(state.scene, avail);
    }
    path.push(`${state.scene}/${id}${force ? `!${force}` : ''}`);
    state = choose(content, state, id, { force }).state;
  }
  if (!state.ended) problems.push('did not finish');
  else if (state.ended.ending !== plan.ending) problems.push(`ended in "${state.ended.ending}" (${state.ended.cause ?? ''}), expected "${plan.ending}"`);
  // pool events are drawn by the director, so a content change elsewhere can swap which ones a run meets
  for (const s of Object.keys(plan.steps)) if (!used.has(s) && content.scenes[s]?.kind !== 'pool') problems.push(`plan step for ${s} was never reached`);
  for (const e of plan.expect) {
    try {
      if (!testCond(e, state, content)) problems.push(`expectation failed: ${e}`);
    } catch (err) {
      problems.push(`bad expectation "${e}": ${(err as Error).message}`);
    }
  }
  return { plan: plan.name, ok: problems.length === 0, problems, path, state };
}

export const PLAN_DIR = join(import.meta.dirname, 'plans');

export function loadPlans(dir = PLAN_DIR): Plan[] {
  return readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort().map((f) => YAML.parse(readFileSync(join(dir, f), 'utf8')) as Plan);
}
