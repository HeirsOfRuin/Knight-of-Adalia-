import { describe, it, expect } from 'vitest';
import { renderText, validateText } from '@engine/text';
import { content, game } from '../helpers';

describe('text', () => {
  const c = content();
  it('substitutes variables', () => {
    const s = game('reeve');
    expect(renderText('{name} has {coin}. {npc.hamon_darrell.title}.', s, c)).toBe('Hal has 3s 4d. Sir Hamon Darrell.');
  });
  it('handles if/elif/else and nesting', () => {
    const src = '[if background == archer]A[elif background == reeve]B[if skill.learning >= 2]+[/if][else]C[/if]';
    expect(renderText(src, game('archer'), c)).toBe('A');
    expect(renderText(src, game('reeve'), c)).toBe('B+');
    expect(renderText(src, game('burgess'), c)).toBe('C');
  });
  it('collapses blank lines left by empty conditionals', () => {
    expect(renderText('One.\n[if flag.t_wrestled]Two.[/if]\n\n\nThree.', game(), c)).toBe('One.\n\nThree.');
  });
  it('reports malformed text and bad paths', () => {
    expect(validateText('[if flag.t_wrestled]x', c).errors[0]).toMatch(/unclosed/);
    expect(validateText('{npc.nobody}', c).errors[0]).toMatch(/unknown npc/);
    expect(validateText('[if flag.missing]x[/if]', c).errors[0]).toMatch(/unknown flag/);
  });
});
