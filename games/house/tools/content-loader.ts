// Node-only: reads games/house/content into a bundle (the shared loader plus the openings).
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { loadBase, walkYaml, readYaml, parse, ContentError } from '@tools/content';
import { ConfigSchema, RegistrySchema, SceneSchema, OpeningSchema, GAME_ID, type ContentBundle, type Opening } from '../src/content/schema';
import '../src/game/module'; // the rules this content is played by

export { ContentError };
export const CONTENT_DIR = join(import.meta.dirname, '..', 'content');
const REGISTRY = ['flags', 'npcs', 'traits', 'injuries', 'items', 'factions', 'endings', 'lore', 'places', 'frames', 'sovereigns'];

export function loadContent(dir = CONTENT_DIR): ContentBundle {
  const { hash, base, rel } = loadBase({ dir, game: GAME_ID, config: ConfigSchema, registry: RegistrySchema, scene: SceneSchema, registryKeys: REGISTRY });
  const openings: Record<string, Opening> = {};
  for (const p of walkYaml(join(dir, 'openings'))) {
    hash.update(readFileSync(p));
    const op = parse(OpeningSchema, readYaml(p), rel(p));
    if (openings[op.id]) throw new ContentError(`${rel(p)}: duplicate opening ${op.id}`);
    openings[op.id] = op;
  }
  return { hash: hash.digest('hex').slice(0, 12), ...base, openings };
}
