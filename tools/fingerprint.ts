// CLI: npm run fingerprint [-- --runs N]. A behaviour fingerprint for refactors that must not
// change play: hashes every view and state across the scripted plans and seeded bot runs, the
// dynasty exports, save round-trips and the validator's output, per channel. Run it before and
// after a change and compare; a channel that differs names what changed.
import { createHash, type Hash } from 'node:crypto';
import { loadContent } from './content-loader';
import { playOnce, DEFAULT_POLICIES, loadPlans, playPlan } from './bot-lib';
import { validate } from './validate-lib';
import { view, type GameState } from '../src/game/index';
import { toDynasty } from '../src/game/dynasty';
import { toSave, fromSave } from '../src/game/save';

const arg = process.argv.indexOf('--runs');
const runs = arg >= 0 ? Number(process.argv[arg + 1]) : 6;
const c = loadContent();
const total = createHash('sha256');
const channels: Record<string, Hash> = {};
const feed = (channel: string, v: unknown) => {
  const s = JSON.stringify(v);
  total.update(s);
  (channels[channel] ??= createHash('sha256')).update(s);
};

feed('hash', c.hash);
const observe = (s: GameState) => { feed('state', s); feed('view', view(c, s)); };
for (const p of loadPlans()) {
  const r = playPlan(c, p, 500, observe);
  feed('plan', r.state);
  try { feed('dynasty', toDynasty(r.state, c)); } catch (e) { feed('dynasty', String(e)); }
  feed('save', fromSave(JSON.parse(JSON.stringify(toSave(r.state, c))), c));
}
for (const bg of Object.keys(c.backgrounds)) {
  for (const policy of DEFAULT_POLICIES) {
    for (let seed = 1; seed <= runs; seed++) feed('bot', playOnce(c, bg, seed * 7919, policy, 2000, observe));
  }
}
feed('validate', validate(c));

console.log(`fingerprint (${runs} bot runs per background and policy)`);
console.log('total    ', total.digest('hex').slice(0, 16));
for (const [k, v] of Object.entries(channels)) console.log(k.padEnd(9), v.digest('hex').slice(0, 16));
