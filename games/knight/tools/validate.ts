// CLI: npm run validate
import { loadContent, ContentError } from './content-loader';
import { validate } from './validate-lib';

try {
  const content = loadContent();
  const { issues, structural } = validate(content);
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  for (const i of errors) console.log(`ERROR   ${i.where}: ${i.message}`);
  for (const i of warnings) console.log(`warning ${i.where}: ${i.message}`);
  console.log('\nStructural checks per background:');
  for (const s of structural) console.log(`  [${s.status.padEnd(7)}] ${s.background.padEnd(8)} ${s.name}: ${s.detail}`);
  const failed = structural.filter((s) => s.status === 'FAIL');
  console.log(`\n${Object.keys(content.scenes).length} scenes, ${errors.length} errors, ${warnings.length} warnings, ${failed.length} structural failures, ${structural.filter((s) => s.status === 'PENDING').length} pending`);
  process.exit(errors.length || failed.length ? 1 : 0);
} catch (e) {
  if (e instanceof ContentError) { console.error(e.message); process.exit(1); }
  throw e;
}
