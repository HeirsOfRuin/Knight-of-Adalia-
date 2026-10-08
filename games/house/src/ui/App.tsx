// House of Adalia, the playtest build: start a house from an opening and a frame, or from a
// Knight of Adalia dynasty code, and play the scenes there are, with autosave and playtest notes.
// The full interface (House, Ledger, Realm and Chronicle panels) comes with step 8 (PLAN.md §10).
import { useEffect, useMemo, useState } from 'preact/hooks';
import { decodeDynasty } from '@dynasty/contract';
import type { ContentBundle, Frame } from '../content/schema';
import { newGame, view, choose, checkStart, type HouseState } from '../game/index';
import { fromDynasty } from '../game/import';
import { toSave, fromSave } from '../game/save';
import { Notes } from './Notes';

type Sex = 'male' | 'female';

function NewHouse({ content, onStart }: { content: ContentBundle; onStart: (s: HouseState) => void }) {
  const openings = Object.values(content.openings);
  const [opening, setOpening] = useState(content.openings.founder ? 'founder' : openings[0]!.id);
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
      <p class="muted">A playtest build of the sequel. The prologue is written for <strong>Founder of a House</strong>, in a free or an Adalian West; the other openings stop after their first scene. Your place is saved in this browser as you play.</p>

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

const SAVE_KEY = 'house-of-adalia/playtest-save';
function loadSaved(content: ContentBundle): HouseState | undefined {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? fromSave(JSON.parse(raw), content).state : undefined;
  } catch { return undefined; }
}
function storeSaved(content: ContentBundle, s: HouseState | undefined) {
  try {
    if (s) localStorage.setItem(SAVE_KEY, JSON.stringify(toSave(s, content)));
    else localStorage.removeItem(SAVE_KEY);
  } catch { /* storage unavailable: play on without autosave */ }
}

function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</>;
}

function Play({ content, state, onChoose, onRestart }: { content: ContentBundle; state: HouseState; onChoose: (id: string) => void; onRestart: () => void }) {
  const v = useMemo(() => view(content, state), [content, state]);
  const pages = v.text.split(/\n\s*\[break\]\s*\n/);
  const [page, setPage] = useState(0);
  const [cardSeen, setCardSeen] = useState<string>();
  useEffect(() => { setPage(0); window.scrollTo?.(0, 0); }, [v.sceneId, state.time, state.journal.length]);
  const onCard = !!v.card && cardSeen !== v.sceneId;
  const last = page >= pages.length - 1;
  const ending = v.ended ? content.registry.endings[v.ended.ending] : undefined;
  return (
    <div class="layout">
    <main class="story">
      {v.outcome && (v.outcome.text || v.outcome.changes.length > 0) && (
        <section class="outcome">
          {v.outcome.check && <p class={`check-result ${v.outcome.check.result}`}>{v.outcome.check.result[0]!.toUpperCase() + v.outcome.check.result.slice(1)}</p>}
          {v.outcome.text && <Paragraphs text={v.outcome.text} />}
          {v.outcome.changes.length > 0 && <ul class="changes">{v.outcome.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>}
        </section>
      )}
      {onCard && v.card ? (
        <article class="card">
          <p class="card-title">{v.card.title}</p>
          {v.card.subtitle && <h1 class="card-subtitle">{v.card.subtitle}</h1>}
          {v.card.epigraph && <p class="card-epigraph">{v.card.epigraph}</p>}
          <section class="choices">
            <button class="choice continue" onClick={() => setCardSeen(v.sceneId)}><span class="choice-text">Continue</span></button>
          </section>
        </article>
      ) : (
        <>
          <article class="scene">
            <p class="date">{v.date}</p>
            {v.title && <h1>{v.title}</h1>}
            {pages.slice(0, page + 1).map((t, i) => <Paragraphs key={i} text={t} />)}
          </article>
          {!last ? (
            <section class="choices">
              <button class="choice continue" onClick={() => setPage(page + 1)}><span class="choice-text">Continue</span></button>
            </section>
          ) : v.ended ? (
            <section class="ending">
              <h2>{ending?.label ?? v.ended.ending}</h2>
              {ending && <p class="muted">{ending.description}</p>}
            </section>
          ) : (
            <section class="choices">
              {v.choices.map((c) => (
                <button key={c.id} class={`choice ${c.available ? '' : 'locked'}`} disabled={!c.available} onClick={() => onChoose(c.id)}>
                  <span class="choice-text">{c.text}</span>
                  {(c.band || c.lockReason) && (
                    <span class="choice-meta">
                      {c.band && <span class={`tag band-${c.band.toLowerCase()}`}>{c.band}</span>}
                      {c.lockReason && <span class="lock">{c.lockReason}</span>}
                    </span>
                  )}
                  {c.warn && <span class="warn">{c.warn}</span>}
                </button>
              ))}
              {v.deadEnd && <p class="error" role="alert">No choice is open here. That is a fault in the content (scene {v.sceneId}); please note it.</p>}
            </section>
          )}
        </>
      )}
      <Notes content={content} state={state} sceneId={v.sceneId} title={v.title ?? v.sceneId} date={v.date} />
      <button class="btn subtle wide" onClick={onRestart}>Start a new house</button>
    </main>
    </div>
  );
}

export function App({ content }: { content: ContentBundle }) {
  const [state, setState] = useState<HouseState | undefined>(() => loadSaved(content));
  const update = (s: HouseState | undefined) => { storeSaved(content, s); setState(s); };
  if (!state) return <NewHouse content={content} onStart={update} />;
  return <Play content={content} state={state} onChoose={(id) => update(choose(content, state, id).state)} onRestart={() => update(undefined)} />;
}
