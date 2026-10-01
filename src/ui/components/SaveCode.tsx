import { useState } from 'preact/hooks';
import type { ContentBundle } from '../../content/schema';
import type { GameState } from '../../engine/state';
import { toSave } from '../../engine/save';

/** Save as copyable text. Works where file downloads are blocked. */
export function SaveCode({ state, content, onLoadText }: { state: GameState; content: ContentBundle; onLoadText: (text: string) => void }) {
  const [mode, setMode] = useState<'none' | 'copy' | 'paste'>('none');
  const [pasted, setPasted] = useState('');
  const [copied, setCopied] = useState('');
  const code = mode === 'copy' ? JSON.stringify(toSave(state, content)) : '';
  const copy = (e: Event) => {
    const area = (e.currentTarget as HTMLElement).parentElement?.querySelector('textarea');
    navigator.clipboard?.writeText(code).then(
      () => setCopied('Copied. Paste it somewhere safe, such as a note or an email to yourself.'),
      () => { area?.select(); setCopied('Your browser blocked copying. The text is selected: copy it by hand.'); },
    ) ?? (area?.select(), setCopied('The text is selected: copy it by hand.'));
  };
  return (
    <div class="savecode">
      <div class="confirm-row">
        <button class="btn" onClick={() => { setMode(mode === 'copy' ? 'none' : 'copy'); setCopied(''); }}>Save as text</button>
        <button class="btn" onClick={() => setMode(mode === 'paste' ? 'none' : 'paste')}>Load from text</button>
      </div>
      {mode === 'copy' && (
        <div class="savecode-box">
          <label for="save-code-out">Your save. Keep this text to restore this life later, on any device.</label>
          <textarea id="save-code-out" readOnly rows={4} value={code} onFocus={(e) => (e.currentTarget as HTMLTextAreaElement).select()} />
          <button class="btn primary" onClick={copy}>Copy</button>
          {copied && <p class="fineprint">{copied}</p>}
        </div>
      )}
      {mode === 'paste' && (
        <div class="savecode-box">
          <label for="save-code-in">Paste a saved text here.</label>
          <textarea id="save-code-in" rows={4} value={pasted} onInput={(e) => setPasted((e.currentTarget as HTMLTextAreaElement).value)} />
          <button class="btn primary" disabled={!pasted.trim()} onClick={() => onLoadText(pasted)}>Load this life</button>
        </div>
      )}
    </div>
  );
}
