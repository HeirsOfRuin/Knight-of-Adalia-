import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Tests for the engine (packages/*/tests) and every game (games/*/tests), from the repository root.
export default defineConfig({
  resolve: { alias: { '@engine': fileURLToPath(new URL('./packages/engine/src', import.meta.url)) } },
  test: { include: ['packages/*/tests/**/*.test.ts', 'games/*/tests/**/*.test.ts'] },
});
