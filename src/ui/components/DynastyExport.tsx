import { useEffect, useState } from 'preact/hooks';
import type { ContentBundle } from '../../content/schema';
import type { GameState } from '../../game/state';
import { toDynasty, encodeDynasty } from '../../game/dynasty';

/** The house this life leaves behind, as copyable text for a sequel to read (docs/DESIGN.md, "Dynasty export"). */
export function DynastyExport({ state, content }: { state: GameState; content: ContentBundle }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState('');
  useEffect(() => {
    if (!open) return;
    let live = true;
    encodeDynasty(toDynasty(state, content)).then((c) => live && setCode(c), () => live && setCode(JSON.stringify(toDynasty(state, content))));
    return () => { live = false; };
  }, [open, state, content]);
  const d = toDynasty(state, content);
  const living = d.heirs.filter((h) => h.alive);
  const copy = (e: Event) => {
    const area = (e.currentTarget as HTMLElement).parentElement?.querySelector('textarea');
    navigator.clipboard?.writeText(code).then(
      () => setCopied('Copied. Keep it somewhere safe: the next story will ask for it.'),
      () => { area?.select(); setCopied('Your browser blocked copying. The text is selected: copy it by hand.'); },
    ) ?? (area?.select(), setCopied('The text is selected: copy it by hand.'));
  };
  return (
    <div class="dynasty">
      <p class="muted">
        Your house: {living.length ? `${living.map((h) => `${h.name} (${h.age})`).join(', ')}` : 'no living children'}
        {d.lands.holdings.length || d.lands.manor ? `; ${(d.lands.manor ? 1 : 0) + d.lands.holdings.length} holdings` : ''}
        {d.realm.reigns ? '; a crown' : ''}.
      </p>
      <button class="btn" onClick={() => setOpen(!open)}>Export your house</button>
      {open && (
        <div class="savecode-box">
          <label for="dynasty-out">Your house as text: your children, lands, people and choices, ready for the next story. It is not a save; it cannot reopen this life.</label>
          <textarea id="dynasty-out" readOnly rows={4} value={code || 'Preparing...'} onFocus={(e) => (e.currentTarget as HTMLTextAreaElement).select()} />
          <button class="btn primary" disabled={!code} onClick={copy}>Copy</button>
          {copied && <p class="fineprint">{copied}</p>}
        </div>
      )}
    </div>
  );
}
