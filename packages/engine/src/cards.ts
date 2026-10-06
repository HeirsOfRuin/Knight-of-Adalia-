// Chapter cards: the title page shown before the first scene of a chapter (config.chapter_cards)
// or of an act (scene.card), with a short account of where the hero stands and what the years
// since the last card have brought.
import { heroOf } from './character';
import type { Card, CoreContent as ContentBundle } from './schema';
import type { CoreState as GameState } from './state';
import { gameOf } from './game';
import { ageOf, describeDate } from './calendar';
import { forceOf } from './paths';
import { capitalise, formatCoin, numberWords } from './format';

export interface CardView extends Card {
  /** label/value lines: date, age, household, lands, force, purse */
  rows: [string, string][];
  /** what changed since the previous card: years passed, births, deaths */
  since: string[];
}

/** The card for a scene, if the scene opens a chapter or an act. */
export function cardFor(content: ContentBundle, scene: string, prevScene: string | undefined): Card | undefined {
  const s = content.scenes[scene];
  if (!s) return undefined;
  if (s.card) return s.card;
  const prevChapter = prevScene ? content.scenes[prevScene]?.chapter : undefined;
  if (prevChapter === s.chapter) return undefined;
  return content.config.chapter_cards[s.chapter];
}

/** The season of the last card shown before now: the most recent journal entry that opened a chapter or an act. */
function lastCardAt(content: ContentBundle, state: GameState): number | undefined {
  const j = state.journal;
  // the last entry is the scene just left; the current card belongs to the scene now open
  for (let i = j.length - 1; i >= 0; i--) {
    if (cardFor(content, j[i]!.scene, j[i - 1]?.scene)) return j[i]!.at;
  }
  return undefined;
}

export function cardView(content: ContentBundle, state: GameState, card: Card): CardView {
  const game = gameOf(content);
  const rows: [string, string][] = [];
  rows.push(['Date', describeDate(state, content)]);
  rows.push(['Age', String(ageOf(state))]);
  rows.push(['Station', capitalise(heroOf(state).station.replace('_', ' '))]);

  rows.push(...(game.cardRows?.(content, state) ?? []));
  const f = forceOf(state);
  if (f.total > 0) rows.push(['Men', String(f.total)]);
  rows.push(['Purse', formatCoin(state.res.coin ?? 0)]);

  const since: string[] = [];
  const from = lastCardAt(content, state);
  if (from !== undefined) {
    const years = Math.floor((state.time - from) / 4);
    if (years >= 1) since.push(`${capitalise(numberWords(years))} year${years === 1 ? '' : 's'} have passed.`.replace('One year have', 'One year has'));
    since.push(...(game.cardBorn?.(content, state, from) ?? []));
    const dead = Object.entries(state.npcs)
      .filter(([, n]) => n.met && !n.alive && n.diedAt !== undefined && n.diedAt >= from)
      .map(([id]) => content.registry.npcs[id]?.name ?? id);
    dead.push(...(game.cardDead?.(content, state, from) ?? []));
    if (dead.length) since.push(`Dead: ${dead.join(', ')}.`);
  }
  return { ...card, rows, since };
}
