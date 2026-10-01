// Scene transitions: spine links, pool interludes, delayed (queued) events.
// Interludes use a return stack: a pool or queued scene ends with "@return"
// and play resumes where it was going.
import type { ContentBundle, Next, Scene, SimpleNext } from '../content/schema';
import type { GameState } from './state';
import { test } from './conditions';
import { applyEffects } from './effects';
import type { RngCursor } from './rng';

export class DirectorError extends Error {}

export const RETURN = '@return';

export function chapterNumber(content: ContentBundle, chapter: string): number {
  return content.config.chapters.indexOf(chapter);
}

export function poolCandidates(state: GameState, content: ContentBundle, group: string, exclude: string[] = []): Scene[] {
  return Object.values(content.scenes).filter((s) => {
    if (s.kind !== 'pool' || s.pool !== group || exclude.includes(s.id)) return false;
    const last = state.seen[s.id];
    if (last !== undefined) {
      if (s.once) return false;
      if (s.cooldown && state.time - last < s.cooldown.seasons) return false;
    }
    return test(s.requires, state, content);
  });
}

function drawPool(state: GameState, content: ContentBundle, group: string, count: number, rng: RngCursor): string[] {
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    const c = poolCandidates(state, content, group, picks);
    const p = rng.pickWeighted(c, (s) => s.weight);
    if (!p) break;
    picks.push(p.id);
  }
  return picks;
}

/** First due queued event whose preconditions hold, removed from the queue. */
function takeDueQueued(state: GameState, content: ContentBundle) {
  const ch = chapterNumber(content, state.chapter);
  const due = state.queue
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.dueAt <= state.time && (q.earliestChapter === undefined || ch >= chapterNumber(content, q.earliestChapter)))
    .filter(({ q }) => {
      const sc = content.scenes[q.event];
      return sc && test(sc.requires, state, content);
    })
    .sort((a, b) => a.q.dueAt - b.q.dueAt || a.i - b.i)[0];
  if (!due) return undefined;
  state.queue.splice(due.i, 1);
  return due.q;
}

/** Moves the (cloned) state to the scene `next` resolves to. Mutates state. */
export function resolveSwitch(state: GameState, content: ContentBundle, next: Next): SimpleNext {
  if (typeof next === 'object' && 'switch' in next) {
    return next.switch.find((b) => test(b.if, state, content))?.go ?? next.default;
  }
  return next;
}

export function transition(state: GameState, content: ContentBundle, rawNext: Next, rng: RngCursor, changes: string[]): void {
  const next = resolveSwitch(state, content, rawNext);
  let target: string | undefined;
  if (typeof next === 'object') {
    const picks = drawPool(state, content, next.pool, next.count, rng);
    state.returnStack.push(next.then);
    for (let i = picks.length - 1; i >= 1; i--) state.returnStack.push(picks[i]!);
    target = picks.length ? picks[0] : state.returnStack.pop();
  } else if (next === RETURN) {
    target = state.returnStack.pop();
    if (!target) throw new DirectorError(`"@return" from ${state.scene} with an empty return stack`);
  } else {
    target = next;
  }

  state.activeCause = undefined;
  const due = takeDueQueued(state, content);
  if (due) {
    state.returnStack.push(target!);
    target = due.event;
    state.activeCause = due.origin;
  }

  const scene = content.scenes[target!];
  if (!scene) throw new DirectorError(`transition to unknown scene "${target}" from ${state.scene}`);
  enterScene(state, content, scene, changes);
}

export function enterScene(state: GameState, content: ContentBundle, scene: Scene, changes: string[]): void {
  state.scene = scene.id;
  if (scene.kind === 'spine' || scene.kind === 'ending') state.chapter = scene.chapter; // interludes keep the current chapter
  state.seen[scene.id] = state.time;
  if (scene.checkpoint) state.checkpoint = scene.id;
  applyEffects(state, content, scene.on_enter, { scene: scene.id, choice: '(enter)', choiceText: '', changes });
  if (scene.kind === 'ending' && !state.ended) state.ended = { ending: scene.ending ?? 'unknown' };
}
