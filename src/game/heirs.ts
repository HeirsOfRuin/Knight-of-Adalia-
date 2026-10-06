// Heirs (Ch3+): his children, and the selectors content uses to name them.
import type { GameState, Heir } from './state';

export const TEMPERAMENTS = ['bold', 'bookish', 'merry', 'grave'] as const;
export const UPBRINGINGS = ['home', 'page', 'church', 'arms', 'letters', 'court'] as const;

/** Living children in birth order, resolved by the heir selectors used in content. */
export function pickHeirs(state: GameState, which: string): Heir[] {
  const living = (state.heirs ?? []).filter((h) => h.alive);
  switch (which) {
    case 'eldest': return living.slice(0, 1);
    case 'second': return living.slice(1, 2);
    case 'third': return living.slice(2, 3);
    case 'last': return living.slice(-1);
    case 'all': return living;
    default: return [];
  }
}

