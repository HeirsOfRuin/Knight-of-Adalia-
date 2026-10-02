import { useState } from 'preact/hooks';
import type { ContentBundle } from '../../content/schema';
import type { GameState } from '../../engine/state';
import { view, describeDate } from '../../engine/index';
import type { CheckResult } from '../../engine/checks';
import { capitalise } from '../../engine/format';
import { ageOf } from '../../engine/calendar';
import { exportSave } from '../storage';
import { ConfirmButton } from './Confirm';
import { SaveCode } from './SaveCode';
import { StatusPanel } from './StatusPanel';
import { Journal } from './Journal';
import { PeoplePanel, WorldPanel } from './Codex';
import { DebugDrawer } from './DebugDrawer';

interface Props {
  content: ContentBundle;
  state: GameState;
  debug: boolean;
  notice: string[];
  error?: string;
  saveOk: boolean;
  onChoose: (id: string, force?: CheckResult) => void;
  onReplace: (s: GameState) => void;
  history: GameState[];
  onRewind: (index: number) => void;
  onImport: (f: File) => void;
  onImportText: (t: string) => void;
  onNewGame: () => void;
  onToggleDebug: () => void;
  onDismissNotice: () => void;
}

type Panel = 'none' | 'status' | 'people' | 'world' | 'journal' | 'menu';

function Paragraphs({ text }: { text: string }) {
  return <>{text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p.replace(/\n/g, ' ')}</p>)}</>;
}

