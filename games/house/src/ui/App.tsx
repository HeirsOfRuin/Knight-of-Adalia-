// House of Adalia, the framework build: start a house from an opening and a frame, or from a
// Knight of Adalia dynasty code, and play the scenes there are. The full interface comes with
// the vertical slice (docs/FRAME.md §11).
import { useMemo, useState } from 'preact/hooks';
import { decodeDynasty } from '@dynasty/contract';
import type { ContentBundle, Frame } from '../content/schema';
import { newGame, view, choose, checkStart, type HouseState } from '../game/index';
import { fromDynasty } from '../game/import';

type Sex = 'male' | 'female';

function NewHouse({ content, onStart }: { content: ContentBundle; onStart: (s: HouseState) => void }) {
  const openings = Object.values(content.openings);
  const [opening, setOpening] = useState(openings[0]!.id);
  const op = content.openings[opening]!;
  const [frame, setFrame] = useState<Frame>(op.frames[0]!);
  const frameOk = op.frames.includes(frame) ? frame : op.frames[0]!;
  const sovereigns = op.sovereigns[frameOk] ?? [];
  const [sovereign, setSovereign] = useState('');
  const sov = sovereigns.includes(sovereign) ? sovereign : sovereigns[0]!;
  const [name, setName] = useState('Hal');
  const [sex, setSex] = useState<Sex>('male');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const seed = () => (Math.random() * 2 ** 32) >>> 0;

  const begin = () => {
    try {
      checkStart(content, opening, frameOk, sov);
      onStart(newGame(content, { opening, frame: frameOk, sovereign: sov, seed: seed(), name, sex }));
    } catch (e) { setError((e as Error).message); }
  };
  const importCode = async () => {
    try {
      onStart(fromDynasty(content, await decodeDynasty(code), { seed: seed() }));
    } catch (e) { setError((e as Error).message); }
  };
  const styleOf = (id: string) => content.registry.sovereigns[id]?.style.replace(/\[if[^\]]*\]Queen\[else\]King\[\/if\] \{name\}/, 'Yourself') ?? id;

  return (
    <main class="newgame">
      <h1>House of Adalia</h1>
      <p class="muted">An early build of the sequel: the frame of the West is in place, and the story is still being planned.</p>

      <h2>Continue a life</h2>
      <label class="field">
        <span>Paste the house code from the end of Knight of Adalia (Export your house).</span>
        <textarea rows={3} value={code} onInput={(e) => setCode((e.currentTarget as HTMLTextAreaElement).value)} placeholder="KOAD1." />
      </label>
      <button class="btn wide" disabled={!code.trim()} onClick={importCode}>Continue the house</button>

      <h2>Or found one</h2>
      <div class="bg-list" role="radiogroup" aria-label="Opening">
        {openings.map((o) => (
          <button key={o.id} role="radio" aria-checked={opening === o.id} class={`bg-card ${opening === o.id ? 'selected' : ''}`} onClick={() => setOpening(o.id)}>
            <strong>{o.label}</strong>
            <span class="bg-summary">{o.summary}</span>
          </button>
        ))}
      </div>
      <label class="field">
        <span>Where the West stands</span>
        <select value={frameOk} onChange={(e) => setFrame((e.currentTarget as HTMLSelectElement).value as Frame)}>
          {op.frames.map((f) => <option key={f} value={f}>{content.registry.frames[f]!.label}</option>)}
        </select>
      </label>
      <p class="muted">{content.registry.frames[frameOk]!.summary}</p>
      {sovereigns.length > 1 && (
        <label class="field">
          <span>Who rules it</span>
          <select value={sov} onChange={(e) => setSovereign((e.currentTarget as HTMLSelectElement).value)}>
            {sovereigns.map((id) => <option key={id} value={id}>{styleOf(id)}</option>)}
          </select>
        </label>
      )}
      <label class="field">
        <span>The founder's name</span>
        <input value={name} onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} />
      </label>
      <label class="field">
        <span>The founder is</span>
        <select value={sex} onChange={(e) => setSex((e.currentTarget as HTMLSelectElement).value as Sex)}>
          <option value="male">a man</option>
          <option value="female">a woman</option>
        </select>
      </label>
      {error && <p class="error">{error}</p>}
      <button class="btn primary wide" onClick={begin}>Begin</button>
    </main>
  );
}

function Play({ content, state, onChoose, onRestart }: { content: ContentBundle; state: HouseState; onChoose: (id: string) => void; onRestart: () => void }) {
  const v = useMemo(() => view(content, state), [content, state]);
  const pages = v.text.split(/\n\s*\[break\]\s*\n/);
  const [page, setPage] = useState(0);
  const last = page >= pages.length - 1;
  return (
    <main class="scene">
      <p class="date">{v.date}</p>
      {v.title && <h2>{v.title}</h2>}
      {v.outcome?.text && <div class="outcome"><p>{v.outcome.text}</p></div>}
      <div class="story">{pages.slice(0, page + 1).join('\n\n').split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
      {!last && <button class="btn wide" onClick={() => setPage(page + 1)}>Continue</button>}
      {last && !v.ended && (
        <div class="choices">
          {v.choices.filter((c) => c.available).map((c) => (
            <button key={c.id} class="btn wide" onClick={() => { setPage(0); onChoose(c.id); }}><span class="choice-text">{c.text}</span></button>
          ))}
        </div>
      )}
      {v.ended && <div class="ending"><p><strong>{content.registry.endings[v.ended.ending]?.label}</strong></p></div>}
      <button class="btn subtle" onClick={onRestart}>A new house</button>
    </main>
  );
}

export function App({ content }: { content: ContentBundle }) {
  const [state, setState] = useState<HouseState>();
  if (!state) return <NewHouse content={content} onStart={setState} />;
  return <Play content={content} state={state} onChoose={(id) => setState(choose(content, state, id).state)} onRestart={() => setState(undefined)} />;
}
