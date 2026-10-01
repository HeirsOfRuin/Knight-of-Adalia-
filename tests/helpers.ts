import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { loadContent } from '../tools/content-loader';
import type { ContentBundle, Scene } from '../src/content/schema';
import { SceneSchema, RegistrySchema } from '../src/content/schema';
import { newGame, type GameState } from '../src/engine/index';

let real: ContentBundle | undefined;
let cached: ContentBundle | undefined;

/** The shipped content, unmodified. */
export function realContent(): ContentBundle {
  return (real ??= loadContent());
}

/**
 * Shipped content plus the engine test arc (tests/fixtures), with every
 * background starting at the arc's first scene. Engine tests run against this
 * so they do not break whenever story content changes.
 */
export function content(): ContentBundle {
  if (cached) return cached;
  const c = structuredClone(realContent());
  const fx = join(import.meta.dirname, 'fixtures');
  const reg = YAML.parse(readFileSync(join(fx, 'test-registry.yaml'), 'utf8'));
  const partial = RegistrySchema.partial().parse(reg);
  for (const k of Object.keys(partial) as (keyof typeof partial)[]) Object.assign(c.registry[k], partial[k]);
  for (const raw of YAML.parse(readFileSync(join(fx, 'test-arc.yaml'), 'utf8'))) {
    const s = SceneSchema.parse(raw);
    c.scenes[s.id] = s;
    c.sources[s.id] = 'fixtures/test-arc.yaml';
  }
  for (const bg of Object.values(c.backgrounds)) bg.start_scene = 't_market';
  return (cached = c);
}

/** A deep copy of the test content with extra scenes merged in (parsed through the schema). */
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
