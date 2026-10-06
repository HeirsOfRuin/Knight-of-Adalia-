import { heroOf } from '@engine/character';
import { useEffect, useState } from 'preact/hooks';
import type { ContentBundle } from '../content/schema';
import type { GameState } from '../game/state';
import { newGame, choose, type NewGameOptions } from '../game/index';
import type { CheckResult } from '@engine/checks';
import { readAutosave, writeAutosave, clearAutosave, importSave, importSaveText } from './storage';
import { ConfirmButton } from './components/Confirm';
import { NewGame } from './components/NewGame';
import { GameScreen } from './components/GameScreen';

type Screen = 'title' | 'new' | 'game';

function initialDebug(): boolean {
  try {
    return new URLSearchParams(location.search).has('debug');
  } catch {
    return false;
  }
}

export function App({ content }: { content: ContentBundle }) {
  const [screen, setScreen] = useState<Screen>('title');
  const [state, setState] = useState<GameState | undefined>();
  const [notice, setNotice] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [debug, setDebug] = useState(initialDebug);
  const [saveOk, setSaveOk] = useState(true);
  const [autosave] = useState(() => readAutosave(content));
  // states before each choice this session, newest last, for the debug rewind
  const [history, setHistory] = useState<GameState[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDebug((d) => !d);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const update = (s: GameState) => {
    setState(s);
    setSaveOk(writeAutosave(s, content));
  };

  const start = (opts: NewGameOptions) => {
    update(newGame(content, opts));
    setHistory([]);
    setNotice([]);
    setScreen('game');
  };

  const onChoose = (id: string, force?: CheckResult) => {
    if (!state) return;
    try {
      const next = choose(content, state, id, { force }).state;
      if (next.scene !== state.scene || next.time !== state.time) setHistory((h) => [...h.slice(-299), state]);
      update(next);
      setError(undefined);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onImportText = async (text: string) => {
    try {
      const r = await importSaveText(text.trim(), content);
      update(r.state);
      setNotice(r.warnings);
      setError(undefined);
      setScreen('game');
    } catch (e) {
      setError(`That text is not a save this game can read: ${(e as Error).message}`);
    }
  };

  const onImport = async (file: File) => {
    try {
      const r = await importSave(file, content);
      update(r.state);
      setNotice(r.warnings);
      setScreen('game');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (screen === 'game' && state) {
    return (
      <GameScreen
        content={content}
        state={state}
        debug={debug}
        notice={notice}
        error={error}
        saveOk={saveOk}
        onChoose={onChoose}
        onReplace={update}
        history={history}
        onRewind={(i) => { update(history[i]!); setHistory(history.slice(0, i)); }}
        onImport={onImport}
        onImportText={onImportText}
        onNewGame={() => setScreen('new')}
        onToggleDebug={() => setDebug((d) => !d)}
        onDismissNotice={() => setNotice([])}
      />
    );
  }

  if (screen === 'new') {
    return <NewGame content={content} debug={debug} onStart={start} onBack={() => setScreen('title')} />;
  }

  return (
    <main class="title-screen">
      <h1>{content.config.title}</h1>
      <p class="tagline">A commoner's life, from the stable yard to whatever he can take.</p>
      <div class="title-actions">
        {autosave && (
          <button
            class="btn primary"
            onClick={() => {
              update(autosave.state);
              setNotice(autosave.warnings);
              setScreen('game');
            }}
          >
            Continue: {heroOf(autosave.state).name}, {content.backgrounds[autosave.state.background]?.label}
          </button>
        )}
        <button class={`btn ${autosave ? '' : 'primary'}`} onClick={() => setScreen('new')}>New life</button>
        <label class="btn file-btn">
          Import save
          <input type="file" accept="application/json,.json" onChange={(e) => {
            const f = (e.currentTarget as HTMLInputElement).files?.[0];
            if (f) void onImport(f);
          }} />
        </label>
        {autosave && (
          <ConfirmButton class="btn subtle" question="Delete the autosaved life? This cannot be undone." confirmLabel="Delete it" onConfirm={() => { clearAutosave(); location.reload(); }}>
            Delete autosave
          </ConfirmButton>
        )}
      </div>
      <details class="advanced">
        <summary>Load a life from saved text</summary>
        <PasteLoad onLoad={onImportText} />
      </details>
      {error && <p class="error" role="alert">{error}</p>}
      <p class="fineprint">Saves stay in this browser. Export a save file to keep it safe or move it.</p>
    </main>
  );
}

function PasteLoad({ onLoad }: { onLoad: (t: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div class="savecode-box">
      <label for="title-save-in">Paste the text you kept from "Save as text".</label>
      <textarea id="title-save-in" rows={4} value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} />
      <button class="btn primary" disabled={!text.trim()} onClick={() => onLoad(text)}>Load this life</button>
    </div>
  );
}
