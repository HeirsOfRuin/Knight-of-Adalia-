// House of Adalia's saves: its format name, version and migrations on the engine's codec, and
// its save-code prefix.
import { makeSaveCodec, SaveError, type SaveFile as CoreSaveFile, type LoadResult as CoreLoadResult } from '@engine/save';
import { encodeSaveCode as encodeCode, decodeSaveCode as decodeCode } from '@engine/savecode';
import type { HouseState } from './state';

export { SaveError };

export const SAVE_FORMAT = 'house-of-adalia-save';
export const SAVE_VERSION = 1;

export type SaveFile = CoreSaveFile<HouseState>;
export type LoadResult = CoreLoadResult<HouseState>;

export const migrations: Record<number, (save: SaveFile) => SaveFile> = {};

export const { toSave, fromSave } = makeSaveCodec<HouseState>({ format: SAVE_FORMAT, title: 'House of Adalia', version: SAVE_VERSION, migrations });

/** Save codes: "HOA1." + base64url of the deflated save. */
export const CODE_PREFIX = 'HOA1.';
export const encodeSaveCode = (save: unknown) => encodeCode(CODE_PREFIX, save);
export const decodeSaveCode = (text: string) => decodeCode(CODE_PREFIX, text);
