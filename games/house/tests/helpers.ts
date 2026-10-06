import { loadContent } from '../tools/content-loader';
import { SceneSchema, type ContentBundle } from '../src/content/schema';
import { newGame, type NewHouseOptions } from '../src/game/index';
import type { HouseState } from '../src/game/state';

let real: ContentBundle | undefined;
export function content(): ContentBundle {
  return (real ??= loadContent());
}

/** A copy of the content with extra scenes (parsed through the schema). */
export function withScenes(extra: unknown[]): ContentBundle {
  const c = structuredClone(content());
  for (const raw of extra) {
    const s = SceneSchema.parse(raw);
    c.scenes[s.id] = s;
    c.sources[s.id] = 'test';
  }
  return c;
}

export function house(opts: Partial<NewHouseOptions> = {}, c = content()): HouseState {
  return newGame(c, { opening: 'founder', frame: 'free', seed: 7, name: 'Hal', ...opts });
}
