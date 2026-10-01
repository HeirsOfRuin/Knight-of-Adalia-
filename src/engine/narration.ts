// Narration seam. v1 renders authored text only; an LLM-backed provider could
// later restyle passages, but the engine never depends on one.
import type { ContentBundle } from '../content/schema';
import type { GameState } from './state';
import { renderText } from './text';

export interface NarrationProvider {
  renderPassage(src: string, state: GameState, content: ContentBundle): string;
}

export const StaticNarrationProvider: NarrationProvider = {
  renderPassage: (src, state, content) => renderText(src, state, content),
};
