import { useState } from 'preact/hooks';
import type { ContentBundle } from '../../content/schema';
import type { GameState } from '../../engine/state';
import type { CheckResult } from '../../engine/checks';
import { computeOdds } from '../../engine/checks';
import { enterScene } from '../../engine/director';
import { visibleChoices } from '../../engine/index';

interface Props {
  content: ContentBundle;
  state: GameState;
  force?: CheckResult;
  setForce: (f?: CheckResult) => void;
  onReplace: (s: GameState) => void;
  history: GameState[];
  onRewind: (index: number) => void;
}

export function DebugDrawer({ content, state, force, setForce, onReplace, history, onRewind }: Props) {
  const [open, setOpen] = useState(true);
  const [jump, setJump] = useState(state.scene);
  const [rewind, setRewind] = useState(-1);
  const [filter, setFilter] = useState('');
  const scene = content.scenes[state.scene];

  const toggleFlag = (f: string) => {
    const s = structuredClone(state);
    if (s.flags[f]) delete s.flags[f];
    else s.flags[f] = true;
    onReplace(s);
  };
  const doJump = () => {
    const target = content.scenes[jump];
    if (!target) return;
    const s = structuredClone(state);
    s.returnStack = [];
    s.ended = undefined;
    s.lastOutcome = { text: `[debug] jumped to ${jump}`, changes: [] };
    enterScene(s, content, target, []);
    onReplace(s);
  };

  return (
    <section class={`debug ${open ? 'open' : ''}`} aria-label="Debug">
      <button class="debug-toggle" onClick={() => setOpen(!open)}>Debug {open ? '▾' : '▴'}</button>
      {open && (
        <div class="debug-body">
          <p>
            Scene <code>{state.scene}</code> ({scene?.kind}, {state.chapter}) &middot; seed <code>{state.seed}</code> &middot; t={state.time}
            {state.returnStack.length > 0 && <> &middot; return stack <code>{state.returnStack.join(' < ')}</code></>}
          </p>

          <fieldset>
            <legend>Force next check</legend>
            {(['none', 'success', 'partial', 'failure'] as const).map((f) => (
              <label key={f} class="radio">
                <input type="radio" name="force" checked={(force ?? 'none') === f} onChange={() => setForce(f === 'none' ? undefined : f)} /> {f}
              </label>
            ))}
          </fieldset>

          <h3>Choices (raw odds)</h3>
          <ul class="plain">
            {visibleChoices(content, state).map((c) => {
              const o = c.check ? computeOdds(c.check, state, content) : undefined;
              return (
                <li key={c.id}>
                  <code>{c.id}</code>
                  {o && <> success {(o.success * 100).toFixed(0)}%, partial {(o.partial * 100).toFixed(0)}% ({o.breakdown.map((b) => `${b.label} ${b.value}`).join(', ')})</>}
                </li>
              );
            })}
          </ul>

          <h3>Rewind</h3>
          <p class="muted">Goes back to a scene you passed this session, as you were when you reached it. Everything since is undone.</p>
          {history.length === 0 ? <p class="muted">Nothing to rewind to yet.</p> : (
            <div class="row">
              <select value={rewind} onChange={(e) => setRewind(Number((e.currentTarget as HTMLSelectElement).value))}>
                <option value={-1}>Choose a scene</option>
                {history.map((h, i) => <option key={i} value={i}>{content.scenes[h.scene]?.title ?? h.scene} ({h.scene})</option>).reverse()}
              </select>
              <button class="btn" disabled={rewind < 0} onClick={() => { onRewind(rewind); setRewind(-1); }}>Rewind</button>
            </div>
          )}

          <h3>Jump to scene</h3>
          <p class="muted">Keeps everything you have now, including followers and flags. To redo a choice, use Rewind.</p>
          <div class="row">
            <select value={jump} onChange={(e) => setJump((e.currentTarget as HTMLSelectElement).value)}>
              {Object.values(content.scenes).map((s) => <option key={s.id} value={s.id}>{s.chapter} / {s.id} ({s.kind})</option>)}
            </select>
            <button class="btn" onClick={doJump}>Go</button>
          </div>

          <h3>Flags</h3>
          <input placeholder="filter" value={filter} onInput={(e) => setFilter((e.currentTarget as HTMLInputElement).value)} />
          <ul class="plain flags">
            {Object.entries(content.registry.flags)
              .filter(([id]) => id.includes(filter))
              .map(([id, f]) => (
                <li key={id}>
                  <label><input type="checkbox" checked={!!state.flags[id]} onChange={() => toggleFlag(id)} /> <code>{id}</code> <span class="muted">{f.description}</span></label>
                </li>
              ))}
          </ul>

          <h3>Queue</h3>
          {state.queue.length === 0 ? <p class="muted">Nothing queued.</p> : (
            <ul class="plain">{state.queue.map((q, i) => <li key={i}><code>{q.event}</code> due t={q.dueAt} from {q.origin.scene}/{q.origin.choice}</li>)}</ul>
          )}

          <h3>State</h3>
          <details>
            <summary>Full state JSON</summary>
            <pre>{JSON.stringify({ ...state, journal: `[${state.journal.length} entries]` }, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}
