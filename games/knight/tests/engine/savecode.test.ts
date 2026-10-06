import { describe, it, expect } from 'vitest';
import { encodeSaveCode, decodeSaveCode, CODE_PREFIX } from '../../src/game/save';
import { toSave, fromSave } from '../../src/game/save';
import { content, game } from '../helpers';

describe('save codes', () => {
  it('round-trips a save through a short code, and still reads plain JSON', async () => {
    const c = content();
    const s = game();
    const save = toSave(s, c);
    const code = await encodeSaveCode(save);
    expect(code.startsWith(CODE_PREFIX)).toBe(true);
    expect(code.length).toBeLessThan(JSON.stringify(save).length);
    expect(fromSave(await decodeSaveCode(code), c).state).toEqual(fromSave(save, c).state);
    expect(fromSave(await decodeSaveCode(JSON.stringify(save)), c).state.scene).toBe(s.scene);
  });
  it('rejects damaged text with a readable message', async () => {
    await expect(decodeSaveCode(CODE_PREFIX + 'not-really')).rejects.toThrow(/damaged/);
    await expect(decodeSaveCode('hello')).rejects.toThrow(/not a save/);
  });
});
