// Engine facade. Pure: (content, state, input) -> new state. No DOM, no clock,
// no Math.random.
// A game starts its hero itself (its own newGame) and then plays through view and choose.
import type { Choice, CoreContent as ContentBundle, Outcome } from './schema';
import type { CoreState as GameState, JournalEntry } from './state';
import { RngCursor } from './rng';
import { stakesFor } from './stakes';
import { test, unmetLabel } from './conditions';
import { computeOdds, resolveCheck, type Band, type CheckResult } from './checks';
import { applyEffects } from './effects';
import { transition } from './director';
import { StaticNarrationProvider, type NarrationProvider } from './narration';
import { describeDate } from './calendar';
import { cardFor, cardView, type CardView } from './cards';
import { gameOf } from './game';

export type { CoreState } from './state';
export { describeDate } from './calendar';
export { formatCoin } from './format';

export class EngineError extends Error {}

// ---- View -----------------------------------------------------------------

export interface ChoiceView {
  id: string;
  text: string;
  available: boolean;
  lockReason?: string;
  band?: Band;
  lethal: boolean;
  warn?: string;
  tags: string[];
  /** what the choice can change, for the hint line */
  stakes: string[];
  /** what its check tests, in words, where the game words it */
  test?: string;
}

export interface SceneView {
  sceneId: string;
  title?: string;
  date: string;
  text: string;
  outcome?: GameState['lastOutcome'];
  cause?: GameState['activeCause'];
  choices: ChoiceView[];
  ended?: GameState['ended'];
  /** true when the season or year differs from the previous scene's (or this is the first scene) */
  dateChanged: boolean;
  /** true when no choice is available: a content bug the UI must explain */
  deadEnd: boolean;
  /** the chapter or act title page shown before this scene, if it opens one */
  card?: CardView;
}

export function visibleChoices(content: ContentBundle, state: GameState): Choice[] {
  const scene = content.scenes[state.scene];
  if (!scene) return [];
  return scene.choices.filter((c) => test(c.visible_if, state, content));
}

export function isAvailable(content: ContentBundle, state: GameState, c: Choice): boolean {
  return test(c.requires, state, content);
}

export function view(content: ContentBundle, state: GameState, narrator: NarrationProvider = StaticNarrationProvider): SceneView {
  const scene = content.scenes[state.scene];
  if (!scene) throw new EngineError(`unknown scene ${state.scene}`);
  const key = gameOf(content).variantKey?.(state);
  const src = (key !== undefined ? scene.variants?.[key] : undefined) ?? scene.text;
  const card = state.ended ? undefined : cardFor(content, scene.id, state.journal);
  const choices: ChoiceView[] = state.ended
    ? []
    : visibleChoices(content, state).map((c) => {
        const available = isAvailable(content, state, c);
        return {
          id: c.id,
          text: narrator.renderPassage(c.text, state, content),
          available,
          lockReason: available ? undefined : c.label ? narrator.renderPassage(c.label, state, content) : `Requires ${unmetLabel(c.requires!, state, content)}`,
          band: c.check ? computeOdds(c.check, state, content, !!c.partial).band : undefined,
          lethal: c.lethal,
          warn: c.warn,
          tags: c.tags,
          stakes: stakesFor(content, state, c),
          test: c.check ? gameOf(content).checkLabel?.(content, c.check) : undefined,
        };
      });
  return {
    sceneId: scene.id,
    title: scene.title ? narrator.renderPassage(scene.title, state, content) : undefined,
    date: describeDate(state, content),
    text: narrator.renderPassage(src, state, content),
    outcome: state.lastOutcome,
    cause: state.activeCause,
    choices,
    ended: state.ended,
    deadEnd: !state.ended && !choices.some((c) => c.available),
    dateChanged: state.journal.length === 0 || state.journal[state.journal.length - 1]!.at !== state.time,
    card: card ? cardView(content, state, card) : undefined,
  };
}

// ---- Choose ---------------------------------------------------------------

