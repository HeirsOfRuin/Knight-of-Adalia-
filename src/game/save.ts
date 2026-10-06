// Knight of Adalia's saves: its format name, version and migrations on the engine's codec,
// and its save-code prefix.
import { makeSaveCodec, SaveError, type SaveFile as CoreSaveFile, type LoadResult as CoreLoadResult } from '@engine/save';
import { encodeSaveCode as encodeCode, decodeSaveCode as decodeCode } from '@engine/savecode';
import type { GameState } from './state';

export { SaveError };

export const SAVE_FORMAT = 'knight-of-adalia-save';
export const SAVE_VERSION = 3;

export type SaveFile = CoreSaveFile<GameState>;
export type LoadResult = CoreLoadResult<GameState>;

/** fromVersion -> function producing the next version's save. */
export const migrations: Record<number, (save: SaveFile) => SaveFile> = {
  // 2 split the force into company, garrison and village levy. Older saves made those choices without the men being counted.
  1: (s) => ({ ...s, saveVersion: 2, state: countOldForce(structuredClone(s.state)) }),
  // 3 remembers how many people the manor held when it was granted (estate.founded).
  2: (s) => ({ ...s, saveVersion: 3, state: rememberFounding(structuredClone(s.state)) }),
};

/** The founding populations given by found_estate in c3_arrival (content/scenes/ch3/01-mortality.yaml). */
function rememberFounding(state: GameState): GameState {
  if (state.estate && state.estate.founded === undefined) {
    state.estate.founded = state.flags.c2_granted_marsalin ? 300 : state.flags.c2_granted_kerval ? 250 : 200;
  }
  return state;
}

function countOldForce(state: GameState): GameState {
  const f = state.flags;
  const res = state.res;
  if (f.c2_paid_men) res.men = (res.men ?? 0) + 2;
  if (f.c3_hired_bandits && !f.c4_iron_core) res.garrison = (res.garrison ?? 0) + 60;
  const drill = state.journal.find((e) => e.scene === 'c3_truce_ends' && /^Train the villagers/.test(e.choice));
  if (drill && !f.c4_manor_company) res.levy = (res.levy ?? 0) + (drill.changes.some((c) => c.startsWith('Command')) || drill.changes.length === 0 ? 52 : 12);
  return state;
}

export const { toSave, fromSave } = makeSaveCodec<GameState>({ format: SAVE_FORMAT, title: 'Knight of Adalia', version: SAVE_VERSION, migrations });

/** Save codes: "KOA1." + base64url of the deflated save. */
export const CODE_PREFIX = 'KOA1.';
export const encodeSaveCode = (save: unknown) => encodeCode(CODE_PREFIX, save);
export const decodeSaveCode = (text: string) => decodeCode(CODE_PREFIX, text);
