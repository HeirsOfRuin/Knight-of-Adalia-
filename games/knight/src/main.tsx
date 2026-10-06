import { render } from 'preact';
import { App } from './ui/App';
import bundle from './content/bundle.json';
import type { ContentBundle } from './content/schema';
import './game/module'; // the rules the bundle is played by
import { registerPwa } from './pwa';
import './ui/styles.css';

render(<App content={bundle as unknown as ContentBundle} />, document.getElementById('app')!);
registerPwa();