/** Folds repeated numeric changes ("Respect +1", "Respect +1") into one, keeping order. */
export function mergeChanges(changes: string[]): string[] {
  const out: string[] = [];
  const idx = new Map<string, number>();
  const totals = new Map<string, number>();
  for (const c of changes) {
    const m = /^(.*) ([+\u2212])(\d+)$/.exec(c);
    if (!m) { out.push(c); continue; }
    const label = m[1]!;
    const n = (m[2] === '+' ? 1 : -1) * Number(m[3]);
    if (idx.has(label)) totals.set(label, totals.get(label)! + n);
    else { idx.set(label, out.length); totals.set(label, n); out.push(c); }
  }
  for (const [label, i] of idx) {
    const t = totals.get(label)!;
    out[i] = t === 0 ? '' : `${label} ${t > 0 ? '+' : '\u2212'}${Math.abs(t)}`;
  }
  return out.filter((c) => c !== '');
}

export interface ChooseOptions {
  /** debug: force the outcome of this choice's check */
  force?: CheckResult;
  narrator?: NarrationProvider;
}

export interface ChooseResult<S extends GameState = GameState> {
  state: S;
  check?: { band: Band; result: CheckResult };
}

export function choose<S extends GameState>(content: ContentBundle, prev: S, choiceId: string, opts: ChooseOptions = {}): ChooseResult<S> {
  if (prev.ended) throw new EngineError('the game has ended');
  const narrator = opts.narrator ?? StaticNarrationProvider;
  const state = structuredClone(prev);
  const scene = content.scenes[state.scene];
  if (!scene) throw new EngineError(`unknown scene ${state.scene}`);
  const choice = visibleChoices(content, state).find((c) => c.id === choiceId);
  if (!choice) throw new EngineError(`choice ${choiceId} is not visible in ${scene.id}`);
  if (!isAvailable(content, state, choice)) throw new EngineError(`choice ${choiceId} is locked in ${scene.id}`);

  const rng = new RngCursor(state.rng);
  const changes: string[] = [];
  const choiceText = narrator.renderPassage(choice.text, state, content);
  const ctx = { scene: scene.id, choice: choice.id, choiceText, changes, rng };
  const cause = state.activeCause;

  let outcome: Outcome = { text: choice.text_after, effects: [], next: choice.next };
  let check: ChooseResult<S>['check'];
  if (choice.check) {
    const odds = computeOdds(choice.check, state, content, !!choice.partial);
    let result = resolveCheck(odds, rng, opts.force);
    if (result === 'partial' && !choice.partial) result = 'failure'; // only reachable by forcing
    check = { band: odds.band, result };
    const o = choice[result];
    if (!o) throw new EngineError(`${scene.id}/${choice.id}: no outcome for ${result}`);
    outcome = o;
  }

  let died = applyEffects(state, content, choice.effects, ctx);
  if (!died) died = applyEffects(state, content, outcome.effects, ctx);
  if (died && state.ended?.cause) state.ended.cause = narrator.renderPassage(state.ended.cause, state, content);
  const outcomeText = outcome.text ? narrator.renderPassage(outcome.text, state, content) : undefined;

  const entry: JournalEntry = {
    at: prev.time,
    scene: scene.id,
    sceneTitle: scene.title ? narrator.renderPassage(scene.title, state, content) : undefined,
    choice: choiceText,
    outcome: outcomeText,
    changes: [...changes],
    cause,
  };
  entry.changes = mergeChanges(entry.changes);
  state.journal.push(entry);
  state.lastOutcome = { text: outcomeText, changes: mergeChanges(changes), check };

  if (!died) {
    const next = outcome.next ?? choice.next;
    if (next === undefined) throw new EngineError(`${scene.id}/${choice.id}: no next scene`);
    const enterChanges: string[] = [];
    transition(state, content, next, rng, enterChanges);
    if (enterChanges.length) state.lastOutcome.changes = mergeChanges([...state.lastOutcome.changes, ...enterChanges]);
  }
  state.rng = rng.state;
  return { state, check };
}
