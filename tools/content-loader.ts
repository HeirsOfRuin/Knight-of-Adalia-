// Node-only: reads /content YAML, validates against the schema, returns a bundle.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import { z } from 'zod';
import {
  BackgroundSchema, ConfigSchema, RegistrySchema, SceneSchema,
  type ContentBundle, type Scene, type Background,
} from '../src/content/schema';

export const CONTENT_DIR = join(import.meta.dirname, '..', 'content');

export class ContentError extends Error {}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.yaml') || name.endsWith('.yml')) out.push(p);
  }
  return out;
}

function readYaml(path: string): unknown {
  try {
    return YAML.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new ContentError(`${path}: YAML parse error: ${(e as Error).message}`);
  }
}

function parse<T>(schema: z.ZodType<T>, data: unknown, where: string): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const msgs = r.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new ContentError(`${where}: schema error\n${msgs}`);
  }
  return r.data;
}

export function loadContent(dir = CONTENT_DIR): ContentBundle {
  const hash = createHash('sha1');
  const rel = (p: string) => relative(dir, p);

  const config = parse(ConfigSchema, readYaml(join(dir, 'config.yaml')), 'config.yaml');

  const regRaw: Record<string, unknown> = {};
  for (const key of ['flags', 'npcs', 'traits', 'injuries', 'items', 'factions', 'endings', 'romances', 'lore']) {
    const p = join(dir, 'registry', `${key}.yaml`);
    regRaw[key] = existsSync(p) ? (readYaml(p) ?? {}) : {};
    if (existsSync(p)) hash.update(readFileSync(p));
  }
  // People-page entries live in registry/codex.yaml (npc id -> entries) and are merged into the NPCs.
  const codexPath = join(dir, 'registry', 'codex.yaml');
  if (existsSync(codexPath)) {
    hash.update(readFileSync(codexPath));
    const codex = (readYaml(codexPath) ?? {}) as Record<string, unknown[]>;
    const npcs = regRaw.npcs as Record<string, Record<string, unknown>>;
    for (const [id, entries] of Object.entries(codex)) {
      if (!npcs[id]) throw new ContentError(`registry/codex.yaml: unknown npc "${id}"`);
      npcs[id] = { ...npcs[id], codex: entries };
    }
  }
  const registry = parse(RegistrySchema, regRaw, 'registry/');

  const backgrounds: Record<string, Background> = {};
  for (const p of walk(join(dir, 'backgrounds'))) {
    hash.update(readFileSync(p));
    const bg = parse(BackgroundSchema, readYaml(p), rel(p));
    if (backgrounds[bg.id]) throw new ContentError(`${rel(p)}: duplicate background ${bg.id}`);
    backgrounds[bg.id] = bg;
  }

  const scenes: Record<string, Scene> = {};
  const sources: Record<string, string> = {};
  for (const p of [...walk(join(dir, 'scenes')), ...walk(join(dir, 'events'))]) {
    hash.update(readFileSync(p));
    const raw = readYaml(p);
    const list = Array.isArray(raw) ? raw : [raw];
    list.forEach((s, i) => {
      const scene = parse(SceneSchema, s, `${rel(p)}[${i}]`);
      if (scenes[scene.id]) throw new ContentError(`${rel(p)}: duplicate scene id ${scene.id} (also in ${sources[scene.id]})`);
      scenes[scene.id] = scene;
      sources[scene.id] = rel(p);
    });
  }

  return { hash: hash.digest('hex').slice(0, 12), config, registry, backgrounds, scenes, sources };
}