export function GameScreen(p: Props) {
  const { content, state } = p;
  const [panel, setPanel] = useState<Panel>('none');
  const [force, setForce] = useState<CheckResult | undefined>();
  const v = view(content, state);
  // A scene can be split into pages with a [break] line; the player reads them with Continue.
  const pages = v.text.split(/\n\s*\[break\]\s*(?:\n|$)/).map((t) => t.trim()).filter(Boolean);
  const pageKey = `${v.sceneId}@${state.time}@${state.journal.length}`;
  const [pageState, setPageState] = useState({ key: pageKey, n: 1 });
  const shown = pageState.key === pageKey ? pageState.n : 1;
  const morePages = shown < pages.length;
  const nextPage = () => setPageState({ key: pageKey, n: shown + 1 });
  const toggle = (x: Panel) => setPanel((cur) => (cur === x ? 'none' : x));
  const ending = v.ended ? content.registry.endings[v.ended.ending] : undefined;

  return (
    <div class={`game ${p.debug ? 'has-debug' : ''}`}>
      <header class="topbar">
        <div class="topbar-info">
          <span class="who">{state.name}</span>
          <span class="when">{capitalise(state.station)} &middot; age {ageOf(state)}</span>
        </div>
        <nav class="topbar-nav">
          <button class={`tab ${panel === 'status' ? 'on' : ''}`} aria-expanded={panel === 'status'} onClick={() => toggle('status')}>Status</button>
          <button class={`tab ${panel === 'people' ? 'on' : ''}`} aria-expanded={panel === 'people'} onClick={() => toggle('people')}>People</button>
          <button class={`tab ${panel === 'world' ? 'on' : ''}`} aria-expanded={panel === 'world'} onClick={() => toggle('world')}>World</button>
          <button class={`tab ${panel === 'journal' ? 'on' : ''}`} aria-expanded={panel === 'journal'} onClick={() => toggle('journal')}>Journal</button>
          <button class={`tab ${panel === 'menu' ? 'on' : ''}`} aria-expanded={panel === 'menu'} onClick={() => toggle('menu')}>Menu</button>
        </nav>
      </header>

      <div class="layout">
        <main class="story" aria-live="polite">
          {p.notice.length > 0 && (
            <div class="notice" role="status">
              {p.notice.map((n, i) => <p key={i}>{n}</p>)}
              <button class="link" onClick={p.onDismissNotice}>Dismiss</button>
            </div>
          )}
          {!p.saveOk && <p class="notice">Autosave is unavailable in this browser. Export your save from the Menu to keep progress.</p>}

          {v.outcome && (v.outcome.text || v.outcome.changes.length > 0) && (
            <section class="outcome">
              {v.outcome.check && <p class={`check-result ${v.outcome.check.result}`}>{capitalise(v.outcome.check.result)}</p>}
              {v.outcome.text && <Paragraphs text={v.outcome.text} />}
              {v.outcome.changes.length > 0 && (
                <ul class="changes">{v.outcome.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
              )}
            </section>
          )}

          <article class="scene">
            {v.dateChanged && <p class="date">{describeDate(state, content)}</p>}
            {v.title && <h1>{v.title}</h1>}
            {v.cause && (
              <p class="cause">This follows from {describeDate({ ...state, time: v.cause.at }, content).toLowerCase()}: <em>{v.cause.text}</em></p>
            )}
            {pages.slice(0, shown).map((t, i) => <Paragraphs key={i} text={t} />)}
          </article>

          {morePages ? (
            <section class="choices">
              <button class="choice continue" onClick={nextPage}><span class="choice-text">Continue</span></button>
            </section>
          ) : v.ended ? (
            <section class="ending">
              <h2>{ending?.label ?? v.ended.ending}</h2>
              {v.ended.cause && <p>{v.ended.cause}</p>}
              {ending && <p class="muted">{ending.description}</p>}
              <button class="btn primary wide" onClick={p.onNewGame}>Begin another life</button>
            </section>
          ) : (
            <section class="choices">
              {v.choices.map((c) => (
                <button
                  key={c.id}
                  class={`choice ${c.available ? '' : 'locked'} ${c.lethal ? 'lethal' : ''}`}
                  disabled={!c.available}
                  onClick={() => { p.onChoose(c.id, force); setForce(undefined); }}
                >
                  <span class="choice-text">{c.text}</span>
                  {(c.band || c.lockReason || c.lethal) && (
                    <span class="choice-meta">
                      {c.lethal && <span class="tag danger">Mortal danger</span>}
                      {c.band && <span class={`tag band-${c.band.toLowerCase()}`}>{c.band}</span>}
                      {c.lockReason && <span class="lock">{c.lockReason}</span>}
                    </span>
                  )}
                  {c.warn && <span class="warn">{c.warn}</span>}
                </button>
              ))}
              {v.deadEnd && (
                <div class="error" role="alert">
                  <p>No choice is open to you here. This is a fault in the game's content (scene <code>{v.sceneId}</code>), not something you did.</p>
                  <p>Use the Menu to load an exported save, or open debug mode (Ctrl+Shift+D) to jump to another scene.</p>
                </div>
              )}
            </section>
          )}
          {p.error && <p class="error" role="alert">{p.error}</p>}
        </main>

        {panel !== 'none' && (
          <aside class="panel" aria-label={panel}>
            <button class="panel-close link" onClick={() => setPanel('none')}>Close</button>
            {panel === 'status' && <StatusPanel content={content} state={state} />}
            {panel === 'people' && <PeoplePanel content={content} state={state} />}
            {panel === 'world' && <WorldPanel content={content} state={state} />}
            {panel === 'journal' && <Journal content={content} state={state} />}
            {panel === 'menu' && (
              <div class="menu">
                <h2>Menu</h2>
                <p class="muted">The game saves itself after every choice, in this browser only.</p>
                <button class="btn wide" onClick={() => exportSave(state, content)}>Download save file</button>
                <p class="fineprint">If the download does nothing (some hosted pages block downloads), use Save as text instead.</p>
                <label class="btn wide file-btn">
                  Import save file
                  <input type="file" accept="application/json,.json" onChange={(e) => {
                    const f = (e.currentTarget as HTMLInputElement).files?.[0];
                    if (f) p.onImport(f);
                  }} />
                </label>
                <SaveCode state={state} content={content} onLoadText={p.onImportText} />
                <ConfirmButton class="btn wide" question="Start a new life? This one stays in the autosave until you make your first choice in the new one." confirmLabel="Start a new life" onConfirm={p.onNewGame}>New life</ConfirmButton>
                <button class="btn wide subtle" onClick={p.onToggleDebug}>{p.debug ? 'Hide' : 'Show'} debug tools</button>
                <p class="fineprint">Seed {state.seed} &middot; content {content.hash}</p>
              </div>
            )}
          </aside>
        )}
      </div>

      {p.debug && <DebugDrawer content={content} state={state} force={force} setForce={setForce} onReplace={p.onReplace} history={p.history} onRewind={p.onRewind} />}
    </div>
  );
}
