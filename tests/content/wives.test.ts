import { describe, it, expect } from 'vitest';
import { realContent, game } from '../helpers';
import { renderText } from '../../src/engine/text';
import { WIFE_MOMENTS, MARRIAGE_STAGES } from '../../src/content/schema';

describe('wives have their own voices', () => {
  const c = realContent();
  it('every wife has a distinct line at every moment she can reach, and it renders cleanly', () => {
    const seen = new Map<string, string>();
    for (const [id, r] of Object.entries(c.registry.romances)) {
      const s = game();
      s.aliases.spouse = id;
      s.flags.c3_married = true;
      for (const [m, stage] of Object.entries(WIFE_MOMENTS)) {
        if (MARRIAGE_STAGES.indexOf(stage) < MARRIAGE_STAGES.indexOf(r.married_in)) continue;
        const out = renderText(`{wife.${m}}`, s, c);
        expect(out, `${id}.${m}`).not.toBe('');
        expect(out, `${id}.${m}`).not.toMatch(/[{}[\]]/);
        // no two wives share a line
        const prev = seen.get(out);
        if (prev) throw new Error(`${id}.${m} repeats ${prev}`);
        seen.set(out, id);
      }
    }
  });
  it('no wife, no line', () => {
    const s = game();
    expect(renderText('{wife.letter}', s, c)).toBe('');
  });
});
