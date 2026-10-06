// Compiles /content into src/content/bundle.json for the browser build.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, ContentError } from './content-loader';

try {
  const bundle = loadContent();
  const out = join(import.meta.dirname, '..', 'src', 'content', 'bundle.json');
  writeFileSync(out, JSON.stringify(bundle));
  console.log(`content: ${Object.keys(bundle.scenes).length} scenes, ${Object.keys(bundle.backgrounds).length} backgrounds, hash ${bundle.hash}`);
} catch (e) {
  if (e instanceof ContentError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
