// Station ladder and the "new man" prejudice modifier (the audience modifier on checks).
import type { ContentBundle } from '../content/schema';
import type { GameState } from './state';

export function stationIndex(content: ContentBundle, station: string): number {
  return content.config.stations.indexOf(station);
}

export type Audience = 'nobles' | 'knights' | 'commons' | 'merchants' | 'clergy' | 'none';

/**
 * Prejudice against his origins. Shrinks with renown, rank, a gentle marriage
 * and patronage, but never below 1.
 */
export function computePrejudice(state: GameState, content: ContentBundle, audience: Audience = 'nobles'): number {
  const bg = content.backgrounds[state.background];
  if (!bg) return 0;
  let p = bg.prejudice.base + (audience === 'knights' ? bg.prejudice.knights : 0);
  const step = Math.max(0, stationIndex(content, state.station) - stationIndex(content, 'squire'));
  p -= step; // knight 1, lord 2, great lord 3, royal 4
  p -= Math.floor((state.res.renown ?? 0) / 10);
  if (state.flags.noble_marriage) p -= 1;
  if (state.flags.strong_patron) p -= 1;
  return Math.max(1, p);
}

/**
 * Modifier applied to a check made in front of a given audience.
 * Nobles and knights mark him down; commons and merchants warm to a rising man.
 */
export function audienceModifier(state: GameState, content: ContentBundle, audience: Audience): number {
  switch (audience) {
    case 'nobles':
    case 'knights':
      return -Math.ceil(computePrejudice(state, content, audience) / 2);
    case 'clergy':
      return -Math.floor(computePrejudice(state, content, 'nobles') / 4);
    case 'commons':
    case 'merchants':
      return Math.ceil(computePrejudice(state, content, 'nobles') / 4);
    default:
      return 0;
  }
}
