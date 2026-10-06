import { render } from 'preact';
import { App } from './ui/App';
import bundle from './content/bundle.json';
import type { ContentBundle } from './content/schema';
import './game/module'; // the rules the bundle is played by
// one look for both games: Knight of Adalia's stylesheet
import '../../knight/src/ui/styles.css';

render(<App content={bundle as unknown as ContentBundle} />, document.getElementById('app')!);
