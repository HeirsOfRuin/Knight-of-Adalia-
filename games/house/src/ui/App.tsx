// House of Adalia, the playtest build: start a house from an opening and a frame, or from a
// Knight of Adalia dynasty code, and play the scenes there are, with autosave and playtest notes.
// The full interface (House, Ledger, Realm and Chronicle panels) comes with step 8 (PLAN.md §10).
import { useEffect, useMemo, useState } from 'preact/hooks';
import { decodeDynasty } from '@dynasty/contract';
import type { ContentBundle, Frame } from '../content/schema';
import { view, choose, checkStart, describeDate, type HouseState } from '../game/index';
import { questionsFor, settleAnswers, newGameFromSetup, labelOf, type SetupStart } from '../game/setup';
import { fromDynasty } from '../game/import';
import { toSave, fromSave } from '../game/save';
import { Notes } from './Notes';
import { StatusPanel, HousePanel, PeoplePanel, WorldPanel, Journal } from './Panels';
import { heroOf, ageOfCharacter } from '@engine/character';
import { capitalise } from '@engine/format';
import { forceOf } from '@engine/paths';

type Panel = 'none' | 'status' | 'house' | 'people' | 'world' | 'journal';
const TABS: [Panel, string][] = [['status', 'Status'], ['house', 'House'], ['people', 'People'], ['world', 'World'], ['journal', 'Journal']];

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
  // one seed for the form, so the family the answers draw stays the same while the player changes them
  const [formSeed] = useState(seed);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const start: SetupStart = { opening, frame: frameOk, sovereign: sov, name, sex, seed: formSeed };
  const answers = settleAnswers(content, start, raw);
  const questions = questionsFor(content, start, answers);

  const begin = () => {
    try {
      checkStart(content, opening, frameOk, sov);
      onStart(newGameFromSetup(content, start, answers));
    } catch (e) { setError((e as Error).message); }
  };
  const importCode = async () => {
    try {
      // the form's frame and sovereign stand in only for a life whose West was never settled
      onStart(fromDynasty(content, await decodeDynasty(code), { seed: seed(), frame: frameOk, sovereign: sov }));
    } catch (e) { setError((e as Error).message); }
  };
  const styleOf = (id: string) => content.registry.sovereigns[id]?.style.replace(/\[if[^\]]*\]Queen\[else\]King\[\/if\] \{name\}/, 'Yourself') ?? id;

  return (
    <main class="newgame">
      <h1>House of Adalia</h1>
      <p class="muted">A playtest build of the sequel. The prologue and Book One, Act I are written for <strong>Founder of a House</strong> (a free or an Adalian West) and for <strong>Crowned</strong> married to Mahaut; the other openings stop after their first scene. Your place is saved in this browser as you play.</p>

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
      <h2>Your life before</h2>
      <p class="muted">What Knight of Adalia would have settled. Each has a default; change what you like.</p>
      {questions.map((q) => (
        <fieldset key={q.id} class="setup-q">
          <legend>{q.question}</legend>
          <div class="bg-list" role="radiogroup" aria-label={q.question}>
            {q.options.map((o) => (
              <button key={o.id} role="radio" aria-checked={answers[q.id] === o.id} class={`bg-card ${answers[q.id] === o.id ? 'selected' : ''}`} onClick={() => setRaw({ ...raw, [q.id]: o.id })}>
                <strong>{labelOf(o, content, start, answers)}</strong>
                <span class="bg-summary">{o.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ))}
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
  const [panel, setPanel] = useState<Panel>('none');
  const hero = heroOf(state);
  return (
    <div class="game">
    <header class="topbar">
      <div class="topbar-info">
        <span class="who">{hero.name}</span>
        <span class="when">{capitalise(hero.station.replace('_', ' '))} &middot; age {ageOfCharacter(state, hero)}{forceOf(state).total > 0 ? <> &middot; {forceOf(state).total} men</> : null}</span>
      </div>
      <nav class="topbar-nav">
        {TABS.map(([k, label]) => <button key={k} class={`tab ${panel === k ? 'on' : ''}`} aria-expanded={panel === k} onClick={() => setPanel(panel === k ? 'none' : k)}>{label}</button>)}
      </nav>
    </header>
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
          {v.card.rows.length > 0 && <dl class="card-rows">{v.card.rows.map(([k, x]) => [<dt key={`${k}t`}>{k}</dt>, <dd key={`${k}d`}>{x}</dd>])}</dl>}
          {v.card.since.length > 0 && <ul class="card-since">{v.card.since.map((x, i) => <li key={i}>{x}</li>)}</ul>}
          <section class="choices">
            <button class="choice continue" onClick={() => setCardSeen(v.sceneId)}><span class="choice-text">Continue</span></button>
          </section>
        </article>
      ) : (
        <>
          <article class="scene">
            <p class="date">{v.date}</p>
            {v.title && <h1>{v.title}</h1>}
            {v.cause && <p class="cause">This follows from {describeDate({ ...state, time: v.cause.at }, content).replace(/^\w/, (x) => x.toLowerCase())}: <em>{v.cause.text}</em></p>}
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
                <button key={c.id} class={`choice ${c.available ? '' : 'locked'} ${c.lethal ? 'lethal' : ''}`} disabled={!c.available} onClick={() => onChoose(c.id)}>
                  <span class="choice-text">{c.text}</span>
                  {(c.band || c.lockReason || c.lethal) && (
                    <span class="choice-meta">
                      {c.lethal && <span class="tag danger">Mortal danger</span>}
                      {c.band && <span class={`tag band-${c.band.toLowerCase()}`}>{c.band}</span>}
                      {c.test && <span class="test">{c.test}</span>}
                      {c.lockReason && <span class="lock">{c.lockReason}</span>}
                    </span>
                  )}
                  {c.warn && <span class="warn">{c.warn}</span>}
                  {c.stakes.length > 0 && <span class="stakes">At stake: {c.stakes.join(' · ')}</span>}
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
    {panel !== 'none' && (
      <aside class="panel" aria-label={panel}>
        <button class="panel-close link" onClick={() => setPanel('none')}>Close</button>
        {panel === 'status' && <StatusPanel content={content} state={state} />}
        {panel === 'house' && <HousePanel content={content} state={state} />}
        {panel === 'people' && <PeoplePanel content={content} state={state} />}
        {panel === 'world' && <WorldPanel content={content} state={state} />}
        {panel === 'journal' && <Journal content={content} state={state} />}
      </aside>
    )}
    </div>
    </div>
  );
}

export function App({ content }: { content: ContentBundle }) {
  const [state, setState] = useState<HouseState | undefined>(() => loadSaved(content));
  const update = (s: HouseState | undefined) => { storeSaved(content, s); setState(s); };
  if (!state) return <NewHouse content={content} onStart={update} />;
  return <Play content={content} state={state} onChoose={(id) => update(choose(content, state, id).state)} onRestart={() => update(undefined)} />;
}
