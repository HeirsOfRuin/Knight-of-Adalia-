import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The engine (packages/engine) is shared by every game on it. It may import only itself and
// zod; a game's rules reach it through the game module (packages/engine/src/game.ts).
const ENGINE = join(import.meta.dirname, '..', 'src');

describe('the engine boundary', () => {
  it('imports nothing outside the engine but zod', () => {
    const bad: string[] = [];
    for (const f of readdirSync(ENGINE).filter((n) => n.endsWith('.ts'))) {
      const src = readFileSync(join(ENGINE, f), 'utf8');
      for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        const spec = m[1] ?? m[2]!;
        if (!(spec.startsWith('./') && !spec.includes('..')) && spec !== 'zod') bad.push(`${f}: ${spec}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
