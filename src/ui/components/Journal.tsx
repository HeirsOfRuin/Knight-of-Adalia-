import type { ContentBundle } from '../../content/schema';
import type { GameState } from '../../engine/state';
import { describeDate } from '../../engine/calendar';

export function Journal({ content, state }: { content: ContentBundle; state: GameState }) {
  const entries = [...state.journal].reverse();
  const when = (t: number) => describeDate({ ...state, time: t }, content);
  return (
    <div class="journal">
      <h2>Journal</h2>
      {entries.length === 0 && <p class="muted">Nothing recorded yet. Each choice you make, and what came of it, will be written here.</p>}
      <ol class="journal-list">
        {entries.map((e, i) => (
          <li key={i}>
            <p class="date">{when(e.at)}{e.sceneTitle ? ` · ${e.sceneTitle}` : ''}</p>
            {e.cause && <p class="cause">Because of {when(e.cause.at).toLowerCase()}: <em>{e.cause.text}</em></p>}
            <p><strong>{e.choice}</strong></p>
            {e.outcome && <p>{e.outcome}</p>}
            {e.changes.length > 0 && <ul class="changes">{e.changes.map((c, j) => <li key={j}>{c}</li>)}</ul>}
          </li>
        ))}
      </ol>
    </div>
  );
}
