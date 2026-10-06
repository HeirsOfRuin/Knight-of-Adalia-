// Save codes: the save as short copyable text. A game's prefix ("KOA1.") + base64url
// of the deflated JSON. Plain JSON (older saves, exported files) is still accepted.
// Uses the platform CompressionStream (browsers, Node 18+).

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Journal entries kept in full in a save code; older ones keep only what was chosen, and when. */
export const CODE_FULL_JOURNAL = 25;

function compact(save: unknown): unknown {
  const s = save as { state?: { journal?: Record<string, unknown>[] } };
  const j = s.state?.journal;
  if (!j || j.length <= CODE_FULL_JOURNAL) return save;
  const cut = j.length - CODE_FULL_JOURNAL;
  const journal = j.map((e, i) => (i < cut ? { at: e.at, scene: e.scene, sceneTitle: e.sceneTitle, choice: e.choice, changes: [] } : e));
  return { ...s, state: { ...s.state, journal } };
}

export async function encodeSaveCode(prefix: string, save: unknown): Promise<string> {
  return encodeCode(prefix, compact(save));
}

/** Any JSON as prefix + base64url of its deflated text (save codes, dynasty codes). */
export async function encodeCode(prefix: string, value: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(value));
  return prefix + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

/** The JSON inside a code made by encodeCode with this prefix. Throws on anything else. */
export async function decodeCode(prefix: string, text: string): Promise<unknown> {
  const t = text.trim();
  if (!t.startsWith(prefix)) throw new Error(`Not a code beginning ${prefix}`);
  const bytes = await pipe(fromBase64Url(t.slice(prefix.length).replace(/\s+/g, '')), new DecompressionStream('deflate-raw'));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Parses a save code or plain save JSON. Throws on anything else. */
export async function decodeSaveCode(prefix: string, text: string): Promise<unknown> {
  const t = text.trim();
  if (t.startsWith(prefix)) {
    let bytes: Uint8Array;
    try {
      bytes = await pipe(fromBase64Url(t.slice(prefix.length).replace(/\s+/g, '')), new DecompressionStream('deflate-raw'));
    } catch {
      throw new Error('The save text is damaged or incomplete. Check it was copied in full.');
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  try {
    return JSON.parse(t);
  } catch {
    throw new Error('That is not a save code or a save file.');
  }
}
