import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

/** A button that asks for confirmation in place. Browser dialogs are unavailable in embedded frames. */
export function ConfirmButton(props: { class?: string; question: string; confirmLabel: string; onConfirm: () => void; children: ComponentChildren }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button class={props.class} onClick={() => setAsking(true)}>{props.children}</button>;
  return (
    <div class="confirm" role="group" aria-label={props.question}>
      <p>{props.question}</p>
      <div class="confirm-row">
        <button class="btn primary" onClick={() => { setAsking(false); props.onConfirm(); }}>{props.confirmLabel}</button>
        <button class="btn" onClick={() => setAsking(false)}>Cancel</button>
      </div>
    </div>
  );
}
