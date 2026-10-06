// CLI: npm run house:validate
import { loadContent, ContentError } from './content-loader';
import { validate } from './validate-lib';

try {
  const content = loadContent();
  const issues = validate(content);
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  for (const i of errors) console.log(`ERROR   ${i.where}: ${i.message}`);
  for (const i of warnings) console.log(`warning ${i.where}: ${i.message}`);
  console.log(`\n${Object.keys(content.scenes).length} scenes, ${Object.keys(content.openings).length} openings, ${errors.length} errors, ${warnings.length} warnings`);
  process.exit(errors.length ? 1 : 0);
} catch (e) {
  if (e instanceof ContentError) { console.error(e.message); process.exit(1); }
  throw e;
}
