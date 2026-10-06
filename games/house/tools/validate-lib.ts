// House of Adalia's validator: the shared checks (packages/tools) plus this game's own: the
// openings and their frames and sovereigns, the west effect, and the frame rule (frames.ts).
import { validateContent, type Issue } from '@tools/validate';
import { FRAMES, type ContentBundle, type Scene } from '../src/content/schema';
import { checkFrames } from './frames';

export function validate(content: ContentBundle): Issue[] {
  const reg = content.registry;
  const extra: Issue[] = [];
  const err = (where: string, message: string) => extra.push({ severity: 'error', where, message });

  for (const f of FRAMES) if (!reg.frames[f]) err('registry/frames.yaml', `no entry for the ${f} frame`);
  for (const [id, sv] of Object.entries(reg.sovereigns)) if (!reg.frames[sv.frame]) err(`sovereigns/${id}`, `unknown frame "${sv.frame}"`);
  for (const op of Object.values(content.openings)) {
    const w = `openings/${op.id}`;
    if (!content.config.stations.includes(op.founder.station)) err(w, `unknown station "${op.founder.station}"`);
    for (const a of Object.keys(op.founder.attributes)) if (!content.config.attributes.includes(a)) err(w, `unknown attribute "${a}"`);
    for (const k of Object.keys(op.founder.skills)) if (!content.config.skills.includes(k)) err(w, `unknown skill "${k}"`);
    for (const f of op.frames) if (!op.sovereigns[f]?.length) err(w, `no sovereign for the ${f} frame`);
    for (const [f, list] of Object.entries(op.sovereigns)) {
      if (!op.frames.includes(f as never)) err(w, `sovereigns for ${f}, which the opening does not start in`);
      for (const sv of list) {
        if (!reg.sovereigns[sv]) err(w, `unknown sovereign "${sv}"`);
        else if (reg.sovereigns[sv].frame !== f) err(w, `${sv} rules a ${reg.sovereigns[sv].frame} West, not ${f}`);
      }
    }
  }

  const issues = validateContent(content, {
    starts: [...new Set(Object.values(content.openings).map((o) => o.start_scene))],
    variantKeys: [...FRAMES],
    deathContinues: true,
    queuedByGame: ['h_q_news', 'h_q_succession'],
    checkGameEffect: (where, e, err) => {
      if ('west' in e) {
        const w = (e as { west: { frame?: string; sovereign?: string } }).west;
        if (!w.frame && !w.sovereign) err(where, 'west: names neither a frame nor a sovereign');
        if (w.sovereign && !reg.sovereigns[w.sovereign]) err(where, `west: unknown sovereign "${w.sovereign}"`);
        if (w.frame && w.sovereign && reg.sovereigns[w.sovereign] && reg.sovereigns[w.sovereign]!.frame !== w.frame) err(where, `west: ${w.sovereign} does not rule a ${w.frame} West`);
        if (w.frame && !w.sovereign) err(where, 'west: a change of frame must name the new sovereign');
      }
    },
    checkScene: (where, s, err) => {
      for (const i of checkFrames(content, s as Scene, where)) err(i.where, i.message);
    },
  });
  return [...extra, ...issues];
}
