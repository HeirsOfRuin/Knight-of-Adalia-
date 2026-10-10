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
    // who inherits: the eldest son, or, with no son, the eldest daughter (as in Adalia and the Armance)
    case 'heir': return [living.find((h) => h.sex === 'son') ?? living[0]].filter((h): h is Heir => !!h);
    // Mahaut's children, heirs of the Armance through her
    case 'armance': return living.filter((h) => isMahauts(state, h)).slice(0, 1);
    case 'all': return living;
    default: return [];
  }
}


/** A child of Mahaut's: recorded at birth, or, for saves from before mothers were recorded, born after the wedding at the Estates. */
export function isMahauts(state: GameState, h: Heir): boolean {
  if (h.mother) return h.mother === 'mahaut_armance';
  const wed = state.seen.c5_estates;
  return !!state.flags.c5_married_mahaut && wed !== undefined && h.born > wed;
}

/** Whether the child in this birth-order place is the one who inherits. */
export function isHeir(state: GameState, h: Heir | undefined): boolean {
  return !!h && pickHeirs(state, 'heir')[0] === h;
}
