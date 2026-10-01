import { loadContent } from '../tools/content-loader';
import type { ContentBundle, Scene } from '../src/content/schema';
import { SceneSchema } from '../src/content/schema';
import { newGame, type GameState } from '../src/engine/index';

let cached: ContentBundle | undefined;
export function content(): ContentBundle {
  return (cached ??= loadContent());
}

/** A deep copy of the real bundle with extra scenes merged in (parsed through the schema). */
export function withScenes(extra: unknown[]): ContentBundle {
  const c = structuredClone(content());
  for (const raw of extra) {
    const s: Scene = SceneSchema.parse(raw);
    c.scenes[s.id] = s;
    c.sources[s.id] = 'test';
  }
  return c;
}

export function game(bg = 'reeve', seed = 42, c = content()): GameState {
  return newGame(c, { background: bg, seed, name: 'Hal' });
}
