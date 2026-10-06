// Node-only: reads a game's content folder (YAML) and validates it against the game's schemas.
// Shared by the games' toolchains; Knight of Adalia keeps its own loader (games/knight/tools).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash, type Hash } from 'node:crypto';
import YAML from 'yaml';
import type { z } from 'zod';
import type { CoreContent, Scene } from '@engine/schema';

export class ContentError extends Error {}

export function walkYaml(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkYaml(p));
    else if (name.endsWith('.yaml') || name.endsWith('.yml')) out.push(p);
  }
  return out;
}

export function readYaml(path: string): unknown {
  try {
    return YAML.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new ContentError(`${path}: YAML parse error: ${(e as Error).message}`);
  }
}

export function parse<T>(schema: z.ZodType<T>, data: unknown, where: string): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const msgs = r.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new ContentError(`${where}: schema error\n${msgs}`);
  }
  return r.data;
}

export interface LoadSpec<C, R, S> {
  /** the content folder */
  dir: string;
  /** the game module id the bundle names (content.game) */
  game: string;
  config: z.ZodType<C>;
  registry: z.ZodType<R>;
  scene: z.ZodType<S>;
  /** registry/<key>.yaml files to read */
  registryKeys: string[];
}

export interface Loaded<C, R, S> {
  hash: Hash;
  base: { game: string; config: C; registry: R; scenes: Record<string, S>; sources: Record<string, string>; map?: CoreContent['map'] };
  rel: (p: string) => string;
}

/**
 * config.yaml, registry/<key>.yaml, scenes/ and events/, and map/scene-places.yaml. The game adds
 * its own folders (backgrounds, openings) through the returned hash and finishes the bundle.
 */
export function loadBase<C, R, S extends Pick<Scene, 'id'>>(spec: LoadSpec<C, R, S>): Loaded<C, R, S> {
  const { dir } = spec;
  const hash = createHash('sha1');
  const rel = (p: string) => relative(dir, p);
  const configPath = join(dir, 'config.yaml');
  hash.update(readFileSync(configPath));
  const config = parse(spec.config, readYaml(configPath), 'config.yaml');
  const regRaw: Record<string, unknown> = {};
  for (const key of spec.registryKeys) {
    const p = join(dir, 'registry', `${key}.yaml`);
    regRaw[key] = existsSync(p) ? (readYaml(p) ?? {}) : {};
    if (existsSync(p)) hash.update(readFileSync(p));
  }
  const registry = parse(spec.registry, regRaw, 'registry/');
  const scenes: Record<string, S> = {};
  const sources: Record<string, string> = {};
  for (const p of [...walkYaml(join(dir, 'scenes')), ...walkYaml(join(dir, 'events'))]) {
    hash.update(readFileSync(p));
    const raw = readYaml(p);
    const list = Array.isArray(raw) ? raw : [raw];
    list.forEach((s, i) => {
      const scene = parse(spec.scene, s, `${rel(p)}[${i}]`);
      if (scenes[scene.id]) throw new ContentError(`${rel(p)}: duplicate scene id ${scene.id} (also in ${sources[scene.id]})`);
      scenes[scene.id] = scene;
      sources[scene.id] = rel(p);
    });
  }
  let map: CoreContent['map'];
  const placesPath = join(dir, 'map', 'scene-places.yaml');
  if (existsSync(placesPath)) {
    hash.update(readFileSync(placesPath));
    map = { scenes: (readYaml(placesPath) ?? {}) as Record<string, string> };
  }
  return { hash, base: { game: spec.game, config, registry, scenes, sources, map }, rel };
}
