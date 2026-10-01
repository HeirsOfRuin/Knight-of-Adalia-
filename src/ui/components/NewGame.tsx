import { useState } from 'preact/hooks';
import type { ContentBundle } from '../../content/schema';
import type { NewGameOptions } from '../../engine/index';
import { randomSeed } from '../storage';

const DEFAULT_NAMES = ['Hal', 'Will', 'Robin', 'Jack', 'Tom', 'Hob', 'Simkin', 'Geoff', 'Rafe', 'Kit'];

export function NewGame(props: { content: ContentBundle; debug: boolean; onStart: (o: NewGameOptions) => void; onBack: () => void }) {
  const { content } = props;
  const bgs = Object.values(content.backgrounds);
  const [seed, setSeed] = useState(randomSeed);
  const [name, setName] = useState(() => DEFAULT_NAMES[seed % DEFAULT_NAMES.length]!);
  const [bg, setBg] = useState<string | undefined>();
  const [role, setRole] = useState<string>('');

  const chosen = bg ? content.backgrounds[bg] : undefined;
  const roles = Object.entries(chosen?.roles ?? {});

  const random = () => {
    const pick = bgs[Math.floor(Math.random() * bgs.length)]!;
    setBg(pick.id);
    setRole('');
  };

  return (
    <main class="newgame">
      <button class="link" onClick={props.onBack}>&larr; Back</button>
      <h1>A new life</h1>

      <label class="field">
        <span>His name</span>
        <input value={name} maxLength={24} onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)} />
      </label>

      <h2>Born to</h2>
      <div class="bg-list" role="radiogroup">
        {bgs.map((b) => (
          <button
            key={b.id}
            role="radio"
            aria-checked={bg === b.id}
            class={`bg-card ${bg === b.id ? 'selected' : ''}`}
            onClick={() => { setBg(b.id); setRole(''); }}
          >
            <strong>{b.label}</strong>
            <span class="bg-summary">{b.summary}</span>
            <span class="bg-line"><em>Asset.</em> {b.asset}</span>
            <span class="bg-line"><em>Liability.</em> {b.liability}</span>
          </button>
        ))}
      </div>
      <button class="btn subtle" onClick={random}>Choose for me</button>

      {roles.length > 0 && (
        <label class="field">
          <span>His work in the household</span>
          <select value={role} onChange={(e) => setRole((e.currentTarget as HTMLSelectElement).value)}>
            <option value="">Let fate decide</option>
            {roles.map(([id, r]) => <option key={id} value={id}>{r.label}</option>)}
          </select>
        </label>
      )}

      <details class="advanced" open={props.debug}>
        <summary>Seed</summary>
        <label class="field">
          <span>The same seed and the same choices give the same life.</span>
          <input type="number" value={seed} onInput={(e) => setSeed(Number((e.currentTarget as HTMLInputElement).value) >>> 0)} />
        </label>
      </details>

      <button
        class="btn primary wide"
        disabled={!bg}
        onClick={() => props.onStart({ background: bg!, seed, name, role: role || undefined })}
      >
        {bg ? 'Begin' : 'Choose a background to begin'}
      </button>
    </main>
  );
}
