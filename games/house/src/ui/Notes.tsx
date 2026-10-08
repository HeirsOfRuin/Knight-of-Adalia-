// Playtest notes: the author writes a note on the scene in front of them. Where the page runs as a
// claude.ai Artifact with the db capability, notes go to its shared store (collection "notes"), where
// Claude reads them back; anywhere else, and as a copy, they are kept in this browser.
import { useEffect, useState } from 'preact/hooks';
import type { ContentBundle } from '../content/schema';
import type { HouseState } from '../game/state';

interface Note { scene: string; title: string; date: string; text: string; at: number; frame: string; sovereign: string; seed: number; hero: string; generation: number }
interface NotesDb { collection(path: string): { add(data: Record<string, unknown>): Promise<unknown> } }

const LOCAL_KEY = 'house-of-adalia/playtest-notes';
let dbPromise: Promise<NotesDb | null> | undefined;
function notesDb(): Promise<NotesDb | null> {
  const claude = (globalThis as { claude?: { use?: (name: string) => Promise<unknown> } }).claude;
  if (!claude?.use) return Promise.resolve(null);
  return (dbPromise ??= claude.use('db').then((db) => (db as NotesDb | null) ?? null, () => null));
}
function localNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as Note[]; } catch { return []; }
}
function keepLocal(notes: Note[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(notes)); } catch { /* storage unavailable */ }
}

export function Notes({ content, state, sceneId, title, date }: { content: ContentBundle; state: HouseState; sceneId: string; title: string; date: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const [shared, setShared] = useState<boolean>();
  const [all, setAll] = useState<Note[]>(localNotes);
  useEffect(() => { notesDb().then((db) => setShared(!!db)); }, []);
  useEffect(() => { setStatus(''); }, [sceneId]);

  const save = async () => {
    const note: Note = {
      scene: sceneId, title, date, text: text.trim(), at: Date.now(),
      frame: state.realm.west, sovereign: state.realm.sovereign, seed: state.seed, hero: state.characters[state.hero]?.name ?? '', generation: state.family.generation,
    };
    if (!note.text) return;
    const next = [...all, note];
    keepLocal(next);
    setAll(next);
    setText('');
    const db = await notesDb();
    if (!db) { setStatus('Saved in this browser. Use "Copy all notes" to send them.'); return; }
    try {
      await db.collection('notes').add({ ...note, content: content.hash });
      setStatus('Saved. Claude can read it.');
    } catch {
      setStatus('Could not reach the shared notes, so it is saved in this browser only. Use "Copy all notes" to send it.');
    }
  };
  const copy = async () => {
    const out = all.map((n) => `[${n.scene}] ${n.title} (${n.date}; ${n.frame}/${n.sovereign}, seed ${n.seed})\n${n.text}`).join('\n\n');
    try { await navigator.clipboard.writeText(out); setStatus(`Copied ${all.length} notes.`); } catch { setStatus('Copying is blocked here. Select the notes below and copy them by hand.'); setOpen(true); }
  };
  const here = all.filter((n) => n.scene === sceneId);

  return (
    <section class="playtest-notes" aria-label="Playtest notes">
      {!open ? (
        <button class="btn wide" onClick={() => setOpen(true)}>Note on this scene{here.length ? ` (${here.length})` : ''}</button>
      ) : (
        <>
          <label class="field" for="playtest-note">
            <span>Your note on <strong>{title}</strong>: a line that reads wrong, a choice you wanted, a plot point to change.</span>
            <textarea id="playtest-note" rows={4} value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} />
          </label>
          <div class="row">
            <button class="btn primary" disabled={!text.trim()} onClick={save}>Save note</button>
            <button class="btn subtle" onClick={() => setOpen(false)}>Close</button>
            {all.length > 0 && <button class="btn subtle" onClick={copy}>Copy all notes</button>}
          </div>
          {here.length > 0 && <ul class="changes">{here.map((n) => <li key={n.at}>{n.text}</li>)}</ul>}
        </>
      )}
      {status && <p class="muted" role="status">{status}</p>}
      {shared === false && open && !status && <p class="fineprint">Notes are kept in this browser here.</p>}
    </section>
  );
}
